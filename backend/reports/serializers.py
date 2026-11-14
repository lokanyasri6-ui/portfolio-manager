from rest_framework import serializers

from .models import Report


class ReportListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "title", "generated_at", "total_investment", "current_value",
                  "profit", "loss", "return_percentage", "investment_count"]
        read_only_fields = fields


class ReportDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "title", "generated_at", "total_investment", "current_value", "profit", "loss",
                  "return_percentage", "investment_count", "allocation", "holdings"]
        read_only_fields = fields
