from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.DashboardView.as_view(), name="portfolio-dashboard"),
    path("summary/", views.SummaryView.as_view(), name="portfolio-summary"),
    path("holdings/", views.HoldingsView.as_view(), name="portfolio-holdings"),
    path("allocation/", views.AllocationView.as_view(), name="portfolio-allocation"),
    path("category-summary/", views.CategorySummaryView.as_view(), name="portfolio-category-summary"),
    path("profit-loss/", views.ProfitLossView.as_view(), name="portfolio-profit-loss"),
    path("performance/", views.PerformanceView.as_view(), name="portfolio-performance"),
]
