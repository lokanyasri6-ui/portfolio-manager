import { firstArray } from '../api';

export const CATEGORIES = [
  { label: 'Stocks', value: 'Stocks' },
  { label: 'Mutual Funds', value: 'Mutual Funds' },
  { label: 'Others', value: 'Others' },
];

export const CAT_STYLE = {
  Stocks: { from: '#6366F1', to: '#8B5CF6', badge: 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 ring-indigo-500/30' },
  'Mutual Funds': { from: '#06B6D4', to: '#3B82F6', badge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 ring-cyan-500/30' },
  Others: { from: '#F59E0B', to: '#EC4899', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30' },
};
export const catStyle = (c) => CAT_STYLE[c] || CAT_STYLE.Others;

export const num = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};
export const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = (v) => inr.format(num(v));
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
export const moneyShort = (v) => '₹' + compact.format(num(v));
export const pct = (v, sign = true) => `${sign && num(v) > 0 ? '+' : ''}${num(v).toFixed(2)}%`;
export const plColor = (v) => (num(v) > 0 ? 'text-emerald-500' : num(v) < 0 ? 'text-rose-500' : 'text-slate-400');

export const fmtDate = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  return isNaN(x) ? String(d) : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtLabel = (d) => {
  if (d == null) return '';
  const x = new Date(d);
  return isNaN(x) || /^[A-Za-z]{3,9}$/.test(String(d)) ? String(d) : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const normCat = (c) => {
  const s = String(c ?? '').toLowerCase();
  if (s.includes('stock') || s === 'equity' || s === 'equities') return 'Stocks';
  if (s.includes('mutual') || s.includes('fund') || s === 'mf') return 'Mutual Funds';
  return 'Others';
};

/** Normalises an investment/holding row. Formulas: invested = units*purchase, current = units*current. */
export const normInv = (i) => {
  const units = num(i.units ?? i.quantity);
  const pp = num(i.purchase_price ?? i.buy_price ?? i.average_price);
  const cp = num(i.current_price ?? i.price);
  let invested = units && pp ? units * pp : num(i.invested ?? i.invested_amount ?? i.total_invested ?? i.total_investment);
  let current = units && cp ? units * cp : num(i.current ?? i.current_value);
  let pl = current - invested;
  if (!invested && !current && (i.profit_loss != null || i.pl != null)) pl = num(i.profit_loss ?? i.pl);
  return {
    ...i,
    id: i.id,
    name: i.name ?? i.asset_name ?? i.investment ?? i.investment_name ?? i.asset ?? 'Untitled',
    category: normCat(i.category ?? i.type ?? i.asset_type),
    units,
    purchase_price: pp,
    current_price: cp,
    purchase_date: i.purchase_date ?? i.date ?? i.created_at ?? null,
    notes: i.notes ?? '',
    invested,
    current,
    pl,
    ret: invested ? (pl / invested) * 100 : 0,
  };
};

export const totalsOf = (rows) => {
  const invested = rows.reduce((s, r) => s + r.invested, 0);
  const current = rows.reduce((s, r) => s + r.current, 0);
  const pl = current - invested;
  return { invested, current, pl, profit: Math.max(pl, 0), loss: Math.max(-pl, 0), ret: invested ? (pl / invested) * 100 : 0 };
};

/** allocation% = category/current*100 */
export const allocationOf = (rows) => {
  const total = rows.reduce((s, r) => s + r.current, 0);
  return CATEGORIES.map((c) => {
    const value = rows.filter((r) => r.category === c.value).reduce((s, r) => s + r.current, 0);
    return { name: c.label, value, pct: total ? (value / total) * 100 : 0 };
  });
};

export const withAllocation = (rows) => {
  const total = rows.reduce((s, r) => s + r.current, 0);
  return rows.map((r) => ({ ...r, alloc: total ? (r.current / total) * 100 : 0 }));
};

export const normPerf = (d) =>
  firstArray(d).map((r) => {
    const inv = r.invested ?? r.invested_value ?? r.total_investment ?? r.total_invested;
    return {
      label: fmtLabel(r.label ?? r.date ?? r.month ?? r.period),
      value: num(r.value ?? r.current_value ?? r.portfolio_value ?? r.total_value),
      invested: inv != null ? num(inv) : null,
    };
  });

export const normAlloc = (d) => {
  let rows = [];
  if (Array.isArray(d) || (d && Array.isArray(firstArray(d)) && firstArray(d).length)) {
    rows = firstArray(d).map((r) => ({
      name: normCat(r.category ?? r.name ?? r.label),
      value: num(r.value ?? r.current_value ?? r.amount ?? r.total),
    }));
  } else if (d && typeof d === 'object') {
    rows = Object.entries(d)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'string' || (v && typeof v === 'object'))
      .map(([k, v]) => ({ name: normCat(k), value: num(typeof v === 'object' ? v.value ?? v.current_value ?? v.amount : v) }));
  }
  const merged = CATEGORIES.map((c) => ({ name: c.label, value: rows.filter((r) => r.name === c.value).reduce((s, r) => s + r.value, 0) }));
  const total = merged.reduce((s, r) => s + r.value, 0);
  return merged.map((r) => ({ ...r, pct: total ? (r.value / total) * 100 : 0 }));
};
