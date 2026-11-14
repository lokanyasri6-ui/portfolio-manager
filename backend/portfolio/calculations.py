"""
All portfolio mathematics lives here, in plain Python (no Django imports),
so it is easy to read, test and reuse.

Formulas (from the project documentation, Section 4.3):

    Total Investment        = SUM(units x purchase_price)
    Current Portfolio Value = SUM(units x current_price)
    Profit                  = Current Value - Total Investment      (when positive)
    Loss                    = Total Investment - Current Value      (when positive)
    Return %                = (Profit or Loss / Total Investment) x 100
    Allocation % (category) = (Category Value / Current Portfolio Value) x 100

Rules:
  * Money is handled with Decimal (never float) to avoid rounding drift.
  * Results are rounded to 2 decimals with ROUND_HALF_UP (28.125 -> 28.13).
  * Division by zero is handled: a zero denominator gives 0.00.
  * Totals are rounded once; profit/loss are derived from the rounded totals so the
    numbers shown on screen always add up.
  * Return % is signed: a loss gives a negative percentage (e.g. -4.50).
"""
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal

ZERO = Decimal("0")
HUNDRED = Decimal("100")
CENT = Decimal("0.01")
ZERO_2DP = Decimal("0.00")

CATEGORY_LABELS = {
    "stocks": "Stocks",
    "mutual_funds": "Mutual Funds",
    "others": "Others",
}
CATEGORY_ORDER = list(CATEGORY_LABELS)


# ------------------------------------------------------------------ basics
def to_decimal(value):
    if isinstance(value, Decimal):
        return value
    if value is None:
        return ZERO
    return Decimal(str(value))


def money(value):
    """Round to 2 decimal places (half up). Never returns -0.00."""
    rounded = to_decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)
    return ZERO_2DP if rounded == 0 else rounded


def percentage(part, whole):
    """(part / whole) x 100 rounded to 2 dp. Returns 0.00 if whole is zero."""
    whole = to_decimal(whole)
    if whole == 0:
        return ZERO_2DP
    return money(to_decimal(part) / whole * HUNDRED)


def invested_amount(item):
    """units x purchase price (unrounded)."""
    return to_decimal(item.units) * to_decimal(item.purchase_price)


def current_value(item):
    """units x current price (unrounded)."""
    return to_decimal(item.units) * to_decimal(item.current_price)


def status_of(net):
    if net > 0:
        return "profit"
    if net < 0:
        return "loss"
    return "break_even"


def _category_key(item):
    return item.category if item.category in CATEGORY_LABELS else "others"


# ------------------------------------------------------------------ results
def calculate_summary(items):
    """Portfolio-level numbers used by the dashboard and the P&L page."""
    items = list(items)
    total_invested = money(sum((invested_amount(i) for i in items), ZERO))
    total_current = money(sum((current_value(i) for i in items), ZERO))
    net = total_current - total_invested
    return {
        "total_investment": total_invested,
        "current_value": total_current,
        "profit": net if net > 0 else ZERO_2DP,
        "loss": -net if net < 0 else ZERO_2DP,
        "net_profit_loss": net,
        "return_percentage": percentage(net, total_invested),
        "status": status_of(net),
        "investment_count": len(items),
    }


def calculate_category_breakdown(items):
    """One row per category (always all three), grouped and totalled."""
    buckets = {k: {"count": 0, "invested": ZERO, "current": ZERO} for k in CATEGORY_ORDER}
    for item in items:
        bucket = buckets[_category_key(item)]
        bucket["count"] += 1
        bucket["invested"] += invested_amount(item)
        bucket["current"] += current_value(item)

    portfolio_current = sum((b["current"] for b in buckets.values()), ZERO)
    rows = []
    for key in CATEGORY_ORDER:
        b = buckets[key]
        invested = money(b["invested"])
        current = money(b["current"])
        net = current - invested
        rows.append({
            "category": key,
            "label": CATEGORY_LABELS[key],
            "count": b["count"],
            "invested": invested,
            "current_value": current,
            "profit_loss": net,
            "return_percentage": percentage(net, invested),
            "allocation_percentage": percentage(b["current"], portfolio_current),
        })
    return rows


def calculate_allocation(items):
    """Category allocation + ready-to-use chart arrays (pie / doughnut)."""
    rows = calculate_category_breakdown(items)
    return {
        "total_current_value": money(sum((r["current_value"] for r in rows), ZERO)),
        "categories": [
            {
                "category": r["category"],
                "label": r["label"],
                "count": r["count"],
                "current_value": r["current_value"],
                "allocation_percentage": r["allocation_percentage"],
            }
            for r in rows
        ],
        "chart": {
            "labels": [r["label"] for r in rows],
            "percentages": [r["allocation_percentage"] for r in rows],
            "values": [r["current_value"] for r in rows],
        },
    }


def build_holdings(items):
    """One row per investment with all the Portfolio View columns."""
    items = list(items)
    portfolio_current = sum((current_value(i) for i in items), ZERO)
    rows = []
    for item in items:
        invested = invested_amount(item)
        current = current_value(item)
        net = money(current) - money(invested)
        key = _category_key(item)
        rows.append({
            "id": getattr(item, "id", None),
            "name": getattr(item, "name", ""),
            "category": key,
            "category_label": CATEGORY_LABELS[key],
            "units": to_decimal(item.units),
            "purchase_price": to_decimal(item.purchase_price),
            "current_price": to_decimal(item.current_price),
            "investment_date": getattr(item, "investment_date", None),
            "invested_amount": money(invested),
            "current_value": money(current),
            "profit_loss": net,
            "return_percentage": percentage(net, money(invested)),
            "allocation_percentage": percentage(current, portfolio_current),
            "status": status_of(net),
        })
    return rows


def calculate_performance_timeline(items):
    """
    Running totals by investment date, for the 'portfolio performance' line chart:
    cumulative amount invested vs. cumulative current value of everything bought
    up to that date (valued at today's manually entered prices).
    """
    by_date = {}
    for item in items:
        day = getattr(item, "investment_date", None)
        if day is None:
            continue
        totals = by_date.setdefault(day, [ZERO, ZERO])
        totals[0] += invested_amount(item)
        totals[1] += current_value(item)

    points = []
    running_invested = running_current = ZERO
    for day in sorted(by_date):
        running_invested += by_date[day][0]
        running_current += by_date[day][1]
        points.append({
            "date": day,
            "invested": money(running_invested),
            "current_value": money(running_current),
        })
    return {
        "points": points,
        "chart": {
            "labels": [p["date"] for p in points],
            "invested": [p["invested"] for p in points],
            "current_value": [p["current_value"] for p in points],
        },
    }


# ------------------------------------------------------------------ JSON helper
def jsonable(obj):
    """Recursively turn Decimal -> float and date -> ISO string for JSON responses."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [jsonable(v) for v in obj]
    return obj
