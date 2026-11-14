import logging

from .models import ActivityLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """
    Uses REMOTE_ADDR only. (X-Forwarded-For can be faked by users; when you deploy
    behind a proxy you can configure this properly.)
    """
    if request is None:
        return None
    return request.META.get("REMOTE_ADDR") or None


def log_activity(request, user, action, description=""):
    """Write one row to activity_logs. Logging must never break the real request."""
    try:
        ActivityLog.objects.create(
            user=user if getattr(user, "is_authenticated", False) else None,
            action=action,
            description=str(description)[:255],
            ip_address=get_client_ip(request),
        )
    except Exception:  # noqa: BLE001
        logger.exception("Could not write activity log")
