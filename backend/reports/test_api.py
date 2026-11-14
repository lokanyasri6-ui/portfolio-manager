from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from investments.models import Investment

from .models import Report

User = get_user_model()
PASSWORD = "Str0ng!Pass#2026"


class ReportApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("abc", "abc@example.com", PASSWORD, full_name="ABC Investor")
        Investment.objects.create(user=self.user, name="Stock", category="stocks", units=10, purchase_price=100,
                                  current_price=120, investment_date=timezone.localdate())
        self.other = User.objects.create_user("zed", "zed@example.com", PASSWORD, full_name="Zed")
        self.client.force_authenticate(self.user)

    def test_generate_list_detail(self):
        r = self.client.post("/api/reports/generate/")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["total_investment"], 1000.0)
        self.assertEqual(r.data["profit"], 200.0)
        self.assertEqual(len(r.data["holdings"]), 1)
        self.assertEqual(len(r.data["allocation"]), 3)
        self.assertEqual(len(self.client.get("/api/reports/").data), 1)
        self.assertEqual(self.client.get(f"/api/reports/{r.data['id']}/").status_code, 200)

    def test_report_is_a_snapshot(self):
        r = self.client.post("/api/reports/generate/")
        Investment.objects.update(current_price=500)
        self.assertEqual(self.client.get(f"/api/reports/{r.data['id']}/").data["current_value"], 1200.0)

    def test_downloads(self):
        rid = self.client.post("/api/reports/generate/").data["id"]
        pdf = self.client.get(f"/api/reports/{rid}/pdf/")
        self.assertEqual(pdf.status_code, 200)
        self.assertEqual(pdf["Content-Type"], "application/pdf")
        self.assertTrue(pdf.content.startswith(b"%PDF"))
        csv_response = self.client.get(f"/api/reports/{rid}/csv/")
        self.assertEqual(csv_response.status_code, 200)
        self.assertIn("text/csv", csv_response["Content-Type"])
        self.assertIn("Total Investment,1000.00", csv_response.content.decode("utf-8"))

    def test_empty_portfolio_report(self):
        self.client.force_authenticate(self.other)
        r = self.client.post("/api/reports/generate/")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["total_investment"], 0.0)
        self.assertEqual(self.client.get(f"/api/reports/{r.data['id']}/pdf/").status_code, 200)

    def test_other_users_reports_are_private(self):
        rid = self.client.post("/api/reports/generate/").data["id"]
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/reports/").data, [])
        for suffix in ("", "pdf/", "csv/"):
            self.assertEqual(self.client.get(f"/api/reports/{rid}/{suffix}").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/reports/{rid}/").status_code, 404)
        self.assertTrue(Report.objects.filter(pk=rid).exists())

    def test_login_required(self):
        self.client.force_authenticate(None)
        self.assertIn(self.client.post("/api/reports/generate/").status_code, (401, 403))
