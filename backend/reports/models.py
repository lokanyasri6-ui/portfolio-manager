from django.conf import settings
from django.db import models


class Report(models.Model):
    """
    A saved snapshot of a user's portfolio at the moment the report was generated.
    Storing a snapshot means an old report never changes when prices are edited later.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports")
    title = models.CharField(max_length=150)
    generated_at = models.DateTimeField(auto_now_add=True)
    total_investment = models.DecimalField(max_digits=24, decimal_places=2)
    current_value = models.DecimalField(max_digits=24, decimal_places=2)
    profit = models.DecimalField(max_digits=24, decimal_places=2)
    loss = models.DecimalField(max_digits=24, decimal_places=2)
    return_percentage = models.DecimalField(max_digits=24, decimal_places=2)
    investment_count = models.PositiveIntegerField(default=0)
    allocation = models.JSONField(default=list)   # category-wise rows
    holdings = models.JSONField(default=list)     # one row per investment

    class Meta:
        db_table = "reports"
        ordering = ["-generated_at", "-id"]
        indexes = [models.Index(fields=["user", "generated_at"])]

    def __str__(self):
        return self.title
