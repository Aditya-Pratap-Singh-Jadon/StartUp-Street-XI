import { motion, useReducedMotion } from 'framer-motion';

import { Loader2 } from 'lucide-react';

export function Eyebrow({ children, light }) {
  return (
    <p
      className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200`}
    >
      <span className={`inline-block h-px w-8 bg-cyan-200/70`} aria-hidden />
      {children}
    </p>
  );
}

export function SectionHeading({
  index,
  label,
  title,
  lede,
  light,
  align = 'left',
}) {
  return (
    <Reveal>
      <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
        <Eyebrow light={light}>
          {index} — {label}
        </Eyebrow>
        <h2
          className={`font-display mt-5 text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl text-white`}
        >
          {title}
        </h2>
        {lede && (
          <p className={`mt-5 max-w-2xl text-base leading-relaxed sm:text-lg text-white/70 ${align === 'center' ? 'mx-auto' : ''}`}>
            {lede}
          </p>
        )}
      </div>
    </Reveal>
  );
}

export function Reveal({ children, delay = 0, className }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Loader({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-14 text-white/60" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
      <span className="text-sm tracking-wide">{label}…</span>
    </div>
  );
}

export function Empty({ title, body }) {
  return (
    <div className="border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-md">
      <p className="font-display text-xl text-white">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">{body}</p>}
    </div>
  );
}

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-400">{message}</p>;
}

export const inputCls =
  'w-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/15 rounded-none backdrop-blur-sm';

export const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-semibold tracking-wide text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50';

export const btnGhostDark =
  'inline-flex items-center justify-center gap-2 border border-white/40 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:border-white hover:bg-white/10';

export const btnOutline =
  'inline-flex items-center justify-center gap-2 border border-white/25 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:border-cyan-300 hover:text-cyan-300';
