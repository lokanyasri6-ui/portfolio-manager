from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "generated_at", "total_investment", "current_value")
    search_fields = ("title", "user__username")
