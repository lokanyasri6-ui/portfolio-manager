import { motion, AnimatePresence } from 'framer-motion';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Inbox, Loader2, X } from 'lucide-react';
import { catStyle, money, num, pct } from '../utils/format';

export const inputCls =
  'w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:shadow-[0_0_24px_rgba(99,102,241,.35)]';

export const Glass = ({ className = '', children, hover = false, ...p }) => (
  <motion.div
    whileHover={hover ? { y: -4 } : undefined}
    className={`rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-soft ${className}`}
    {...p}
  >
    {children}
  </motion.div>
);

export const Btn = ({ variant = 'primary', className = '', loading, children, ...p }) => {
  const v = {
    primary: 'text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/60',
    ghost: 'border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10',
    danger: 'text-white bg-gradient-to-r from-rose-500 to-red-500 shadow-lg shadow-rose-500/30 hover:shadow-rose-500/60',
  }[variant];
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      disabled={loading || p.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${v} ${className}`}
      {...p}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
};

export const Badge = ({ cat }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${catStyle(cat).badge}`}>
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: `linear-gradient(135deg,${catStyle(cat).from},${catStyle(cat).to})` }} />
    {cat}
  </span>
);

export const PL = ({ value, percent, showIcon = true }) => {
  const v = num(value);
  const c = v > 0 ? 'text-emerald-500' : v < 0 ? 'text-rose-500' : 'text-slate-400';
  const Icon = v < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${c}`}>
      {showIcon && v !== 0 && <Icon className="h-4 w-4" />}
      {money(v)}
      {percent != null && <span className="text-xs opacity-80">({pct(percent)})</span>}
    </span>
  );
};

export const Sparkline = ({ data, color = '#6366F1', height = 44 }) => {
  if (!data || data.length < 2) return null;
  const id = 'sp' + color.replace('#', '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data.map((v) => ({ v }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const KPI = ({ title, value, icon: Icon, from, to, series, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -6 }}
    style={{ '--glow': from + '55' }}
    className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-[0_24px_50px_-12px_var(--glow)] dark:border-white/10 dark:bg-white/[0.04]"
  >
    <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg,${from},${to})` }} />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-2 truncate font-display text-xl font-extrabold sm:text-2xl">{value}</p>
        {sub && <div className="mt-1 text-xs">{sub}</div>}
      </div>
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6"
        style={{ background: `linear-gradient(135deg,${from},${to})`, boxShadow: `0 8px 20px -6px ${from}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-3 -mb-2 -mx-1">
      <Sparkline data={series} color={from} />
    </div>
  </motion.div>
);

export const ChartTooltip = ({ active, payload, label, fmt = money }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-ink/90 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-xl">
      {label != null && <p className="mb-1 font-semibold text-slate-300">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: <b>{fmt(p.value)}</b>
        </p>
      ))}
    </div>
  );
};

export const Donut = ({ data, total, label = 'Total Value', height = 280 }) => {
  const rows = data.filter((d) => d.value > 0);
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <defs>
            {rows.map((d) => (
              <linearGradient key={d.name} id={`dn-${d.name.replace(/\s/g, '')}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={catStyle(d.name).from} />
                <stop offset="100%" stopColor={catStyle(d.name).to} />
              </linearGradient>
            ))}
          </defs>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="94%" paddingAngle={4} cornerRadius={12} stroke="none">
            {rows.map((d) => (
              <Cell key={d.name} fill={`url(#dn-${d.name.replace(/\s/g, '')})`} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <p className="font-display text-lg font-extrabold sm:text-xl">{money(total)}</p>
        </div>
      </div>
    </div>
  );
};

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="grid place-items-center py-20 text-slate-500 dark:text-slate-400">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    <p className="mt-3 text-sm">{label}</p>
  </div>
);

export const Empty = ({ title = 'Nothing here yet', text, action }) => (
  <div className="grid place-items-center px-6 py-14 text-center">
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-400">
      <Inbox className="h-7 w-7" />
    </div>
    <p className="mt-4 font-display font-bold">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorBox = ({ message, onRetry }) =>
  !message ? null : (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  );

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </div>
);

export const Modal = ({ open, onClose, title, children, wide }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-[100] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          className={`relative max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-ink-800 ${wide ? 'max-w-3xl' : 'max-w-xl'}`}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">{title}</h2>
            <button onClick={onClose} className="rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Label = ({ children }) => <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{children}</label>;
