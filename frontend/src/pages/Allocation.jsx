import { useMemo } from 'react';
import { motion } from 'framer-motion';
import api, { useLoad } from '../api';
import { useData } from '../context/DataContext';
import { allocationOf, catStyle, money, normAlloc, pct } from '../utils/format';
import { Badge, Donut, Empty, ErrorBox, Glass, PageHeader, PL, Spinner } from '../components/ui';

export default function Allocation() {
  const { investments } = useData();
  const { data, loading, error, reload } = useLoad(async () => (await api.get('/api/portfolio/allocation/')).data);

  const alloc = useMemo(() => {
    const fromApi = data ? normAlloc(data) : [];
    return fromApi.some((a) => a.value > 0) ? fromApi : allocationOf(investments);
  }, [data, investments]);
  const total = alloc.reduce((s, a) => s + a.value, 0);

  const perCat = (name) => {
    const rows = investments.filter((i) => i.category === name);
    const inv = rows.reduce((s, r) => s + r.invested, 0);
    const cur = rows.reduce((s, r) => s + r.current, 0);
    return { count: rows.length, pl: cur - inv, ret: inv ? ((cur - inv) / inv) * 100 : 0 };
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Allocation" subtitle="How your wealth is distributed across categories." />
      <div className="space-y-6">
        <ErrorBox message={error} onRetry={reload} />
        {total <= 0 ? (
          <Glass><Empty title="No allocation yet" text="Add investments to see your Stocks / Mutual Funds / Others split." /></Glass>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-5">
              <Glass className="p-6 lg:col-span-3">
                <h3 className="font-display text-lg font-bold">Portfolio split</h3>
                <Donut data={alloc} total={total} height={360} label="Total value" />
              </Glass>
              <Glass className="p-6 lg:col-span-2">
                <h3 className="mb-4 font-display text-lg font-bold">Breakdown</h3>
                <div className="space-y-5">
                  {alloc.map((a) => (
                    <div key={a.name}>
                      <div className="mb-2 flex items-center justify-between"><Badge cat={a.name} /><span className="font-display text-lg font-extrabold">{pct(a.pct, false)}</span></div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${a.pct}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${catStyle(a.name).from},${catStyle(a.name).to})`, boxShadow: `0 0 16px ${catStyle(a.name).from}88` }} />
                      </div>
                      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{money(a.value)}</p>
                    </div>
                  ))}
                </div>
              </Glass>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {alloc.map((a, i) => {
                const c = perCat(a.name);
                return (
                  <motion.div key={a.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }}
                    style={{ '--glow': catStyle(a.name).from + '55' }}
                    className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-[0_24px_50px_-12px_var(--glow)] dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg,${catStyle(a.name).from},${catStyle(a.name).to})` }} />
                    <Badge cat={a.name} />
                    <p className="mt-3 font-display text-2xl font-extrabold">{money(a.value)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{c.count} holding{c.count === 1 ? '' : 's'} · {pct(a.pct, false)} of portfolio</p>
                    <div className="mt-3 text-sm"><PL value={c.pl} percent={c.ret} /></div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
