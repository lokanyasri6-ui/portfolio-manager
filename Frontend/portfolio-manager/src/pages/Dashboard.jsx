import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Percent, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import api, { errMsg, firstArray, useLoad } from '../api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { allocationOf, catStyle, fmtDate, money, moneyShort, normInv, normPerf, num, pct } from '../utils/format';
import { Badge, ChartTooltip, Donut, Empty, ErrorBox, Glass, KPI, PL, Spinner } from '../components/ui';
import { Mesh } from '../components/Decor';

const pick = (o, keys) => {
  if (!o) return null;
  for (const k of keys) if (o[k] != null && o[k] !== '') return num(o[k]);
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { investments, totals: local, loading: invLoading, error: invError } = useData();

  const { data, loading, error, reload } = useLoad(async () => {
    const [d, p] = await Promise.allSettled([api.get('/api/portfolio/dashboard/'), api.get('/api/portfolio/performance/')]);
    return {
      dash: d.status === 'fulfilled' ? d.value.data : null,
      dashErr: d.status === 'rejected' ? errMsg(d.reason) : null,
      perf: p.status === 'fulfilled' ? normPerf(p.value.data) : [],
      perfErr: p.status === 'rejected' ? errMsg(p.reason) : null,
    };
  });

  const t = useMemo(() => {
    const s = data?.dash?.summary || data?.dash || null;
    const invested = pick(s, ['total_investment', 'total_invested', 'invested_amount', 'invested']) ?? local.invested;
    const current = pick(s, ['current_value', 'total_current_value', 'current']) ?? local.current;
    const pl = current - invested;
    return { invested, current, pl, profit: Math.max(pl, 0), loss: Math.max(-pl, 0), ret: invested ? (pl / invested) * 100 : 0 };
  }, [data, local]);

  const recent = useMemo(() => {
    const fromApi = firstArray(data?.dash?.recent_investments ?? data?.dash?.recent ?? null).map(normInv);
    if (fromApi.length) return fromApi.slice(0, 5);
    return [...investments].sort((a, b) => new Date(b.purchase_date || 0) - new Date(a.purchase_date || 0) || b.id - a.id).slice(0, 5);
  }, [data, investments]);

  const perf = data?.perf || [];
  const hasInvSeries = perf.length > 1 && perf.every((p) => p.invested != null);
  const series = {
    invested: hasInvSeries ? perf.map((p) => p.invested) : null,
    current: perf.length > 1 ? perf.map((p) => p.value) : null,
    pl: hasInvSeries ? perf.map((p) => p.value - p.invested) : null,
    ret: hasInvSeries ? perf.map((p) => (p.invested ? ((p.value - p.invested) / p.invested) * 100 : 0)) : null,
  };

  const alloc = allocationOf(investments);
  const best = investments.length ? [...investments].sort((a, b) => b.ret - a.ret)[0] : null;
  const name = user?.name || user?.first_name || user?.username || 'Investor';
  const up = t.pl >= 0;

  if (loading || invLoading) return <Spinner label="Loading your dashboard…" />;

  return (
    <div className="space-y-6">
      <ErrorBox message={error || invError} onRetry={reload} />

      {/* hero */}
      <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 p-6 text-white shadow-2xl shadow-indigo-500/30 sm:p-10">
        <Mesh className="opacity-60" />
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-indigo-100">Welcome back,</p>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{name} 👋</h1>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-indigo-100">Current portfolio value</p>
            <p className="font-display text-4xl font-extrabold sm:text-5xl">{money(t.current)}</p>
            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold backdrop-blur-xl ${up ? 'bg-emerald-400/25 text-emerald-100' : 'bg-rose-400/25 text-rose-100'}`}>
              {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} {money(t.pl)} ({pct(t.ret)})
            </span>
            <div className="mt-6 flex gap-3">
              <Link to="/investments" className="rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:scale-105">Add investment</Link>
              <Link to="/portfolio" className="rounded-2xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold backdrop-blur-xl transition hover:bg-white/20">View portfolio</Link>
            </div>
          </div>
          <div className="relative lg:col-span-3">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
              <div className="mb-1 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-indigo-100">
                <span>Portfolio performance</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Live</span>
              </div>
              {perf.length > 1 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={perf} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fff" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="value" name="Value" stroke="#fff" strokeWidth={3} fill="url(#heroFill)" isAnimationActive animationDuration={1600} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-[190px] place-items-center px-4 text-center text-sm text-indigo-100">
                  {data?.perfErr || 'No performance history returned by the API yet.'}
                </div>
              )}
            </div>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -top-5 right-4 hidden rounded-2xl border border-white/25 bg-ink/50 px-4 py-3 backdrop-blur-xl sm:block">
              <p className="text-[11px] font-semibold uppercase text-slate-300">{up ? 'Total profit' : 'Total loss'}</p>
              <p className={`font-display text-lg font-extrabold ${up ? 'text-emerald-300' : 'text-rose-300'}`}>{money(up ? t.profit : t.loss)}</p>
            </motion.div>
            {best && (
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute -bottom-5 left-4 hidden rounded-2xl border border-white/25 bg-ink/50 px-4 py-3 backdrop-blur-xl sm:block">
                <p className="text-[11px] font-semibold uppercase text-slate-300">Top performer</p>
                <p className="font-display font-bold">{best.name} <span className={best.ret >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{pct(best.ret)}</span></p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KPI title="Total Investment" value={money(t.invested)} icon={PiggyBank} from="#6366F1" to="#8B5CF6" series={series.invested} delay={0} />
        <KPI title="Current Value" value={money(t.current)} icon={Wallet} from="#3B82F6" to="#06B6D4" series={series.current} delay={0.07} />
        <KPI title="Profit" value={money(t.profit)} icon={TrendingUp} from="#10B981" to="#34D399" series={series.pl} delay={0.14} />
        <KPI title="Loss" value={money(t.loss)} icon={TrendingDown} from="#F43F5E" to="#FB923C" series={null} delay={0.21} />
        <KPI title="Return %" value={pct(t.ret)} icon={Percent} from="#F59E0B" to="#EC4899" series={series.ret} delay={0.28} />
      </div>

      {/* charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Glass className="p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-bold">Performance</h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Portfolio value over time</p>
          {perf.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={perf} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={moneyShort} width={60} />
                <Tooltip content={<ChartTooltip />} />
                {hasInvSeries && <Area type="monotone" dataKey="invested" name="Invested" stroke="#06B6D4" strokeWidth={2} fill="url(#gi)" />}
                <Area type="monotone" dataKey="value" name="Value" stroke="#818CF8" strokeWidth={3} fill="url(#gv)" animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty title="No performance data" text={data?.perfErr || 'The performance endpoint returned no history yet.'} />
          )}
        </Glass>

        <Glass className="p-6">
          <h3 className="font-display text-lg font-bold">Allocation</h3>
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">By category</p>
          {t.current > 0 ? (
            <>
              <Donut data={alloc} total={t.current} height={230} />
              <div className="mt-3 space-y-2">
                {alloc.map((a) => (
                  <div key={a.name} className="flex items-center justify-between text-sm">
                    <Badge cat={a.name} />
                    <span className="font-semibold">{pct(a.pct, false)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty title="No allocation yet" text="Add an investment to see your split." />
          )}
        </Glass>
      </div>

      {/* recent */}
      <Glass className="overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-3">
          <div>
            <h3 className="font-display text-lg font-bold">Recent investments</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your latest additions</p>
          </div>
          <Link to="/investments" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-500 hover:underline">View all <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        {recent.length === 0 ? (
          <Empty title="No investments yet" text="Add your first investment to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr><th className="px-6 py-3">Name</th><th className="px-3">Date</th><th className="px-3 text-right">Invested</th><th className="px-3 text-right">Current</th><th className="px-6 text-right">P/L</th></tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id ?? r.name} className="border-t border-slate-200/60 transition hover:bg-indigo-500/5 dark:border-white/5">
                    <td className="px-6 py-3.5"><p className="font-semibold">{r.name}</p><Badge cat={r.category} /></td>
                    <td className="px-3 text-slate-500 dark:text-slate-400">{fmtDate(r.purchase_date)}</td>
                    <td className="px-3 text-right">{money(r.invested)}</td>
                    <td className="px-3 text-right">{money(r.current)}</td>
                    <td className="px-6 text-right"><PL value={r.pl} percent={r.ret} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Glass>
    </div>
  );
}
