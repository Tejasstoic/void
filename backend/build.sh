#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Create superuser from environment variables if provided
if [[ -n "$DJANGO_SUPERUSER_EMAIL" && -n "$DJANGO_SUPERUSER_PASSWORD" ]]; then
  echo "Ensuring superuser exists..."
  python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(email='$DJANGO_SUPERUSER_EMAIL').exists() or User.objects.create_superuser('$DJANGO_SUPERUSER_EMAIL', 'admin', '$DJANGO_SUPERUSER_PASSWORD', date_of_birth='2000-01-01')"
fi
