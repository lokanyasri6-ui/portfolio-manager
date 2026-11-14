from django.db.models import Q
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from admin_panel.models import ActivityLog
from admin_panel.utils import log_activity

from .models import Investment
from .serializers import InvestmentSerializer

ORDERING_FIELDS = {
    "name", "category", "units", "purchase_price", "current_price", "investment_date", "created_at",
}


class InvestmentViewSet(viewsets.ModelViewSet):
    """
    CRUD for the logged-in user's investments.

    Privacy: the queryset is ALWAYS filtered by request.user, so another user's
    record simply does not exist as far as this user is concerned (404).

    Query parameters for the list:
        ?search=tcs            name contains "tcs"
        ?category=stocks       stocks | mutual_funds | others
        ?ordering=-name        any of the allowed fields, "-" for descending
    """

    serializer_class = InvestmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Investment.objects.filter(user=self.request.user)
        params = self.request.query_params

        category = params.get("category")
        if category:
            if category not in Investment.Category.values:
                raise serializers.ValidationError(
                    {"category": f"Choose one of: {', '.join(Investment.Category.values)}."})
            queryset = queryset.filter(category=category)

        search = (params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(Q(name__icontains=search))

        ordering = params.get("ordering")
        if ordering and ordering.lstrip("-") in ORDERING_FIELDS:
            queryset = queryset.order_by(ordering, "-id")
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        log_activity(self.request, self.request.user, ActivityLog.Action.INVESTMENT_CREATED,
                     f"Added '{instance.name}' ({instance.get_category_display()})")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request, self.request.user, ActivityLog.Action.INVESTMENT_UPDATED,
                     f"Updated '{instance.name}'")

    def perform_destroy(self, instance):
        name = instance.name
        instance.delete()
        log_activity(self.request, self.request.user, ActivityLog.Action.INVESTMENT_DELETED,
                     f"Deleted '{name}'")

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """Choices for the 'category' drop-down in the frontend form."""
        return Response([{"value": v, "label": l} for v, l in Investment.Category.choices])

from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, F, FloatField, ExpressionWrapper

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def portfolio_view(request):
    investments = Investment.objects.filter(user=request.user)
    
    total_invested = 0
    total_current = 0
    for inv in investments:
        total_invested += float(inv.units) * float(inv.purchase_price)
        total_current += float(inv.units) * float(inv.current_price)

    profit_loss = total_current - total_invested
    return_pct = (profit_loss / total_invested * 100) if total_invested else 0

    return Response({
        "total_invested": total_invested,
        "total_current": total_current,
        "profit_loss": profit_loss,
        "return_percentage": round(return_pct, 2),
        "count": investments.count(),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reports_view(request):
    investments = Investment.objects.filter(user=request.user)
    serializer = InvestmentSerializer(investments, many=True)
    return Response({
        "investments": serializer.data,
        "count": investments.count()
    })