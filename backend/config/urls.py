from django.contrib import admin
from django.urls import include, path

from . import views

urlpatterns = [
    path("", views.api_root, name="api-root"),
    path("health/", views.health, name="health-root"),
    path("api/health/", views.health, name="health"),
    path("django-admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),

    # Auth routes (support both /api/auth/ and /auth/)
    path("api/auth/", include("accounts.urls")),
    path("auth/", include("accounts.urls")),

    # Investment routes (support both /api/ and /)
    path("api/", include("investments.urls")),
    path("", include("investments.urls")),

    # Portfolio routes (support both /api/portfolio/ and /portfolio/)
    path("api/portfolio/", include("portfolio.urls")),
    path("portfolio/", include("portfolio.urls")),

    # Reports routes
    path("api/", include("reports.urls")),
    path("", include("reports.urls")),

    # Admin routes
    path("api/admin/", include("admin_panel.urls")),
    path("admin/", include("admin_panel.urls")),
]

handler500 = "config.views.custom_500"
handler404 = "config.views.custom_404"
