from django.utils import timezone

from investments.models import Investment
from portfolio import calculations as calc

from .models import Report


def create_report(user):
    """Calculate the user's portfolio right now and save it as a Report."""
    items = list(Investment.objects.filter(user=user).order_by("category", "name"))
    summary = calc.calculate_summary(items)
    allocation = calc.calculate_category_breakdown(items)
    holdings = calc.build_holdings(items)

    title = f"Portfolio Report - {timezone.localtime():%d %b %Y %H:%M}"
    return Report.objects.create(
        user=user,
        title=title,
        total_investment=summary["total_investment"],
        current_value=summary["current_value"],
        profit=summary["profit"],
        loss=summary["loss"],
        return_percentage=summary["return_percentage"],
        investment_count=summary["investment_count"],
        allocation=calc.jsonable(allocation),
        holdings=calc.jsonable(holdings),
    )


def report_to_dict(report):
    """Plain dict used by the PDF / CSV builders (which know nothing about Django)."""
    return {
        "title": report.title,
        "investor": report.user.full_name or report.user.username,
        "generated_at": timezone.localtime(report.generated_at),
        "summary": {
            "total_investment": float(report.total_investment),
            "current_value": float(report.current_value),
            "profit": float(report.profit),
            "loss": float(report.loss),
            "return_percentage": float(report.return_percentage),
            "investment_count": report.investment_count,
        },
        "allocation": report.allocation,
        "holdings": report.holdings,
    }
