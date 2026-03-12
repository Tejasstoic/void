import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class IPAbuseDetectionMiddleware(MiddlewareMixin):
    """
    Rate-tracks requests per IP and blocks abusive IPs.
    Uses Django cache (Redis in production) for tracking.
    """
    RATE_LIMIT = 200  # requests per window
    WINDOW_SECONDS = 60  # 1 minute window
    BLOCK_DURATION = 300  # 5 minute block

    def process_request(self, request):
        ip = self._get_client_ip(request)
        if not ip:
            return None

        block_key = f'ip_blocked:{ip}'
        if cache.get(block_key):
            return JsonResponse(
                {'error': 'Too many requests. Please try again later.'},
                status=429
            )

        rate_key = f'ip_rate:{ip}'
        count = cache.get(rate_key, 0)

        if count >= self.RATE_LIMIT:
            cache.set(block_key, True, self.BLOCK_DURATION)
            logger.warning(f'IP {ip} blocked for abuse: {count} requests in {self.WINDOW_SECONDS}s')
            return JsonResponse(
                {'error': 'Rate limit exceeded. You have been temporarily blocked.'},
                status=429
            )

        cache.set(rate_key, count + 1, self.WINDOW_SECONDS)
        return None

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class RequestLoggingMiddleware(MiddlewareMixin):
    """Logs request metadata for audit trail (no PII logged)."""

    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            if duration > 2.0:  # Only log slow requests
                logger.warning(
                    f'SLOW REQUEST: {request.method} {request.path} '
                    f'took {duration:.2f}s (status={response.status_code})'
                )
        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Add security headers to all responses."""

    def process_response(self, request, response):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        if not request.path.startswith('/admin/'):
            response['Content-Security-Policy'] = "default-src 'self'"
        return response
