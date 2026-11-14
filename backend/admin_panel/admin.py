from django.contrib import admin

from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "action", "description", "ip_address")
    list_filter = ("action",)
    search_fields = ("description", "user__username")
    readonly_fields = ("user", "action", "description", "ip_address", "created_at")

    def has_add_permission(self, request):
        return False
