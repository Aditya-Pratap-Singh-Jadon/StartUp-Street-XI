import { useEffect, useState } from 'react';
import { Instagram, Linkedin, Globe, Mail } from 'lucide-react';
import { apiGet } from '../lib/api';

export default function Footer({ onNav }) {
  const [cfg, setCfg] = useState({});
  useEffect(() => {
    apiGet('/api/config').then(setCfg).catch(() => {});
  }, []);

  const socials = [
    cfg.instagram_url ? { icon: Instagram, href: cfg.instagram_url, label: 'Instagram' } : null,
    cfg.linkedin_url ? { icon: Linkedin, href: cfg.linkedin_url, label: 'LinkedIn' } : null,
    cfg.website_url ? { icon: Globe, href: cfg.website_url, label: 'Website' } : null,
    cfg.contact_email ? { icon: Mail, href: `mailto:${cfg.contact_email}`, label: 'Email' } : null,
  ].filter(Boolean);

  const links = [
    { label: 'About', hash: '#about' },
    { label: 'Journey', hash: '#journey' },
    { label: 'Timeline', hash: '#timeline' },
    { label: 'Judges', hash: '#jury' },
    { label: 'Rules', hash: '#rules' },
    { label: 'FAQ', hash: '#faq' },
    { label: 'Login', hash: '__login' },
  ];

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-beige/70">CSED · VIT Vellore · graVITas 2026</p>
            <p className="font-display mt-4 text-4xl leading-[1.02] font-medium tracking-tight sm:text-5xl">
              Startup<br />Street <span className="text-clay-soft italic">XI</span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/60">
              A 24-hour entrepreneurship marathon — the Shark Tank of VIT. Ideate, validate, connect and pitch under expert mentorship.
            </p>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noreferrer"
                    aria-label={s.label}
                    className="inline-flex h-10 w-10 items-center justify-center border border-paper/20 text-paper/70 transition hover:border-clay-soft hover:text-paper"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <nav aria-label="Footer">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-paper/45">Explore</p>
            <ul className="mt-5 space-y-3">
              {links.map((l) => (
                <li key={l.label}>
                  {l.hash === '__login' ? (
                    <a href="/login" className="text-sm text-paper/75 transition hover:text-paper">
                      {l.label}
                    </a>
                  ) : (
                    <button onClick={() => onNav(l.hash)} className="text-sm text-paper/75 transition hover:text-paper">
                      {l.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-paper/45">Event</p>
            <ul className="mt-5 space-y-3 text-sm text-paper/75">
              <li>18–19 September 2026</li>
              <li>24 hours · Teams of 2–5</li>
              <li>CSED, VIT Vellore</li>
              {cfg.contact_email && (
                <li>
                  <a href={`mailto:${cfg.contact_email}`} className="underline decoration-clay-soft/60 underline-offset-4 hover:text-paper">
                    {cfg.contact_email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-paper/12 pt-6 text-[11px] font-medium uppercase tracking-[0.2em] text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p>Startup Street XI · CSED, VIT Vellore · graVITas 2026</p>
          <p>Ideate → Validate → Connect → Pitch</p>
        </div>
      </div>
    </footer>
  );
}
