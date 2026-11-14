from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import ActivityLog

User = get_user_model()
PASSWORD = "Str0ng!Pass#2026"


class AdminModuleTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("boss", "boss@example.com", PASSWORD, full_name="Boss",
                                              role="admin")
        self.investor = User.objects.create_user("asha", "asha@example.com", PASSWORD, full_name="Asha")

    # --- access control -------------------------------------------------
    def test_investor_is_denied_every_admin_endpoint(self):
        self.client.force_authenticate(self.investor)
        for url in ("/api/admin/stats/", "/api/admin/users/", "/api/admin/activity/",
                    f"/api/admin/users/{self.admin.pk}/"):
            self.assertEqual(self.client.get(url).status_code, 403, url)
        self.assertEqual(self.client.post(f"/api/admin/users/{self.admin.pk}/deactivate/").status_code, 403)

    def test_anonymous_is_denied(self):
        self.assertIn(self.client.get("/api/admin/stats/").status_code, (401, 403))

    # --- statistics -----------------------------------------------------
    def test_stats(self):
        self.client.force_authenticate(self.admin)
        d = self.client.get("/api/admin/stats/").data
        self.assertEqual(d["total_users"], 2)
        self.assertEqual(d["active_users"], 2)
        self.assertEqual(d["admin_count"], 1)
        self.assertEqual(d["investor_count"], 1)
        self.assertEqual(set(d["investments_by_category"]), {"stocks", "mutual_funds", "others"})

    # --- user management ------------------------------------------------
    def test_list_search_filter(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(len(self.client.get("/api/admin/users/").data), 2)
        self.assertEqual(len(self.client.get("/api/admin/users/?q=asha").data), 1)
        self.assertEqual(len(self.client.get("/api/admin/users/?role=admin").data), 1)

    def test_deactivate_blocks_login_and_activate_restores_it(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(f"/api/admin/users/{self.investor.pk}/deactivate/")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data["is_active"])
        self.assertTrue(ActivityLog.objects.filter(action="user_deactivated").exists())

        self.client.force_authenticate(None)
        login = {"username": "asha", "password": PASSWORD}
        self.assertEqual(self.client.post("/api/auth/login/", login, format="json").status_code, 400)

        self.client.force_authenticate(self.admin)
        self.client.post(f"/api/admin/users/{self.investor.pk}/activate/")
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/auth/login/", login, format="json").status_code, 200)

    def test_admin_cannot_lock_themselves_out(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f"/api/admin/users/{self.admin.pk}/deactivate/").status_code, 400)
        r = self.client.patch(f"/api/admin/users/{self.admin.pk}/", {"role": "investor"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)
        self.assertEqual(self.admin.role, "admin")

    def test_admin_creates_and_updates_user(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post("/api/admin/users/", {"username": "newbie", "email": "n@example.com",
                                                   "full_name": "New Bie", "password": PASSWORD}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["role"], "investor")
        uid = r.data["id"]
        r = self.client.patch(f"/api/admin/users/{uid}/", {"full_name": "Renamed"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(User.objects.get(pk=uid).full_name, "Renamed")
        dup = self.client.post("/api/admin/users/", {"username": "x", "email": "N@example.com",
                                                     "full_name": "X", "password": PASSWORD}, format="json")
        self.assertEqual(dup.status_code, 400)

    # --- activity monitoring -------------------------------------------
    def test_activity_log_records_events(self):
        self.client.post("/api/auth/login/", {"username": "asha", "password": PASSWORD}, format="json")
        self.client.post("/api/auth/login/", {"username": "asha", "password": "wrong"}, format="json")
        self.client.force_authenticate(self.admin)
        d = self.client.get("/api/admin/activity/").data
        actions = {row["action"] for row in d["results"]}
        self.assertTrue({"login", "login_failed"} <= actions)
        self.assertEqual(len(self.client.get("/api/admin/activity/?action=login").data["results"]), 1)
