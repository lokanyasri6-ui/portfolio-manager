import { motion } from 'framer-motion';

/** Purely decorative animated gradient mesh (no data). */
export const Mesh = ({ className = '' }) => (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
    <motion.div
      className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-indigo-600/60 blur-[100px]"
      animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute -right-24 top-1/4 h-[26rem] w-[26rem] rounded-full bg-violet-600/50 blur-[100px]"
      animate={{ x: [0, -70, 0], y: [0, 80, 0] }}
      transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute -bottom-24 left-1/4 h-[24rem] w-[24rem] rounded-full bg-blue-600/50 blur-[100px]"
      animate={{ x: [0, 60, 0], y: [0, -70, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

/** Decorative self-drawing line chart. Intentionally has no numbers or labels. */
export const LiveLine = ({ className = '', stroke = '#A5B4FC' }) => (
  <svg viewBox="0 0 400 140" className={className} fill="none" preserveAspectRatio="none">
    <defs>
      <linearGradient id="ll-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
        <stop offset="100%" stopColor={stroke} stopOpacity="0" />
      </linearGradient>
    </defs>
    <motion.path
      d="M0 110 C 30 100, 50 118, 80 92 S 130 70, 160 80 S 210 40, 240 52 S 300 30, 330 22 S 380 14, 400 8 L400 140 L0 140 Z"
      fill="url(#ll-fill)"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.6 }}
    />
    <motion.path
      d="M0 110 C 30 100, 50 118, 80 92 S 130 70, 160 80 S 210 40, 240 52 S 300 30, 330 22 S 380 14, 400 8"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse', repeatDelay: 1 }}
    />
    <motion.circle r="5" fill="#fff" cx="400" cy="8" animate={{ scale: [1, 1.8, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
  </svg>
);

export const Logo = ({ size = 'md' }) => (
  <div className="flex items-center gap-2.5">
    <div
      className={`grid place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-lg shadow-indigo-500/50 ${size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    </div>
    <span className={`font-display font-extrabold tracking-tight ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>
      Folio<span className="text-gradient">.</span>
    </span>
  </div>
);
