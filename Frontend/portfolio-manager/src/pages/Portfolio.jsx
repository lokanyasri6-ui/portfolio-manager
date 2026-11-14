import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import api, { firstArray, useLoad } from '../api';
import { useData } from '../context/DataContext';
import { catStyle, money, normInv, pct, totalsOf, withAllocation } from '../utils/format';
import { downloadCSV, HOLDING_COLS } from '../utils/export';
import { Badge, Btn, Empty, ErrorBox, Glass, PageHeader, PL, Spinner } from '../components/ui';

export default function Portfolio() {
  const { investments } = useData();
  const { data, loading, error, reload } = useLoad(async () => {
    const { data } = await api.get('/api/portfolio/holdings/');
    return firstArray(data);
  });

  const rows = useMemo(() => {
    const fromApi = (data || []).map(normInv);
    return withAllocation(fromApi.length ? fromApi : investments);
  }, [data, investments]);
  const t = totalsOf(rows);

  return (
    <div>
      <PageHeader title="Portfolio" subtitle="All your holdings with live valuation.">
        <Btn variant="ghost" disabled={!rows.length} onClick={() => downloadCSV('portfolio.csv', HOLDING_COLS, rows)}><Download className="h-4 w-4" /> Export CSV</Btn>
      </PageHeader>
      <div className="space-y-4">
        <ErrorBox message={error} onRetry={reload} />
        {loading ? <Spinner /> : rows.length === 0 ? (
          <Glass><Empty title="Your portfolio is empty" text="Add investments to see holdings here." /></Glass>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {[['Invested', money(t.invested), '#6366F1', '#8B5CF6'], ['Current value', money(t.current), '#3B82F6', '#06B6D4'], ['Net P/L', `${money(t.pl)} (${pct(t.ret)})`, t.pl >= 0 ? '#10B981' : '#F43F5E', t.pl >= 0 ? '#34D399' : '#FB923C']].map(([l, v, a, b]) => (
                <Glass key={l} className="relative overflow-hidden p-5" hover>
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg,${a},${b})` }} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{l}</p>
                  <p className="mt-1 font-display text-xl font-extrabold">{v}</p>
                </Glass>
              ))}
            </div>
            <Glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Name</th><th className="px-3">Category</th><th className="px-3 text-right">Units</th><th className="px-3 text-right">Purchase</th>
                      <th className="px-3 text-right">Current</th><th className="px-3 text-right">Invested</th><th className="px-3 text-right">Value</th><th className="px-3 text-right">P/L</th><th className="px-6">Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id ?? r.name} className="border-t border-slate-200/60 transition hover:bg-indigo-500/5 dark:border-white/5">
                        <td className="px-6 py-4 font-semibold">{r.name}</td>
                        <td className="px-3"><Badge cat={r.category} /></td>
                        <td className="px-3 text-right">{r.units}</td>
                        <td className="px-3 text-right">{money(r.purchase_price)}</td>
                        <td className="px-3 text-right">{money(r.current_price)}</td>
                        <td className="px-3 text-right">{money(r.invested)}</td>
                        <td className="px-3 text-right">{money(r.current)}</td>
                        <td className="px-3 text-right"><PL value={r.pl} percent={r.ret} /></td>
                        <td className="px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${r.alloc}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${catStyle(r.category).from},${catStyle(r.category).to})` }} />
                            </div>
                            <span className="w-14 text-xs font-semibold">{pct(r.alloc, false)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-indigo-500/30 bg-indigo-500/5 font-bold">
                      <td className="px-6 py-4" colSpan={5}>Total</td>
                      <td className="px-3 text-right">{money(t.invested)}</td>
                      <td className="px-3 text-right">{money(t.current)}</td>
                      <td className="px-3 text-right"><PL value={t.pl} percent={t.ret} /></td>
                      <td className="px-6">100.00%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Glass>
          </>
        )}
      </div>
    </div>
  );
}
