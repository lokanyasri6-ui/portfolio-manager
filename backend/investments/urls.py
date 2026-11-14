from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import InvestmentViewSet, portfolio_view, reports_view

router = SimpleRouter()
router.register("investments", InvestmentViewSet, basename="investment")

urlpatterns = [
    path("portfolio/", portfolio_view, name="portfolio"),
    path("reports/", reports_view, name="reports"),
] + router.urls