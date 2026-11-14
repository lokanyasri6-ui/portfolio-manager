import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, FileText, LayoutDashboard, LogOut, Menu, Moon, PieChart, ShieldCheck, Sun, TrendingUp, Wallet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DataProvider } from '../context/DataContext';
import Ticker from './Ticker';
import { Logo } from './Decor';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/investments', label: 'Investments', icon: Wallet },
  { to: '/portfolio', label: 'Portfolio', icon: BarChart3 },
  { to: '/profit-loss', label: 'Profit & Loss', icon: TrendingUp },
  { to: '/allocation', label: 'Allocation', icon: PieChart },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, admin: true },
];

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const known = user && ['is_staff', 'is_superuser', 'role', 'is_admin'].some((k) => k in user);
  const isAdmin = !known || user.is_staff || user.is_superuser || user.role === 'admin' || user.is_admin;
  const name = user?.name || user?.first_name || user?.username || 'Investor';

  return (
    <div className="flex h-full flex-col bg-ink p-5 text-slate-300">
      <div className="mb-8 mt-1 px-1 text-white">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1.5">
        {NAV.filter((n) => !n.admin || isAdmin).map((n) => (
          <NavLink key={n.to} to={n.to} onClick={onNavigate}>
            {({ isActive }) => (
              <div
                className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/25 to-violet-500/10 text-white shadow-[0_0_28px_rgba(99,102,241,.45)] ring-1 ring-indigo-400/40'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && <span className="absolute -left-5 h-7 w-1.5 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500 shadow-[0_0_14px_#818cf8]" />}
                <n.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-300' : ''}`} />
                {n.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white">{name[0]?.toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email || user?.username}</p>
          </div>
          <button
            title="Log out"
            onClick={() => {
              logout();
              nav('/login');
            }}
            className="rounded-xl p-2 transition hover:bg-rose-500/20 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const loc = useLocation();
  const title = NAV.find((n) => loc.pathname.startsWith(n.to))?.label || 'Folio';

  return (
    <DataProvider>
      <div className="aurora fixed inset-0 -z-10" />
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
          <Sidebar />
        </aside>

        <AnimatePresence>
          {open && (
            <>
              <motion.div className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.aside className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
                <button onClick={() => setOpen(false)} className="absolute right-3 top-4 z-10 rounded-xl p-2 text-white hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
                <Sidebar onNavigate={() => setOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <div className="sticky top-0 z-30">
            <Ticker />
            <header className="flex items-center justify-between gap-3 border-b border-slate-200/60 bg-white/60 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-ink/60 sm:px-8">
              <div className="flex items-center gap-3">
                <button onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-slate-200/60 dark:hover:bg-white/10 lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
                <h2 className="font-display text-lg font-extrabold">{title}</h2>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.85, rotate: 90 }}
                  onClick={toggle}
                  title="Toggle theme"
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white/70 transition hover:shadow-glow dark:border-white/10 dark:bg-white/5"
                >
                  {dark ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5 text-indigo-500" />}
                </motion.button>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold leading-tight">{user?.name || user?.username || 'Investor'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Personal portfolio</p>
                </div>
              </div>
            </header>
          </div>

          <main className="flex-1 px-4 py-6 sm:px-8">
            <AnimatePresence mode="wait">
              <motion.div key={loc.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
