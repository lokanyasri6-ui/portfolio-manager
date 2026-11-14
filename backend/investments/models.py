from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from portfolio import calculations as calc


class Investment(models.Model):
    """One holding (e.g. '10 units of XYZ Ltd') that belongs to exactly one user."""

    class Category(models.TextChoices):
        STOCKS = "stocks", "Stocks"
        MUTUAL_FUNDS = "mutual_funds", "Mutual Funds"
        OTHERS = "others", "Others"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="investments")
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.STOCKS)
    units = models.DecimalField(
        max_digits=18, decimal_places=4,
        validators=[
            MinValueValidator(Decimal("0.0001"), message="Units must be greater than zero."),
            MaxValueValidator(Decimal("999999999"), message="Units value is too large."),
        ],
    )
    purchase_price = models.DecimalField(
        max_digits=18, decimal_places=4,
        validators=[
            MinValueValidator(Decimal("0.0001"), message="Purchase price must be greater than zero."),
            MaxValueValidator(Decimal("99999999"), message="Purchase price is too large."),
        ],
    )
    current_price = models.DecimalField(
        max_digits=18, decimal_places=4,
        validators=[
            MinValueValidator(Decimal("0"), message="Current price cannot be negative."),
            MaxValueValidator(Decimal("99999999"), message="Current price is too large."),
        ],
    )
    investment_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "investments"
        ordering = ["-investment_date", "-id"]
        indexes = [
            models.Index(fields=["user", "category"]),
            models.Index(fields=["user", "investment_date"]),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(units__gt=0), name="investment_units_positive"),
            models.CheckConstraint(condition=models.Q(purchase_price__gt=0),
                                   name="investment_purchase_price_positive"),
            models.CheckConstraint(condition=models.Q(current_price__gte=0),
                                   name="investment_current_price_not_negative"),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    # Convenience values (2 decimal places) -------------------------------
    @property
    def invested_amount(self):
        return calc.money(calc.invested_amount(self))

    @property
    def current_value(self):
        return calc.money(calc.current_value(self))

    @property
    def profit_loss(self):
        return self.current_value - self.invested_amount

    @property
    def return_percentage(self):
        return calc.percentage(self.profit_loss, self.invested_amount)
