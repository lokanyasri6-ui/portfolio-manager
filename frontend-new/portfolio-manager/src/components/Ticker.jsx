import { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import { num, pct } from '../utils/format';

/**
 * Ticker strip. Sources (real data only):
 *  1. Optional market feed: set VITE_MARKET_API to an endpoint returning
 *     [{ symbol, price, change_percent }] (e.g. NIFTY, SENSEX, RELIANCE).
 *  2. Your own holdings from /api/investments/ with their return %.
 */
export default function Ticker() {
  const { investments } = useData();
  const [market, setMarket] = useState([]);

  useEffect(() => {
    const url = import.meta.env.VITE_MARKET_API;
    if (!url) return;
    let alive = true;
    const pull = () =>
      axios
        .get(url)
        .then((r) => {
          const arr = Array.isArray(r.data) ? r.data : r.data?.results || [];
          if (alive)
            setMarket(
              arr.map((m) => ({ key: 'm' + (m.symbol || m.name), label: m.symbol || m.name, price: m.price, change: num(m.change_percent ?? m.change ?? m.pct) }))
            );
        })
        .catch(() => alive && setMarket([]));
    pull();
    const t = setInterval(pull, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const own = investments.map((i) => ({ key: 'h' + i.id + i.name, label: i.name.toUpperCase(), price: i.current_price, change: i.ret }));
  const items = [...market, ...own];

  return (
    <div className="relative z-30 flex h-10 items-center overflow-hidden border-b border-white/10 bg-ink text-xs text-white">
      <div className="z-10 flex h-full shrink-0 items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-3 font-bold tracking-wider">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> LIVE
      </div>
      {items.length === 0 ? (
        <p className="px-4 text-slate-400">Add investments to see your holdings stream here.</p>
      ) : (
        <div className="ticker-mask flex-1 overflow-hidden">
          <div className="ticker-track flex w-max animate-marquee gap-10 whitespace-nowrap py-2" style={{ animationDuration: `${Math.max(25, items.length * 6)}s` }}>
            {[...items, ...items].map((t, idx) => {
              const up = t.change >= 0;
              return (
                <span key={t.key + idx} className="inline-flex items-center gap-2">
                  <b className="text-slate-200">{t.label}</b>
                  {t.price != null && <span className="text-slate-400">{num(t.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                  <span className={`inline-flex items-center gap-1 font-semibold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {pct(t.change)}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
