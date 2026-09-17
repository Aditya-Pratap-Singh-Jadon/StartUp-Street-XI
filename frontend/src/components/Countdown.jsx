import { useEffect, useState } from "react";
import { EVENT_START_ISO } from "../lib/api";

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
    const id = setInterval(() => {
      setP(parts(target));
    }, 1000);

    return () => clearInterval(id);
  }, [target]);

  const end = target + 24 * 60 * 60 * 1000;

  const live = Date.now() >= target && Date.now() <= end;
  const done = Date.now() > end;

  return {
    ...p,
    live,
    done,
  };
}

export default function Countdown() {
  const { d, h, m, s, live, done } = useCountdown();

  if (live) {
    return (
      <div className="relative flex items-center gap-2.5 overflow-hidden rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2.5 shadow-[0_0_30px_rgba(56,217,255,0.08)] backdrop-blur-xl">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(56,217,255,0.9)]" />
        </span>

        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100">
          Live now
        </span>

        <span className="hidden text-[9px] font-medium tracking-[0.08em] text-white/40 sm:inline">
          Marathon is on
        </span>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4.5 px-4 py-2.5 backdrop-blur-xl">
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />

        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/55">
          Edition XI
        </span>

        <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/25">
          Concluded
        </span>
      </div>
    );
  }

  const cells = [
    { value: d, label: "Days" },
    { value: h, label: "Hours" },
    { value: m, label: "Minutes" },
    { value: s, label: "Seconds" },
  ];

  return (
    <div
      role="timer"
      aria-label="Countdown to StartupStreet XI"
      className="flex items-center gap-1.5"
    >
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          className="group relative flex min-w-13.75 flex-col items-center justify-center overflow-hidden rounded-[12px] border border-white/10 bg-[#0a1427]/75 px-2.5 py-2 backdrop-blur-xl transition duration-300 hover:border-cyan-300/25 hover:bg-cyan-300/5.5 sm:min-w-16 sm:px-3 sm:py-2.5"
        >
          {/* subtle top light */}
          <div
            className={`pointer-events-none absolute inset-x-3 top-0 h-px ${index === 3
                ? "bg-cyan-300/50"
                : "bg-white/10"
              }`}
          />

          <div className="font-display text-[22px] font-semibold leading-none tracking-[-0.055em] text-white tabular-nums sm:text-[25px]">
            {String(cell.value).padStart(2, "0")}
          </div>

          <div className="mt-1 text-[7px] font-bold uppercase tracking-[0.18em] text-white/30 sm:text-[8px]">
            {cell.label}
          </div>
        </div>
      ))}
    </div>
  );
}