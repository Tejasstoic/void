from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, date_of_birth, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        if not date_of_birth:
            raise ValueError('Users must have a date of birth')
            
        user = self.model(
            email=self.normalize_email(email),
            date_of_birth=date_of_birth,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, date_of_birth, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, date_of_birth, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('mod', 'Moderator'),
        ('admin', 'Admin'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(verbose_name='email address', max_length=255, unique=True)
    date_of_birth = models.DateField()
    
    # Platform specific
    alias = models.CharField(max_length=50, unique=True, blank=True, null=True) # Optional randomized alias
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    strike_count = models.IntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    suspension_end = models.DateTimeField(null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['date_of_birth']

    def __str__(self):
        return self.email

    @property
    def is_18_plus(self):
        today = timezone.now().date()
        age = today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return age >= 18
