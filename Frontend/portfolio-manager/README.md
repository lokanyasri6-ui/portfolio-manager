# Folio — Personal Investment Portfolio Manager

React + Tailwind + Recharts + Framer Motion front end for the API at `http://127.0.0.1:8000`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

Optional `.env`:

```
VITE_API_URL=http://127.0.0.1:8000     # backend base URL
VITE_AUTH_SCHEME=Bearer                # force "Bearer" or "Token" (auto-detected otherwise)
VITE_MARKET_API=                       # optional feed returning [{symbol, price, change_percent}] for NIFTY / SENSEX / RELIANCE
```

The backend must allow CORS from `http://localhost:5173`.

## Pages

Landing `/` · Register `/register` · Login `/login` · Dashboard `/dashboard` · Investments `/investments` ·
Portfolio `/portfolio` · Profit & Loss `/profit-loss` · Allocation `/allocation` · Reports `/reports` · Admin `/admin`

## Data & formulas (2 decimals, INR)

- Total Investment = Σ units × purchase_price
- Current Value = Σ units × current_price
- Profit/Loss = Current − Invested, Return % = P/L ÷ Invested × 100
- Allocation % = Category value ÷ Current value × 100

No mock data anywhere. Everything comes from the API with the saved token.

## API assumptions to check against your backend

Response shapes weren't specified, so they're normalised defensively in `src/utils/format.js`:

- Login returns `token`, `access` or `key`. JWT-shaped tokens are sent as `Bearer`, others as `Token`.
- Investment fields: `name, category, units, purchase_price, current_price, purchase_date, notes`.
  Category values sent are `Stocks`, `Mutual Funds`, `Others` — see `CATEGORIES` in `src/utils/format.js` and adjust if your API expects e.g. `stock` / `mutual_fund`.
- Performance: array of `{date|month|label, value|current_value, invested?}`.
- Admin: `PATCH /api/admin/users/{id}/` with `{is_active}`; activity logs are read from `activity_logs | logs | recent_activity` inside `/api/admin/stats/`.
- Reports: `POST /api/reports/` with `{report_type, type, title}`. CSV/PDF are generated in the browser from live data
  (PDF opens a print view → "Save as PDF") unless the report object carries a `.csv` / `.pdf` file URL.
- Ticker: shows your own holdings' return %. NIFTY/SENSEX need a market feed — set `VITE_MARKET_API`.
