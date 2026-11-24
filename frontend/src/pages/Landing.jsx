import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, FileText, PieChart, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { LiveLine, Logo, Mesh } from '../components/Decor';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun } from 'lucide-react';

const FEATURES = [
  { icon: Wallet, t: 'Track every investment', d: 'Add stocks, mutual funds and other assets with units, prices, dates and notes.', c: ['#6366F1', '#8B5CF6'] },
  { icon: TrendingUp, t: 'Profit & loss, instantly', d: 'See gain, loss and return % per holding and across the whole portfolio.', c: ['#10B981', '#06B6D4'] },
  { icon: PieChart, t: 'Allocation donut', d: 'Understand how your wealth is split between Stocks, Mutual Funds and Others.', c: ['#06B6D4', '#3B82F6'] },
  { icon: BarChart3, t: 'Performance graphs', d: 'Gradient-filled charts that show how your portfolio value moves over time.', c: ['#F59E0B', '#EC4899'] },
  { icon: FileText, t: 'Reports on demand', d: 'Generate reports and download them as PDF or CSV whenever you need.', c: ['#8B5CF6', '#EC4899'] },
  { icon: ShieldCheck, t: 'Secure & private', d: 'Token-based authentication keeps your portfolio visible only to you.', c: ['#3B82F6', '#6366F1'] },
];

const STEPS = [
  ['Create account', 'Register in seconds with your email and a username.'],
  ['Add investments', 'Enter what you own: units, purchase price and current price.'],
  ['Watch it grow', 'Dashboard, allocation and P&L update from your real data.'],
];

export default function Landing() {
  const { dark, toggle } = useTheme();
  const { token } = useAuth();
  return (
    <div className="aurora min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-ink/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggle} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5">
              {dark ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5 text-indigo-500" />}
            </button>
            {token ? (
              <Link to="/dashboard" className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-2xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-200/60 dark:hover:bg-white/10">Login</Link>
                <Link to="/register" className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:shadow-indigo-500/70">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:pt-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink p-8 text-white shadow-2xl sm:p-14">
          <Mesh />
          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Personal Investment Portfolio Manager
              </motion.span>
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
                Your wealth, <span className="text-gradient">beautifully</span> in focus.
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5 max-w-lg text-lg text-slate-300">
                Track stocks, mutual funds and more. See profit, loss, returns and allocation in one stunning dashboard.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-bold text-ink shadow-xl transition hover:scale-105">
                  Get started free <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
                <Link to="/login" className="rounded-2xl border border-white/25 bg-white/10 px-6 py-3.5 font-bold backdrop-blur-xl transition hover:bg-white/20">Login</Link>
              </motion.div>
            </div>
            <div className="relative">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity }} className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-200">
                  <span>Portfolio performance</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live</span>
                </div>
                <LiveLine className="mt-3 h-44 w-full" />
              </motion.div>
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -left-4 -top-6 hidden rounded-2xl border border-white/20 bg-emerald-400/20 px-4 py-3 backdrop-blur-xl sm:block">
                <p className="text-[11px] font-semibold uppercase text-emerald-200">Profit</p>
                <p className="flex items-center gap-1 font-display font-bold text-emerald-300"><TrendingUp className="h-4 w-4" /> Always visible</p>
              </motion.div>
              <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 7, repeat: Infinity }} className="absolute -bottom-6 -right-3 hidden rounded-2xl border border-white/20 bg-violet-400/20 px-4 py-3 backdrop-blur-xl sm:block">
                <p className="text-[11px] font-semibold uppercase text-violet-200">Allocation</p>
                <p className="flex items-center gap-1 font-display font-bold"><PieChart className="h-4 w-4" /> Stocks · MF · Others</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Everything you need to <span className="text-gradient">invest smarter</span></h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Built for individual investors who want clarity, not clutter.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.t} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} whileHover={{ y: -8 }}
              style={{ '--glow': f.c[0] + '55' }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-[0_24px_50px_-12px_var(--glow)] dark:border-white/10 dark:bg-white/[0.04]">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg,${f.c[0]},${f.c[1]})` }} />
              <div className="grid h-12 w-12 place-items-center rounded-full text-white transition group-hover:scale-110 group-hover:rotate-6" style={{ background: `linear-gradient(135deg,${f.c[0]},${f.c[1]})` }}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{f.t}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* steps */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
              <span className="font-display text-5xl font-extrabold text-gradient">0{i + 1}</span>
              <h3 className="mt-3 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 p-10 text-center text-white shadow-2xl sm:p-16">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Ready to take control of your portfolio?</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">Create your free account and add your first investment today.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="rounded-2xl bg-white px-7 py-3.5 font-bold text-indigo-700 shadow-xl transition hover:scale-105">Register</Link>
            <Link to="/login" className="rounded-2xl border border-white/40 px-7 py-3.5 font-bold transition hover:bg-white/10">Login</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/60 py-8 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} Folio. Investments are subject to market risk.</p>
          <div className="flex gap-5 font-semibold">
            <Link to="/login" className="hover:text-indigo-500">Login</Link>
            <Link to="/register" className="hover:text-indigo-500">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
