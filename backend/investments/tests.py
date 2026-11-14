from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Investment

User = get_user_model()
PASSWORD = "Str0ng!Pass#2026"


def valid_payload(**overrides):
    data = {"name": "Infosys Ltd", "category": "stocks", "units": "10", "purchase_price": "100.00",
            "current_price": "120.00", "investment_date": str(timezone.localdate() - timedelta(days=5)),
            "notes": "long term"}
    data.update(overrides)
    return data


class InvestmentCrudTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("asha", "asha@example.com", PASSWORD, full_name="Asha")
        self.other = User.objects.create_user("ravi", "ravi@example.com", PASSWORD, full_name="Ravi")
        self.client.force_authenticate(self.user)

    def test_add_view_update_delete(self):
        r = self.client.post("/api/investments/", valid_payload(), format="json")
        self.assertEqual(r.status_code, 201)
        pk = r.data["id"]
        self.assertEqual(r.data["invested_amount"], 1000.0)
        self.assertEqual(r.data["current_value"], 1200.0)
        self.assertEqual(Investment.objects.get(pk=pk).user, self.user)   # saved in the database, owned by user

        self.assertEqual(self.client.get(f"/api/investments/{pk}/").data["name"], "Infosys Ltd")

        r = self.client.patch(f"/api/investments/{pk}/", {"current_price": "90.00"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["profit_loss"], -100.0)
        self.assertEqual(Investment.objects.get(pk=pk).current_price, Decimal("90.0000"))

        self.assertEqual(self.client.delete(f"/api/investments/{pk}/").status_code, 204)
        self.assertFalse(Investment.objects.filter(pk=pk).exists())

    def test_user_cannot_send_user_field(self):
        r = self.client.post("/api/investments/", valid_payload(user=self.other.pk), format="json")
        self.assertEqual(Investment.objects.get(pk=r.data["id"]).user, self.user)

    def test_validation_errors(self):
        cases = {
            "units": "0", "purchase_price": "-5", "current_price": "-1",
            "category": "crypto", "name": " ", "investment_date": "2999-01-01",
        }
        for field, bad in cases.items():
            r = self.client.post("/api/investments/", valid_payload(**{field: bad}), format="json")
            self.assertEqual(r.status_code, 400, field)
            self.assertIn(field, r.data, field)
        self.assertEqual(Investment.objects.count(), 0)

    def test_text_in_number_field(self):
        r = self.client.post("/api/investments/", valid_payload(units="abc"), format="json")
        self.assertEqual(r.status_code, 400)

    def test_current_price_zero_is_allowed(self):
        r = self.client.post("/api/investments/", valid_payload(current_price="0"), format="json")
        self.assertEqual(r.status_code, 201)

    def test_search_filter_and_categories(self):
        self.client.post("/api/investments/", valid_payload(name="TCS"), format="json")
        self.client.post("/api/investments/", valid_payload(name="HDFC Fund", category="mutual_funds"), format="json")
        self.assertEqual(len(self.client.get("/api/investments/?search=tcs").data), 1)
        self.assertEqual(len(self.client.get("/api/investments/?category=mutual_funds").data), 1)
        self.assertEqual(self.client.get("/api/investments/?category=bad").status_code, 400)
        self.assertEqual(len(self.client.get("/api/investments/categories/").data), 3)

    def test_other_users_data_is_invisible(self):
        theirs = Investment.objects.create(user=self.other, name="Secret", category="stocks", units=1,
                                           purchase_price=10, current_price=10,
                                           investment_date=timezone.localdate())
        self.assertEqual(self.client.get("/api/investments/").data, [])
        self.assertEqual(self.client.get(f"/api/investments/{theirs.pk}/").status_code, 404)
        self.assertEqual(self.client.patch(f"/api/investments/{theirs.pk}/", {"name": "Hacked"},
                                           format="json").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/investments/{theirs.pk}/").status_code, 404)
        theirs.refresh_from_db()
        self.assertEqual(theirs.name, "Secret")

    def test_login_required(self):
        self.client.force_authenticate(None)
        self.assertIn(self.client.get("/api/investments/").status_code, (401, 403))
        self.assertIn(self.client.post("/api/investments/", valid_payload(), format="json").status_code, (401, 403))


class InvestmentModelConstraintTests(APITestCase):
    def test_database_rejects_zero_units(self):
        user = User.objects.create_user("asha", "asha@example.com", PASSWORD)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Investment.objects.create(user=user, name="Bad", category="stocks", units=0,
                                          purchase_price=10, current_price=10,
                                          investment_date=timezone.localdate())

    def test_deleting_user_deletes_their_investments(self):
        user = User.objects.create_user("asha", "asha@example.com", PASSWORD)
        Investment.objects.create(user=user, name="A", category="stocks", units=1, purchase_price=10,
                                  current_price=10, investment_date=timezone.localdate())
        user.delete()
        self.assertEqual(Investment.objects.count(), 0)
