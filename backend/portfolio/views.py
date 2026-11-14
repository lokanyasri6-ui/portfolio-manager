from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from investments.models import Investment

from . import calculations as calc


class PortfolioBaseView(APIView):
    """Every portfolio endpoint only ever sees the logged-in user's investments."""

    permission_classes = [IsAuthenticated]

    def get_items(self):
        return list(Investment.objects.filter(user=self.request.user))


class SummaryView(PortfolioBaseView):
    """Total investment, current value, profit, loss and return %."""

    def get(self, request):
        return Response(calc.jsonable(calc.calculate_summary(self.get_items())))


class HoldingsView(PortfolioBaseView):
    """Portfolio View page: one row per investment (supports ?category= and ?search=)."""

    def get(self, request):
        items = self.get_items()
        rows = calc.build_holdings(items)          # allocation % is vs the WHOLE portfolio

        category = request.query_params.get("category")
        if category:
            if category not in calc.CATEGORY_LABELS:
                raise ValidationError({"category": f"Choose one of: {', '.join(calc.CATEGORY_LABELS)}."})
            rows = [r for r in rows if r["category"] == category]
        search = (request.query_params.get("search") or "").strip().lower()
        if search:
            rows = [r for r in rows if search in r["name"].lower()]

        return Response(calc.jsonable({
            "count": len(rows),
            "totals": calc.calculate_summary(items),
            "holdings": rows,
        }))


class AllocationView(PortfolioBaseView):
    """Category allocation percentages + chart arrays for the pie/doughnut chart."""

    def get(self, request):
        return Response(calc.jsonable(calc.calculate_allocation(self.get_items())))


class CategorySummaryView(PortfolioBaseView):
    """Investments grouped by category with totals, P/L and return %."""

    def get(self, request):
        return Response(calc.jsonable({"categories": calc.calculate_category_breakdown(self.get_items())}))


class PerformanceView(PortfolioBaseView):
    """Running invested vs. current value by date (line chart)."""

    def get(self, request):
        return Response(calc.jsonable(calc.calculate_performance_timeline(self.get_items())))


class ProfitLossView(PortfolioBaseView):
    """Profit & Loss page: summary, per-category P/L, best and worst performers."""

    def get(self, request):
        items = self.get_items()
        rows = calc.build_holdings(items)
        gainers = sorted((r for r in rows if r["profit_loss"] > 0), key=lambda r: r["profit_loss"], reverse=True)[:3]
        losers = sorted((r for r in rows if r["profit_loss"] < 0), key=lambda r: r["profit_loss"])[:3]
        categories = calc.calculate_category_breakdown(items)
        return Response(calc.jsonable({
            "summary": calc.calculate_summary(items),
            "categories": categories,
            "chart": {
                "labels": [c["label"] for c in categories],
                "invested": [c["invested"] for c in categories],
                "current_value": [c["current_value"] for c in categories],
                "profit_loss": [c["profit_loss"] for c in categories],
            },
            "top_gainers": gainers,
            "top_losers": losers,
        }))


class DashboardView(PortfolioBaseView):
    """Everything the Investor Dashboard needs, in a single request."""

    def get(self, request):
        items = self.get_items()
        recent_items = sorted(items, key=lambda i: (i.investment_date, i.id), reverse=True)[:5]
        return Response(calc.jsonable({
            "summary": calc.calculate_summary(items),
            "allocation": calc.calculate_allocation(items),
            "category_summary": calc.calculate_category_breakdown(items),
            "performance": calc.calculate_performance_timeline(items),
            "recent_investments": calc.build_holdings(recent_items),
        }))
