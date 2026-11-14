from django.contrib import admin
from django.urls import include, path

from . import views

urlpatterns = [
    path("", views.api_root, name="api-root"),
    path("api/health/", views.health, name="health"),
    path("django-admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),   # browser login for the browsable API
    path("api/auth/", include("accounts.urls")),
    path("api/", include("investments.urls")),
    path("api/portfolio/", include("portfolio.urls")),
    path("api/", include("reports.urls")),
    path("api/admin/", include("admin_panel.urls")),
]
