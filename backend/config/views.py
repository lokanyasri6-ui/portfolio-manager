import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection
from django.http import JsonResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def api_root(request):
    """Simple map of the API so beginners can see what exists."""
    return JsonResponse({
        "project": "Personal Investment Portfolio Manager - backend API",
        "health_check": "/api/health/",
        "auth": {
            "register": "/api/auth/register/",
            "login": "/api/auth/login/",
            "logout": "/api/auth/logout/",
            "me": "/api/auth/me/",
        },
        "investments": "/api/investments/",
        "portfolio": {
            "dashboard": "/api/portfolio/dashboard/",
            "summary": "/api/portfolio/summary/",
            "holdings": "/api/portfolio/holdings/",
            "allocation": "/api/portfolio/allocation/",
            "category_summary": "/api/portfolio/category-summary/",
            "profit_loss": "/api/portfolio/profit-loss/",
            "performance": "/api/portfolio/performance/",
        },
        "reports": "/api/reports/",
        "admin": {
            "stats": "/api/admin/stats/",
            "users": "/api/admin/users/",
            "activity": "/api/admin/activity/",
        },
        "browser_login_for_testing": "/api-auth/login/",
        "django_admin_site": "/django-admin/",
    })


def health(request):
    """Confirms the app can talk to the database, auto-migrating if tables are missing."""
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        # Ensure tables exist
        try:
            users = get_user_model().objects.count()
        except Exception:
            logger.info("Tables missing in health check; running auto-migration...")
            from django.core.management import call_command
            call_command("migrate", interactive=False)
            users = get_user_model().objects.count()

        return JsonResponse({"status": "ok", "database": connection.vendor, "users": users})
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Health check failed: {exc}", exc_info=True)
        return JsonResponse({"status": "error", "detail": str(exc)}, status=503)


def custom_exception_handler(exc, context):
    """Ensure all DRF and unhandled API errors return JSON, never HTML 500."""
    response = exception_handler(exc, context)
    if response is not None:
        return response

    logger.error(f"Unhandled exception in API request: {exc}", exc_info=True)
    error_msg = str(exc) if str(exc) else "An unexpected internal server error occurred."
    return Response(
        {"detail": error_msg, "error": exc.__class__.__name__},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def custom_500(request):
    """Django fallback 500 handler returning JSON instead of HTML."""
    return JsonResponse(
        {"detail": "Internal server error. Please try again later.", "status": 500},
        status=500,
    )


def custom_404(request, exception=None):
    """Django fallback 404 handler returning JSON instead of HTML."""
    return JsonResponse(
        {"detail": "Endpoint not found.", "status": 404},
        status=404,
    )
