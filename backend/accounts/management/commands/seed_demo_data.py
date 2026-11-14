"""
Creates sample users and investments for DEVELOPMENT and TESTING only.

    python manage.py seed_demo_data

Safe to run more than once (it will not create duplicates).
"""
import os
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from investments.models import Investment

User = get_user_model()

DEFAULT_ADMIN_PASSWORD = "Admin@12345"
DEFAULT_USER_PASSWORD = "Investor@12345"


class Command(BaseCommand):
    help = "Create demo administrator, demo investors and sample investments (development only)."

    @transaction.atomic
    def handle(self, *args, **options):
        admin_pw = os.environ.get("DEMO_ADMIN_PASSWORD") or DEFAULT_ADMIN_PASSWORD
        user_pw = os.environ.get("DEMO_USER_PASSWORD") or DEFAULT_USER_PASSWORD
        today = timezone.localdate()

        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.com", "full_name": "System Administrator",
                      "is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password(admin_pw)
            admin.save()

        # ABC = the worked example from the project documentation:
        # invested 3000, current 3200, profit 200, return 6.67%
        abc = self._investor("abc", "abc@example.com", "ABC Investor", user_pw)
        self._add(abc, today, [
            ("Sample Stock Ltd", "stocks", "10", "100", "120", 90),
            ("Sample Mutual Fund", "mutual_funds", "20", "50", "45", 60),
            ("Sample Gold Bond", "others", "5", "200", "220", 30),
        ])

        # A second investor (with a loss) so you can test that data stays private.
        priya = self._investor("priya", "priya@example.com", "Priya Sharma", user_pw)
        self._add(priya, today, [
            ("Tech Index Stock", "stocks", "50", "250.00", "230.50", 120),
            ("Balanced Fund", "mutual_funds", "100.5", "30.1234", "28.5000", 75),
            ("Fixed Deposit Alt", "others", "2", "5000", "5000", 20),
        ])

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        self.stdout.write("  Administrator : admin  /  " + (admin_pw if created else "(existing password unchanged)"))
        self.stdout.write(f"  Investor ABC  : abc    /  {user_pw}")
        self.stdout.write(f"  Investor Priya: priya  /  {user_pw}")
        self.stdout.write(self.style.WARNING("These accounts are for development only. Never use them in production."))

    def _investor(self, username, email, full_name, password):
        user, created = User.objects.get_or_create(
            username=username, defaults={"email": email, "full_name": full_name})
        if created:
            user.set_password(password)
            user.save()
        return user

    def _add(self, user, today, rows):
        if user.investments.exists():
            return
        for name, category, units, buy, now, days_ago in rows:
            Investment.objects.create(
                user=user, name=name, category=category, units=Decimal(units),
                purchase_price=Decimal(buy), current_price=Decimal(now),
                investment_date=today - timedelta(days=days_ago),
                notes="Sample record created by seed_demo_data",
            )
