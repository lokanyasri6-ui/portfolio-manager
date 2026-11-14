from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """Audit trail used by the administrator's 'monitor system activities' screen."""

    class Action(models.TextChoices):
        REGISTER = "register", "Registered"
        LOGIN = "login", "Logged in"
        LOGIN_FAILED = "login_failed", "Failed login"
        LOGOUT = "logout", "Logged out"
        INVESTMENT_CREATED = "investment_created", "Investment added"
        INVESTMENT_UPDATED = "investment_updated", "Investment updated"
        INVESTMENT_DELETED = "investment_deleted", "Investment deleted"
        REPORT_GENERATED = "report_generated", "Report generated"
        REPORT_DOWNLOADED = "report_downloaded", "Report downloaded"
        USER_CREATED = "user_created", "User created by admin"
        USER_UPDATED = "user_updated", "User updated by admin"
        USER_ACTIVATED = "user_activated", "User activated"
        USER_DEACTIVATED = "user_deactivated", "User deactivated"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="activity_logs",
    )
    action = models.CharField(max_length=30, choices=Action.choices)
    description = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["action"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} {self.action}"
