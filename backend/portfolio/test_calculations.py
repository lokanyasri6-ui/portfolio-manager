"""Pure calculation tests (no database needed). Includes the worked example from the project report."""
import unittest
from datetime import date
from decimal import Decimal
from types import SimpleNamespace as NS

from portfolio import calculations as calc


def item(category, units, buy, now, day=None, name="X"):
    return NS(id=1, name=name, category=category, units=Decimal(units), purchase_price=Decimal(buy),
              current_price=Decimal(now), investment_date=day)


DOC_EXAMPLE = [
    item("stocks", "10", "100", "120", date(2026, 1, 1)),
    item("mutual_funds", "20", "50", "45", date(2026, 2, 1)),
    item("others", "5", "200", "220", date(2026, 3, 1)),
]


class SummaryTests(unittest.TestCase):
    def test_documentation_example(self):
        s = calc.calculate_summary(DOC_EXAMPLE)
        self.assertEqual(s["total_investment"], Decimal("3000.00"))
        self.assertEqual(s["current_value"], Decimal("3200.00"))
        self.assertEqual(s["profit"], Decimal("200.00"))
        self.assertEqual(s["loss"], Decimal("0.00"))
        self.assertEqual(s["return_percentage"], Decimal("6.67"))
        self.assertEqual(s["status"], "profit")

    def test_loss_case(self):
        s = calc.calculate_summary([item("stocks", "10", "100", "90")])
        self.assertEqual(s["profit"], Decimal("0.00"))
        self.assertEqual(s["loss"], Decimal("100.00"))
        self.assertEqual(s["return_percentage"], Decimal("-10.00"))
        self.assertEqual(s["status"], "loss")

    def test_empty_portfolio_is_safe(self):
        s = calc.calculate_summary([])
        self.assertEqual(s["total_investment"], Decimal("0.00"))
        self.assertEqual(s["return_percentage"], Decimal("0.00"))
        self.assertEqual(s["status"], "break_even")

    def test_total_loss_zero_current_value(self):
        s = calc.calculate_summary([item("stocks", "10", "100", "0")])
        self.assertEqual(s["loss"], Decimal("1000.00"))
        self.assertEqual(s["return_percentage"], Decimal("-100.00"))

    def test_fractional_units_and_four_decimal_prices(self):
        s = calc.calculate_summary([item("mutual_funds", "100.5", "30.1234", "28.5")])
        self.assertEqual(s["total_investment"], Decimal("3027.40"))   # 3027.4017
        self.assertEqual(s["current_value"], Decimal("2864.25"))


class AllocationTests(unittest.TestCase):
    def test_documentation_example(self):
        a = calc.calculate_allocation(DOC_EXAMPLE)
        pct = {c["category"]: c["allocation_percentage"] for c in a["categories"]}
        self.assertEqual(pct["stocks"], Decimal("37.50"))
        self.assertEqual(pct["mutual_funds"], Decimal("28.13"))   # 28.125 rounds half UP
        self.assertEqual(pct["others"], Decimal("34.38"))         # 34.375 rounds half UP
        self.assertEqual(a["chart"]["labels"], ["Stocks", "Mutual Funds", "Others"])

    def test_zero_portfolio_value_no_division_error(self):
        a = calc.calculate_allocation([item("stocks", "10", "100", "0")])
        self.assertTrue(all(c["allocation_percentage"] == Decimal("0.00") for c in a["categories"]))

    def test_empty_still_lists_all_three_categories(self):
        self.assertEqual(len(calc.calculate_allocation([])["categories"]), 3)


class BreakdownAndHoldingsTests(unittest.TestCase):
    def test_category_breakdown(self):
        rows = {r["category"]: r for r in calc.calculate_category_breakdown(DOC_EXAMPLE)}
        self.assertEqual(rows["mutual_funds"]["profit_loss"], Decimal("-100.00"))
        self.assertEqual(rows["mutual_funds"]["return_percentage"], Decimal("-10.00"))
        self.assertEqual(rows["stocks"]["count"], 1)

    def test_holdings_columns(self):
        h = calc.build_holdings(DOC_EXAMPLE)[0]
        self.assertEqual(h["invested_amount"], Decimal("1000.00"))
        self.assertEqual(h["current_value"], Decimal("1200.00"))
        self.assertEqual(h["profit_loss"], Decimal("200.00"))
        self.assertEqual(h["allocation_percentage"], Decimal("37.50"))

    def test_unknown_category_falls_into_others(self):
        rows = {r["category"]: r for r in calc.calculate_category_breakdown([item("crypto", "1", "10", "10")])}
        self.assertEqual(rows["others"]["count"], 1)

    def test_timeline_is_cumulative_and_sorted(self):
        pts = calc.calculate_performance_timeline(DOC_EXAMPLE)["points"]
        self.assertEqual([p["invested"] for p in pts], [Decimal("1000.00"), Decimal("2000.00"), Decimal("3000.00")])
        self.assertEqual(pts[-1]["current_value"], Decimal("3200.00"))

    def test_jsonable(self):
        out = calc.jsonable({"a": Decimal("1.50"), "d": date(2026, 1, 2), "l": [Decimal("2")]})
        self.assertEqual(out, {"a": 1.5, "d": "2026-01-02", "l": [2.0]})

    def test_no_negative_zero(self):
        self.assertEqual(str(calc.money(Decimal("-0.001"))), "0.00")


if __name__ == "__main__":
    unittest.main()
