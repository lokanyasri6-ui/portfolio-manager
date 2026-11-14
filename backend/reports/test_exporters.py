"""PDF / CSV builder tests (no database needed)."""
import unittest
from datetime import datetime

from reports import exporters

REPORT = {
    "title": "Portfolio Report - test",
    "investor": "ABC Investor",
    "generated_at": datetime(2026, 11, 14, 10, 30),
    "summary": {"total_investment": 3000.0, "current_value": 3200.0, "profit": 200.0, "loss": 0.0,
                "return_percentage": 6.67, "investment_count": 3},
    "allocation": [
        {"label": "Stocks", "count": 1, "invested": 1000.0, "current_value": 1200.0, "profit_loss": 200.0,
         "return_percentage": 20.0, "allocation_percentage": 37.5},
        {"label": "Mutual Funds", "count": 1, "invested": 1000.0, "current_value": 900.0, "profit_loss": -100.0,
         "return_percentage": -10.0, "allocation_percentage": 28.13},
        {"label": "Others", "count": 1, "invested": 1000.0, "current_value": 1100.0, "profit_loss": 100.0,
         "return_percentage": 10.0, "allocation_percentage": 34.38},
    ],
    "holdings": [
        {"name": "Sample Stock Ltd", "category_label": "Stocks", "units": 10.0, "purchase_price": 100.0,
         "current_price": 120.0, "invested_amount": 1000.0, "current_value": 1200.0, "profit_loss": 200.0,
         "return_percentage": 20.0, "allocation_percentage": 37.5},
        {"name": "=HYPERLINK(\"http://evil\")", "category_label": "Others", "units": 1.0,
         "purchase_price": 1.0, "current_price": 1.0, "invested_amount": 1.0, "current_value": 1.0,
         "profit_loss": 0.0, "return_percentage": 0.0, "allocation_percentage": 0.0},
    ],
}


class ExporterTests(unittest.TestCase):
    def test_csv_contains_summary_values(self):
        text = exporters.build_csv(REPORT)
        for expected in ("Total Investment,3000.00", "Current Portfolio Value,3200.00", "Profit,200.00",
                         "Return Percentage,6.67", "Portfolio in Profit", "Mutual Funds"):
            self.assertIn(expected, text)

    def test_csv_blocks_formula_injection(self):
        self.assertIn("'=HYPERLINK", exporters.build_csv(REPORT))

    def test_pdf_is_a_real_pdf(self):
        pdf = exporters.build_pdf(REPORT)
        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertGreater(len(pdf), 1500)

    def test_pdf_with_no_holdings(self):
        empty = dict(REPORT, holdings=[], allocation=[])
        self.assertTrue(exporters.build_pdf(empty).startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main()
