import { motion, useReducedMotion } from 'framer-motion';

import { Loader2 } from 'lucide-react';

export function Eyebrow({ children, light }) {
  return (
    <p
      className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] ${
        light ? 'text-beige' : 'text-wine'
      }`}
    >
      <span className={`inline-block h-px w-8 ${light ? 'bg-beige/70' : 'bg-wine'}`} aria-hidden />
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
          className={`font-display mt-5 text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl ${
            light ? 'text-paper' : 'text-ink'
          }`}
        >
          {title}
        </h2>
        {lede && (
          <p className={`mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${light ? 'text-paper/70' : 'text-ink/70'} ${align === 'center' ? 'mx-auto' : ''}`}>
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
    <div className="flex items-center justify-center gap-3 py-14 text-ink/60" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-wine" />
      <span className="text-sm tracking-wide">{label}…</span>
    </div>
  );
}

export function Empty({ title, body }) {
  return (
    <div className="border editorial-rule bg-cream/60 px-6 py-10 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/60">{body}</p>}
    </div>
  );
}

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-wine">{message}</p>;
}

export const inputCls =
  'w-full border border-ink/20 bg-white/70 px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition focus:border-wine focus:ring-2 focus:ring-wine/15 rounded-none';

export const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-wine px-6 py-3 text-sm font-semibold tracking-wide text-paper transition hover:bg-wine-deep disabled:cursor-not-allowed disabled:opacity-50';

export const btnGhostDark =
  'inline-flex items-center justify-center gap-2 border border-paper/40 px-6 py-3 text-sm font-semibold tracking-wide text-paper transition hover:border-paper hover:bg-paper/10';

export const btnOutline =
  'inline-flex items-center justify-center gap-2 border border-ink/25 px-6 py-3 text-sm font-semibold tracking-wide text-ink transition hover:border-wine hover:text-wine';
