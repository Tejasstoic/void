from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data.get('email'))
            response.data['user'] = UserSerializer(user).data
        return response

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
            except IntegrityError:
                return Response(
                    {"detail": "Registration conflict. Please try again."},
                    status=status.HTTP_409_CONFLICT
                )
            return Response(
                {"message": "User created successfully", "user": UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class LogoutView(APIView):
    """POST /api/users/logout/ — Blacklist the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Logged out successfully."})
        except Exception:
            return Response({"message": "Logged out."})

class ProfileView(APIView):
    """GET /api/users/profile/ — Current user profile with stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from content.models import Post
        from reputation.models import ReputationScore, UserBadge

        post_count = Post.objects.filter(author=user, is_deleted=False).count()

        # Reputation
        try:
            rep = user.reputation
            reputation_data = {
                'composite_score': rep.composite_score,
                'total_posts': rep.total_posts,
                'total_engagement': rep.total_engagement,
                'total_reactions_received': rep.total_reactions_received,
            }
        except ReputationScore.DoesNotExist:
            reputation_data = {
                'composite_score': 50.0,
                'total_posts': 0,
                'total_engagement': 0,
                'total_reactions_received': 0,
            }

        # Badges
        badges = UserBadge.objects.filter(user=user).select_related('badge')
        badge_data = [
            {'type': b.badge.badge_type, 'icon': b.badge.icon, 'name': b.badge.display_name, 'earned_at': b.earned_at}
            for b in badges
        ]

        return Response({
            'user': UserSerializer(user).data,
            'post_count': post_count,
            'reputation': reputation_data,
            'badges': badge_data,
        })

class UserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('-created_at')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'https://void-gamma-sooty.vercel.app/'
    client_class = OAuth2Client

    def post(self, request, *args, **kwargs):
        from django.conf import settings
        import logging
        import traceback
        logger = logging.getLogger(__name__)

        google_settings = getattr(settings, 'SOCIALACCOUNT_PROVIDERS', {}).get('google', {})
        client_id = google_settings.get('APP', {}).get('client_id')

        if not client_id:
            logger.error("GOOGLE_CLIENT_ID is not configured")
            return Response(
                {"detail": "Backend configuration error: GOOGLE_CLIENT_ID is missing."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code <= 201:
                if hasattr(self, 'user'):
                    response.data['user'] = UserSerializer(self.user).data
            return response
        except Exception as e:
            error_msg = str(e)
            stack_trace = traceback.format_exc()
            logger.error(f"Google Auth Error: {error_msg}\n{stack_trace}")
            return Response(
                {"detail": f"Backend Auth Error: {error_msg}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
