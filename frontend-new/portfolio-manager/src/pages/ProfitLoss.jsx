import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Percent, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import api, { firstArray, useLoad } from '../api';
import { useData } from '../context/DataContext';
import { money, moneyShort, normInv, pct, totalsOf } from '../utils/format';
import { Badge, ChartTooltip, Empty, ErrorBox, Glass, KPI, PageHeader, Spinner } from '../components/ui';

export default function ProfitLoss() {
  const { investments } = useData();
  const { data, loading, error, reload } = useLoad(async () => {
    const { data } = await api.get('/api/portfolio/profit-loss/');
    return firstArray(data);
  });

  const rows = useMemo(() => {
    const fromApi = (data || []).map(normInv).filter((r) => r.invested || r.current || r.pl);
    return fromApi.length ? fromApi : investments;
  }, [data, investments]);
  const t = totalsOf(rows);
  const sorted = [...rows].sort((a, b) => b.pl - a.pl);
  const gainers = sorted.filter((r) => r.pl > 0).slice(0, 5);
  const losers = [...sorted].reverse().filter((r) => r.pl < 0).slice(0, 5);
  const chart = rows.map((r) => ({ name: r.name, pl: Number(r.pl.toFixed(2)) }));
  const up = t.pl >= 0;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Profit & Loss" subtitle="Where you're gaining and where you're not." />
      <ErrorBox message={error} onRetry={reload} />
      {rows.length === 0 ? (
        <Glass><Empty title="No data yet" text="Add investments to see profit and loss." /></Glass>
      ) : (
        <>
          <Glass className={`relative overflow-hidden p-6 sm:p-8 ${up ? 'shadow-emerald-500/20' : 'shadow-rose-500/20'}`}>
            <div className={`absolute inset-0 opacity-20 ${up ? 'bg-gradient-to-br from-emerald-500 to-cyan-500' : 'bg-gradient-to-br from-rose-500 to-orange-500'}`} />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Net {up ? 'profit' : 'loss'}</p>
                <p className={`font-display text-4xl font-extrabold sm:text-5xl ${up ? 'text-emerald-500' : 'text-rose-500'}`}>{money(t.pl)}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-lg font-extrabold ${up ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
                {up ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />} {pct(t.ret)}
              </span>
            </div>
          </Glass>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KPI title="Total Investment" value={money(t.invested)} icon={PiggyBank} from="#6366F1" to="#8B5CF6" />
            <KPI title="Current Value" value={money(t.current)} icon={Wallet} from="#3B82F6" to="#06B6D4" />
            <KPI title="Profit" value={money(t.profit)} icon={TrendingUp} from="#10B981" to="#34D399" />
            <KPI title="Loss" value={money(t.loss)} icon={TrendingDown} from="#F43F5E" to="#FB923C" />
            <KPI title="Return %" value={pct(t.ret)} icon={Percent} from="#F59E0B" to="#EC4899" />
          </div>

          <Glass className="p-6">
            <h3 className="font-display text-lg font-bold">Profit / Loss by investment</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Green is gain, red is loss</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barUp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34D399" /><stop offset="100%" stopColor="#059669" /></linearGradient>
                  <linearGradient id="barDown" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#FB7185" /><stop offset="100%" stopColor="#E11D48" /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={moneyShort} width={60} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,.08)' }} />
                <Bar dataKey="pl" name="P/L" radius={[10, 10, 10, 10]} animationDuration={1200}>
                  {chart.map((c, i) => <Cell key={i} fill={c.pl >= 0 ? 'url(#barUp)' : 'url(#barDown)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Glass>

          <div className="grid gap-6 lg:grid-cols-2">
            {[['Top gainers', gainers, 'No gainers yet.'], ['Top losers', losers, 'No losses — nice!']].map(([title, list, none]) => (
              <Glass key={title} className="p-6">
                <h3 className="font-display text-lg font-bold">{title}</h3>
                {list.length === 0 ? <p className="mt-4 text-sm text-slate-500">{none}</p> : (
                  <ul className="mt-4 space-y-3">
                    {list.map((r) => (
                      <li key={r.id ?? r.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100/60 p-3 dark:bg-white/5">
                        <div className="min-w-0"><p className="truncate font-semibold">{r.name}</p><Badge cat={r.category} /></div>
                        <div className={`text-right font-bold ${r.pl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <p className="flex items-center justify-end gap-1">{r.pl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}{money(r.pl)}</p>
                          <p className="text-xs">{pct(r.ret)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Glass>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
