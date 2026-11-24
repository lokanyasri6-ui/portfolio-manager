import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, PieChart, ShieldCheck, TrendingUp } from 'lucide-react';
import { LiveLine, Logo, Mesh } from '../components/Decor';
import { useTheme } from '../context/ThemeContext';
import { inputCls, Label } from '../components/ui';

export function Field({ label, icon: Icon, type = 'text', ...p }) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div>
      <Label>{label}</Label>
      <div className="group relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-indigo-500" />}
        <input type={isPw && show ? 'text' : type} className={`${inputCls} ${Icon ? 'pl-11' : ''} ${isPw ? 'pr-11' : ''}`} {...p} />
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-indigo-500">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

const PERKS = [
  { icon: TrendingUp, t: 'Live profit & loss', d: 'Every holding, calculated to 2 decimals.' },
  { icon: PieChart, t: 'Allocation insight', d: 'Stocks, Mutual Funds and Others at a glance.' },
  { icon: ShieldCheck, t: 'Private by design', d: 'Token-secured access to your own data.' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  useTheme();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* left: animated visual */}
      <div className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <Mesh />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,transparent,rgba(11,15,30,.75))]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link to="/"><Logo size="lg" /></Link>
          <div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl font-extrabold leading-tight">
              Grow every <span className="text-gradient">rupee</span> with clarity.
            </motion.h2>
            <p className="mt-4 max-w-md text-slate-300">Your investments, returns and allocation — beautifully tracked in one premium dashboard.</p>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Portfolio performance</p>
              <LiveLine className="mt-2 h-32 w-full" />
            </motion.div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PERKS.map((p, i) => (
              <motion.div key={p.t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                <p.icon className="h-5 w-5 text-indigo-300" />
                <p className="mt-2 text-sm font-bold">{p.t}</p>
                <p className="mt-1 text-xs text-slate-300">{p.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* right: form */}
      <div className="aurora relative flex items-center justify-center px-5 py-10 sm:px-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Link to="/" className="mb-8 block lg:hidden"><Logo /></Link>
          <h1 className="font-display text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>
        </motion.div>
      </div>
    </div>
  );
}
