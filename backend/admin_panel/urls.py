from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("users", views.AdminUserViewSet, basename="admin-user")

urlpatterns = [
    path("stats/", views.StatsView.as_view(), name="admin-stats"),
    path("activity/", views.ActivityLogListView.as_view(), name="admin-activity"),
] + router.urls
