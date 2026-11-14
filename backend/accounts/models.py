from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user. Passwords are hashed by Django (never stored in plain text).
    `is_active` is used by the administrator to activate / deactivate accounts.
    """

    class Role(models.TextChoices):
        INVESTOR = "investor", "Investor"
        ADMIN = "admin", "Administrator"

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.INVESTOR, db_index=True)

    class Meta:
        db_table = "users"

    def save(self, *args, **kwargs):
        self.email = (self.email or "").strip().lower()
        if self.is_superuser:          # `createsuperuser` accounts are always administrators
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN

    def __str__(self):
        return self.username
