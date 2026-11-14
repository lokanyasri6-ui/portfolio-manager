from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from investments.models import Investment

User = get_user_model()
PASSWORD = "Str0ng!Pass#2026"


def add(user, name, category, units, buy, now):
    return Investment.objects.create(user=user, name=name, category=category, units=units, purchase_price=buy,
                                     current_price=now, investment_date=timezone.localdate())


class PortfolioApiTests(APITestCase):
    def setUp(self):
        self.abc = User.objects.create_user("abc", "abc@example.com", PASSWORD, full_name="ABC")
        add(self.abc, "Stock", "stocks", 10, 100, 120)
        add(self.abc, "Fund", "mutual_funds", 20, 50, 45)
        add(self.abc, "Gold", "others", 5, 200, 220)
        # Another user's data must never leak into ABC's numbers
        rival = User.objects.create_user("rival", "rival@example.com", PASSWORD, full_name="Rival")
        add(rival, "Rival Stock", "stocks", 1000, 1000, 1)
        self.client.force_authenticate(self.abc)

    def test_summary_matches_documentation_example(self):
        d = self.client.get("/api/portfolio/summary/").data
        self.assertEqual(d["total_investment"], 3000.0)
        self.assertEqual(d["current_value"], 3200.0)
        self.assertEqual(d["profit"], 200.0)
        self.assertEqual(d["loss"], 0.0)
        self.assertEqual(d["return_percentage"], 6.67)
        self.assertEqual(d["status"], "profit")

    def test_allocation(self):
        d = self.client.get("/api/portfolio/allocation/").data
        self.assertEqual(d["chart"]["labels"], ["Stocks", "Mutual Funds", "Others"])
        self.assertEqual(d["chart"]["percentages"], [37.5, 28.13, 34.38])

    def test_holdings_with_filters(self):
        d = self.client.get("/api/portfolio/holdings/").data
        self.assertEqual(d["count"], 3)
        self.assertEqual(len(self.client.get("/api/portfolio/holdings/?category=stocks").data["holdings"]), 1)
        self.assertEqual(len(self.client.get("/api/portfolio/holdings/?search=gold").data["holdings"]), 1)
        self.assertEqual(self.client.get("/api/portfolio/holdings/?category=x").status_code, 400)

    def test_dashboard_profit_loss_category_performance(self):
        d = self.client.get("/api/portfolio/dashboard/").data
        for key in ("summary", "allocation", "category_summary", "performance", "recent_investments"):
            self.assertIn(key, d)
        self.assertEqual(len(d["recent_investments"]), 3)
        pl = self.client.get("/api/portfolio/profit-loss/").data
        self.assertEqual(len(pl["top_gainers"]), 2)
        self.assertEqual(len(pl["top_losers"]), 1)
        cats = self.client.get("/api/portfolio/category-summary/").data["categories"]
        self.assertEqual(len(cats), 3)
        self.assertEqual(self.client.get("/api/portfolio/performance/").status_code, 200)

    def test_new_user_gets_zeros_not_errors(self):
        newbie = User.objects.create_user("new", "new@example.com", PASSWORD, full_name="New")
        self.client.force_authenticate(newbie)
        d = self.client.get("/api/portfolio/summary/").data
        self.assertEqual((d["total_investment"], d["return_percentage"]), (0.0, 0.0))
        self.assertEqual(self.client.get("/api/portfolio/allocation/").data["chart"]["percentages"], [0.0, 0.0, 0.0])

    def test_login_required(self):
        self.client.force_authenticate(None)
        self.assertIn(self.client.get("/api/portfolio/summary/").status_code, (401, 403))
