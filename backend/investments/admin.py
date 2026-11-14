from django.contrib import admin

from .models import Investment


@admin.register(Investment)
class InvestmentAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "category", "units", "purchase_price", "current_price", "investment_date")
    list_filter = ("category",)
    search_fields = ("name", "user__username")
