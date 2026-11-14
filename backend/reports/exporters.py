"""
Builds the downloadable CSV and PDF files from a plain report dictionary.
No Django imports here, so this file can be tested on its own.

Expected dictionary:
{
  "title": str, "investor": str, "generated_at": datetime,
  "summary": {total_investment, current_value, profit, loss, return_percentage, investment_count},
  "allocation": [{label, count, invested, current_value, profit_loss, return_percentage, allocation_percentage}],
  "holdings":   [{name, category_label, units, purchase_price, current_price, invested_amount,
                  current_value, profit_loss, return_percentage, allocation_percentage}],
}
"""
import csv
import io
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

APP_NAME = "Personal Investment Portfolio Manager"


# ------------------------------------------------------------ formatting
def _num(value):
    return f"{float(value):.2f}"


def _units(value):
    text = f"{float(value):,.4f}".rstrip("0").rstrip(".")
    return text or "0"


def _rs(value):
    value = float(value)
    return f"-Rs. {abs(value):,.2f}" if value < 0 else f"Rs. {value:,.2f}"


def _pct(value):
    return f"{float(value):.2f}%"


def _status(summary):
    if summary["profit"] > 0:
        return "Portfolio in Profit"
    if summary["loss"] > 0:
        return "Portfolio in Loss"
    return "Portfolio at Break-even"


def _csv_safe(text):
    """Stop spreadsheet formula injection: cells starting with = + - @ are prefixed."""
    text = str(text)
    return "'" + text if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text


# ------------------------------------------------------------ CSV
def build_csv(report):
    out = io.StringIO()
    w = csv.writer(out)
    s = report["summary"]

    w.writerow([APP_NAME + " - Portfolio Report"])
    w.writerow(["Report", _csv_safe(report["title"])])
    w.writerow(["Investor", _csv_safe(report["investor"])])
    w.writerow(["Generated", report["generated_at"].strftime("%Y-%m-%d %H:%M")])
    w.writerow([])

    w.writerow(["SUMMARY"])
    w.writerow(["Total Investment", _num(s["total_investment"])])
    w.writerow(["Current Portfolio Value", _num(s["current_value"])])
    w.writerow(["Profit", _num(s["profit"])])
    w.writerow(["Loss", _num(s["loss"])])
    w.writerow(["Return Percentage", _num(s["return_percentage"])])
    w.writerow(["Number of Investments", s["investment_count"]])
    w.writerow(["Status", _status(s)])
    w.writerow([])

    w.writerow(["CATEGORY-WISE ALLOCATION"])
    w.writerow(["Category", "Investments", "Invested Amount", "Current Value",
                "Profit/Loss", "Return %", "Allocation %"])
    for r in report["allocation"]:
        w.writerow([r["label"], r["count"], _num(r["invested"]), _num(r["current_value"]),
                    _num(r["profit_loss"]), _num(r["return_percentage"]), _num(r["allocation_percentage"])])
    w.writerow([])

    w.writerow(["HOLDINGS"])
    w.writerow(["Investment", "Category", "Units", "Purchase Price", "Current Price", "Invested Amount",
                "Current Value", "Profit/Loss", "Return %", "Allocation %"])
    for h in report["holdings"]:
        w.writerow([_csv_safe(h["name"]), h["category_label"], _units(h["units"]),
                    _num(h["purchase_price"]), _num(h["current_price"]), _num(h["invested_amount"]),
                    _num(h["current_value"]), _num(h["profit_loss"]), _num(h["return_percentage"]),
                    _num(h["allocation_percentage"])])
    return out.getvalue()


# ------------------------------------------------------------ PDF
def build_pdf(report):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4), title=report["title"], author=APP_NAME,
        leftMargin=15 * mm, rightMargin=15 * mm, topMargin=15 * mm, bottomMargin=15 * mm,
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Title"], fontSize=20, textColor=colors.HexColor("#0f2a4a"))
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=13, textColor=colors.HexColor("#0f2a4a"),
                        spaceBefore=10)
    body = styles["BodyText"]
    cell = ParagraphStyle("cell", parent=body, fontSize=8, leading=10)

    header_bg = colors.HexColor("#0f2a4a")

    def make_table(data, col_widths=None, right_from=1):
        table = Table(data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f5f9")]),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c9d2de")),
            ("ALIGN", (right_from, 0), (-1, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        return table

    s = report["summary"]
    story = [
        Paragraph(escape(APP_NAME), h1),
        Paragraph(f"<b>{escape(report['title'])}</b>", body),
        Paragraph(f"Investor: {escape(report['investor'])} &nbsp;&nbsp;|&nbsp;&nbsp; "
                  f"Generated: {report['generated_at']:%d %b %Y, %H:%M}", body),
        Spacer(1, 6),
        Paragraph("Summary", h2),
    ]

    summary_rows = [
        ["Total Investment", _rs(s["total_investment"])],
        ["Current Portfolio Value", _rs(s["current_value"])],
        ["Profit", _rs(s["profit"])],
        ["Loss", _rs(s["loss"])],
        ["Return Percentage", _pct(s["return_percentage"])],
        ["Number of Investments", str(s["investment_count"])],
        ["Status", _status(s)],
    ]
    summary_table = Table(summary_rows, colWidths=[70 * mm, 60 * mm])
    summary_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#c9d2de")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story += [summary_table, Paragraph("Category-wise Allocation", h2)]

    alloc = [["Category", "Investments", "Invested", "Current Value", "Profit/Loss", "Return %", "Allocation %"]]
    for r in report["allocation"]:
        alloc.append([r["label"], str(r["count"]), _rs(r["invested"]), _rs(r["current_value"]),
                      _rs(r["profit_loss"]), _pct(r["return_percentage"]), _pct(r["allocation_percentage"])])
    story.append(make_table(alloc))

    story.append(Paragraph("Holdings", h2))
    if not report["holdings"]:
        story.append(Paragraph("No investments were recorded when this report was generated.", body))
    else:
        rows = [["Investment", "Category", "Units", "Buy Price", "Current Price", "Invested",
                 "Current Value", "Profit/Loss", "Return %", "Alloc. %"]]
        for h in report["holdings"]:
            rows.append([
                Paragraph(escape(h["name"]), cell), h["category_label"], _units(h["units"]),
                _num(h["purchase_price"]), _num(h["current_price"]), _num(h["invested_amount"]),
                _num(h["current_value"]), _num(h["profit_loss"]), _pct(h["return_percentage"]),
                _pct(h["allocation_percentage"]),
            ])
        widths = [50 * mm, 27 * mm, 20 * mm, 22 * mm, 24 * mm, 25 * mm, 27 * mm, 25 * mm, 20 * mm, 17 * mm]
        story.append(make_table(rows, col_widths=widths, right_from=2))

    story += [Spacer(1, 8),
              Paragraph("Amounts in Indian Rupees (Rs.). Current prices are entered manually by the investor.",
                        ParagraphStyle("note", parent=body, fontSize=8, textColor=colors.grey))]

    def footer(canvas, document):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(15 * mm, 8 * mm, APP_NAME)
        canvas.drawRightString(landscape(A4)[0] - 15 * mm, 8 * mm, f"Page {document.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()
