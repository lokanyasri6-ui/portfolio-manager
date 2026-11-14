from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class PortfolioUserAdmin(UserAdmin):
    list_display = ("username", "email", "full_name", "role", "is_active", "date_joined")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("username", "email", "full_name")
    fieldsets = UserAdmin.fieldsets + (("Portfolio Manager", {"fields": ("full_name", "role")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Portfolio Manager", {"fields": ("email", "full_name", "role")}),
    )
