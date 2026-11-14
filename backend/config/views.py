from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connection
from django.http import JsonResponse


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
    """Confirms the app can really talk to the database."""
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        users = get_user_model().objects.count()
        return JsonResponse({"status": "ok", "database": connection.vendor, "users": users})
    except Exception as exc:  # noqa: BLE001 - we want to report any DB failure
        payload = {"status": "error"}
        if settings.DEBUG:
            payload["detail"] = str(exc)
        return JsonResponse(payload, status=503)
