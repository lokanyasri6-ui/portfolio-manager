from rest_framework import serializers
from django.utils import timezone
from .models import Investment

class InvestmentSerializer(serializers.ModelSerializer):
    category = serializers.CharField()
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    invested_amount = serializers.FloatField(read_only=True)
    current_value = serializers.FloatField(read_only=True)
    profit_loss = serializers.FloatField(read_only=True)
    return_percentage = serializers.FloatField(read_only=True)
    purchase_date = serializers.DateField(required=False)

    class Meta:
        model = Investment
        fields = [
            "id", "name", "category", "category_display", "units", "purchase_price",
            "current_price", "investment_date", "purchase_date", "notes",
            "invested_amount", "current_value", "profit_loss", "return_percentage",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {'investment_date': {'required': False}}

    def validate_category(self, value):
        if isinstance(value, str):
            v = value.lower().replace(' ', '_')
            if v in ['stocks', 'mutual_funds', 'others']:
                return v
        raise serializers.ValidationError(f'"{value}" is not a valid choice.')

    def validate(self, data):
        if 'purchase_date' in data:
            if 'investment_date' not in data or not data.get('investment_date'):
                data['investment_date'] = data.pop('purchase_date')
            else:
                data.pop('purchase_date')
        return data

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Investment name must be at least 2 characters.")
        return value

    def validate_investment_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Investment date cannot be in the future.")
        return value