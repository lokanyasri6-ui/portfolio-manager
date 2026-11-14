import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, FileSpreadsheet, FileText, Sparkles } from 'lucide-react';
import api, { BASE_URL, errMsg, firstArray, useLoad } from '../api';
import { useData } from '../context/DataContext';
import { allocationOf, fmtDate, money, pct, totalsOf, withAllocation } from '../utils/format';
import { downloadCSV, HOLDING_COLS, printPDF } from '../utils/export';
import { Btn, Empty, ErrorBox, Glass, inputCls, Label, Modal, PageHeader, Spinner } from '../components/ui';

const TYPES = [
  { value: 'portfolio_summary', label: 'Portfolio Summary' },
  { value: 'holdings', label: 'Holdings' },
  { value: 'profit_loss', label: 'Profit & Loss' },
  { value: 'allocation', label: 'Allocation' },
];

const PL_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'invested', label: 'Invested', csv: (r) => r.invested.toFixed(2), print: (r) => money(r.invested) },
  { key: 'current', label: 'Current Value', csv: (r) => r.current.toFixed(2), print: (r) => money(r.current) },
  { key: 'pl', label: 'Profit/Loss', csv: (r) => r.pl.toFixed(2), print: (r) => money(r.pl) },
  { key: 'ret', label: 'Return %', csv: (r) => r.ret.toFixed(2), print: (r) => pct(r.ret) },
];
const AL_COLS = [
  { key: 'name', label: 'Category' },
  { key: 'value', label: 'Value', csv: (r) => r.value.toFixed(2), print: (r) => money(r.value) },
  { key: 'pct', label: 'Allocation %', csv: (r) => r.pct.toFixed(2), print: (r) => pct(r.pct, false) },
];

const titleOf = (r) => r.title || r.name || TYPES.find((t) => t.value === (r.report_type || r.type))?.label || `Report #${r.id}`;
const typeOf = (r) => String(r.report_type || r.type || r.title || r.name || '').toLowerCase();
const createdOf = (r) => r.created_at || r.generated_at || r.date || r.created;
const fileUrl = (r, ext) => {
  const u = [r.file, r.file_url, r.download_url, r.url, r[ext], r[`${ext}_url`]].find((x) => typeof x === 'string' && x.toLowerCase().split('?')[0].endsWith('.' + ext));
  return u ? (u.startsWith('http') ? u : BASE_URL + u) : null;
};

export default function Reports() {
  const { investments } = useData();
  const { data, loading, error, reload } = useLoad(async () => firstArray((await api.get('/api/reports/')).data));
  const [type, setType] = useState('portfolio_summary');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [view, setView] = useState(null);

  const holdings = useMemo(() => withAllocation(investments), [investments]);

  /** Resolve the table for a report: rows stored on the report, else built from live data by type. */
  const table = (r) => {
    const stored = firstArray(r.data ?? r.content ?? r.details ?? null);
    if (stored.length && typeof stored[0] === 'object') {
      const cols = Object.keys(stored[0]).map((k) => ({ key: k, label: k.replace(/_/g, ' ') }));
      return { cols, rows: stored };
    }
    const t = typeOf(r);
    if (t.includes('alloc')) return { cols: AL_COLS, rows: allocationOf(investments) };
    if (t.includes('profit') || t.includes('loss') || t.includes('p&l')) return { cols: PL_COLS, rows: holdings };
    return { cols: HOLDING_COLS, rows: holdings };
  };

  const summary = () => {
    const t = totalsOf(holdings);
    return [
      { label: 'Total Investment', value: money(t.invested) },
      { label: 'Current Value', value: money(t.current) },
      { label: 'Profit / Loss', value: money(t.pl) },
      { label: 'Return', value: pct(t.ret) },
    ];
  };

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const label = TYPES.find((t) => t.value === type).label;
      const { data: created } = await api.post('/api/reports/', { report_type: type, type, title: label });
      await reload();
      if (created && typeof created === 'object' && created.id != null) setView(created);
    } catch (e2) {
      setMsg(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const csv = (r) => {
    const link = fileUrl(r, 'csv');
    if (link) return window.open(link, '_blank');
    const { cols, rows } = table(r);
    downloadCSV(`${titleOf(r).replace(/\s+/g, '_').toLowerCase()}.csv`, cols, rows);
  };
  const pdf = (r) => {
    const link = fileUrl(r, 'pdf');
    if (link) return window.open(link, '_blank');
    const { cols, rows } = table(r);
    if (!printPDF(titleOf(r), cols, rows, summary())) setMsg('Allow pop-ups to open the PDF print view.');
  };

  const reports = data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate, view and download your portfolio reports." />

      <Glass className="relative overflow-hidden p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl" />
        <form onSubmit={generate} className="relative flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Report type</Label>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value} className="text-slate-900">{t.label}</option>)}
            </select>
          </div>
          <Btn type="submit" loading={busy}><Sparkles className="h-4 w-4" /> Generate report</Btn>
        </form>
        <div className="relative mt-3"><ErrorBox message={msg} /></div>
      </Glass>

      <ErrorBox message={error} onRetry={reload} />
      {loading ? <Spinner /> : reports.length === 0 ? (
        <Glass><Empty title="No reports yet" text="Generate your first report above." /></Glass>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((r, i) => (
            <motion.div key={r.id ?? i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-[0_24px_50px_-12px_rgba(139,92,246,.4)] dark:border-white/10 dark:bg-white/[0.04]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white transition group-hover:rotate-6"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{titleOf(r)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(createdOf(r))}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Btn variant="ghost" className="!px-3 !py-2" onClick={() => setView(r)}><Eye className="h-4 w-4" /> View</Btn>
                <Btn variant="ghost" className="!px-3 !py-2" onClick={() => pdf(r)}><Download className="h-4 w-4" /> PDF</Btn>
                <Btn variant="ghost" className="!px-3 !py-2" onClick={() => csv(r)}><FileSpreadsheet className="h-4 w-4" /> CSV</Btn>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view ? titleOf(view) : ''} wide>
        {view && (() => {
          const { cols, rows } = table(view);
          return (
            <div>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {summary().map((s) => (
                  <div key={s.label} className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-3">
                    <p className="text-[11px] uppercase text-slate-500">{s.label}</p><p className="text-sm font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              {rows.length === 0 ? <Empty title="No rows" text="There is no data in this report yet." /> : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-white/10">
                  <table className="w-full min-w-[560px] text-xs">
                    <thead className="bg-slate-100 text-left uppercase tracking-wider text-slate-500 dark:bg-white/5"><tr>{cols.map((c) => <th key={c.key} className="px-3 py-2.5">{c.label}</th>)}</tr></thead>
                    <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-slate-200/60 dark:border-white/5">{cols.map((c) => <td key={c.key} className="px-3 py-2.5">{c.print ? c.print(r) : String(r[c.key] ?? '')}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              <div className="mt-5 flex justify-end gap-3">
                <Btn variant="ghost" onClick={() => csv(view)}><FileSpreadsheet className="h-4 w-4" /> CSV</Btn>
                <Btn onClick={() => pdf(view)}><Download className="h-4 w-4" /> PDF</Btn>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
