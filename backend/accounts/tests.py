from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from admin_panel.models import ActivityLog

User = get_user_model()
PASSWORD = "Str0ng!Pass#2026"


class RegistrationTests(APITestCase):
    url = "/api/auth/register/"

    def payload(self, **overrides):
        data = {"full_name": "Asha Rao", "email": "asha@example.com", "username": "asha",
                "password": PASSWORD, "confirm_password": PASSWORD}
        data.update(overrides)
        return data

    def test_register_success_hashes_password(self):
        response = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="asha")
        self.assertNotEqual(user.password, PASSWORD)
        self.assertTrue(user.password.startswith("pbkdf2_"))
        self.assertTrue(user.check_password(PASSWORD))
        self.assertEqual(user.role, "investor")
        self.assertNotIn("password", response.data["user"])
        self.assertTrue(ActivityLog.objects.filter(action="register").exists())

    def test_cannot_register_as_admin(self):
        self.client.post(self.url, self.payload(role="admin", is_superuser=True), format="json")
        user = User.objects.get(username="asha")
        self.assertEqual(user.role, "investor")
        self.assertFalse(user.is_superuser)

    def test_password_mismatch(self):
        r = self.client.post(self.url, self.payload(confirm_password="different"), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("confirm_password", r.data)

    def test_weak_password_rejected(self):
        r = self.client.post(self.url, self.payload(password="12345678", confirm_password="12345678"),
                             format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("password", r.data)

    def test_duplicate_email_and_username(self):
        self.client.post(self.url, self.payload(), format="json")
        r = self.client.post(self.url, self.payload(username="other", email="ASHA@example.com"), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("email", r.data)
        r = self.client.post(self.url, self.payload(username="ASHA", email="new@example.com"), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("username", r.data)

    def test_missing_fields(self):
        r = self.client.post(self.url, {}, format="json")
        self.assertEqual(r.status_code, 400)
        for field in ("full_name", "email", "username", "password", "confirm_password"):
            self.assertIn(field, r.data)


class LoginLogoutTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("asha", "asha@example.com", PASSWORD, full_name="Asha Rao")

    def login(self, identifier, password=PASSWORD):
        return self.client.post("/api/auth/login/", {"username": identifier, "password": password}, format="json")

    def test_login_with_username_and_email(self):
        self.assertEqual(self.login("asha").status_code, 200)
        self.client.post("/api/auth/logout/")
        r = self.login("ASHA@example.com")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["redirect"], "dashboard")

    def test_wrong_password(self):
        r = self.login("asha", "wrong-password")
        self.assertEqual(r.status_code, 400)
        self.assertTrue(ActivityLog.objects.filter(action="login_failed").exists())

    def test_inactive_user_cannot_login(self):
        self.user.is_active = False
        self.user.save()
        r = self.login("asha")
        self.assertEqual(r.status_code, 400)
        self.assertIn("deactivated", str(r.data))

    def test_me_requires_login_then_logout_blocks_again(self):
        self.assertIn(self.client.get("/api/auth/me/").status_code, (401, 403))
        self.login("asha")
        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["username"], "asha")
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 200)
        self.assertIn(self.client.get("/api/auth/me/").status_code, (401, 403))

    def test_superuser_gets_admin_role(self):
        boss = User.objects.create_superuser("boss", "boss@example.com", PASSWORD)
        self.assertEqual(boss.role, "admin")
        r = self.login("boss")
        self.assertEqual(r.data["redirect"], "admin-dashboard")


class HealthCheckTests(APITestCase):
    def test_database_connection(self):
        r = self.client.get("/api/health/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ok")
