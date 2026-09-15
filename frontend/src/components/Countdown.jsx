import { useEffect, useState } from 'react';
import { EVENT_START_ISO } from '../lib/api';

function parts(target) {
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export function useCountdown(targetISO = EVENT_START_ISO) {
  const target = new Date(targetISO).getTime();
  const [p, setP] = useState(() => parts(target));
  useEffect(() => {
    const id = setInterval(() => setP(parts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const end = target + 24 * 3600 * 1000;
  const live = Date.now() >= target && Date.now() <= end;
  const done = Date.now() > end;
  return { ...p, live, done };
}

export default function Countdown({ dark = false }) {
  const { d, h, m, s, live, done } = useCountdown();
  const cells = [
    { v: d, l: 'Days' },
    { v: h, l: 'Hours' },
    { v: m, l: 'Mins' },
    { v: s, l: 'Secs' },
  ];
  if (live)
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${dark ? 'bg-wine text-paper' : 'bg-ink text-paper'}`}>
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
        Live now — the marathon is on
      </div>
    );
  if (done)
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${dark ? 'border border-paper/30 text-paper' : 'border border-ink/20 text-ink'}`}>
        Edition XI — concluded
      </div>
    );
  return (
    <div className="flex items-stretch gap-2" role="timer" aria-label="Countdown to Startup Street XI">
      {cells.map((c) => (
        <div
          key={c.l}
          className={`min-w-[64px] px-3 py-2 text-center ${dark ? 'border border-paper/25 bg-paper/5' : 'border border-ink/15 bg-white/60'}`}
        >
          <div className={`font-display text-2xl font-semibold tabular-nums sm:text-3xl ${dark ? 'text-paper' : 'text-ink'}`}>
            {String(c.v).padStart(2, '0')}
          </div>
          <div className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? 'text-paper/60' : 'text-ink/50'}`}>{c.l}</div>
        </div>
      ))}
    </div>
  );
}
