import { money, pct } from './format';

const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadCSV = (filename, columns, rows) => {
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.csv ? c.csv(r) : r[c.key])).join(',')).join('\n');
  downloadBlob(new Blob([head + '\n' + body], { type: 'text/csv;charset=utf-8;' }), filename);
};

/** Opens a clean print view; user picks "Save as PDF" in the print dialog. */
export const printPDF = (title, columns, rows, summary = []) => {
  const w = window.open('', '_blank');
  if (!w) return false;
  const th = columns.map((c) => `<th>${c.label}</th>`).join('');
  const tr = rows.map((r) => `<tr>${columns.map((c) => `<td>${c.print ? c.print(r) : r[c.key] ?? ''}</td>`).join('')}</tr>`).join('');
  const sm = summary.map((s) => `<div class="k"><span>${s.label}</span><b>${s.value}</b></div>`).join('');
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Inter,Arial,sans-serif;padding:32px;color:#0f172a}
    h1{margin:0 0 4px;font-size:24px;background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;color:transparent}
    p{color:#64748b;margin:0 0 20px;font-size:13px}
    .row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
    .k{border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;min-width:150px}
    .k span{display:block;font-size:11px;color:#64748b;text-transform:uppercase}.k b{font-size:16px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#eef2ff;text-align:left;padding:8px;border-bottom:2px solid #c7d2fe}
    td{padding:8px;border-bottom:1px solid #e2e8f0}
  </style></head><body><h1>${title}</h1><p>Generated ${new Date().toLocaleString('en-IN')}</p>
  <div class="row">${sm}</div><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
  <script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
  return true;
};

export const HOLDING_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'units', label: 'Units' },
  { key: 'purchase_price', label: 'Purchase Price', csv: (r) => r.purchase_price.toFixed(2), print: (r) => money(r.purchase_price) },
  { key: 'current_price', label: 'Current Price', csv: (r) => r.current_price.toFixed(2), print: (r) => money(r.current_price) },
  { key: 'invested', label: 'Invested', csv: (r) => r.invested.toFixed(2), print: (r) => money(r.invested) },
  { key: 'current', label: 'Current Value', csv: (r) => r.current.toFixed(2), print: (r) => money(r.current) },
  { key: 'pl', label: 'Profit/Loss', csv: (r) => r.pl.toFixed(2), print: (r) => money(r.pl) },
  { key: 'ret', label: 'Return %', csv: (r) => r.ret.toFixed(2), print: (r) => pct(r.ret) },
  { key: 'alloc', label: 'Allocation %', csv: (r) => (r.alloc ?? 0).toFixed(2), print: (r) => pct(r.alloc ?? 0, false) },
];
