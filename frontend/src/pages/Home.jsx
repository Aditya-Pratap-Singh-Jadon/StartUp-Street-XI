import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight, ArrowRight, Users, Lightbulb, ClipboardCheck, Network, Mic,
  ChevronDown, AlertTriangle, Clock, MapPin, CalendarDays, FileCheck, Github,
  BellRing, Trophy, ShieldCheck,
} from 'lucide-react';
import HeroCanvas from '../components/HeroCanvas';
import Countdown from '../components/Countdown';
import Footer from '../components/Footer';
import Nav from '../components/Nav';
import { Eyebrow, SectionHeading, Reveal, Loader, Empty } from '../components/ui';
import { apiGet } from '../lib/api';



const RULES = [
  'Teams must consist of eligible participants as per graVITas guidelines.',
  'Participants may compete individually or in teams of 2–4 members.',
  'All ideation, validation and development must happen strictly during the 24-hour event.',
  'External assistance is prohibited except guidance from assigned mentors.',
  'Participants must attend scheduled review checkpoints.',
  'Final presentations must follow the allotted pitching time.',
  'Plagiarism or pre-existing startup ideas result in immediate disqualification.',
  'Professional conduct is expected throughout the event.',
  "Judges' and organizing committee's decisions are final and binding.",
];

const JOURNEY = [
  { n: '01', title: 'IDEATE', sub: 'Find the right problem', body: 'Form a team and hunt for a problem worth solving. Frame the pain point, define the customer, and shape a sharp venture thesis inside the opening hours of the marathon.', icon: Lightbulb },
  { n: '02', title: 'VALIDATE', sub: 'Test the market and business model', body: 'Stress-test assumptions with rapid research, sizing and unit economics. Kill weak ideas fast and converge on a model that can survive contact with reality.', icon: ClipboardCheck },
  { n: '03', title: 'CONNECT', sub: 'Meet founders, mentors and industry leaders', body: 'Sit with entrepreneurs, investors and operators. Mentorship, collaboration and hard feedback turn a rough concept into a defensible venture.', icon: Network },
  { n: '04', title: 'PITCH', sub: 'Present the venture to an expert jury', body: 'Distil 24 hours of work into a compelling pitch. Present to an expert jury of founders and industry leaders — the Shark Tank of VIT.', icon: Mic },
];

const PERKS = [
  { icon: Users, title: 'Mentorship', body: 'Guided reviews with founders and operators through checkpoints.' },
  { icon: Network, title: 'Networking', body: 'Direct access to entrepreneurs, investors and industry leaders.' },
  { icon: FileCheck, title: 'Experiential learning', body: 'Build, validate and pitch a venture inside one intense day.' },
  { icon: Trophy, title: 'Exposure', body: 'Present on a flagship graVITas stage in front of a real jury.' },
];

function scrollTo(hash) {
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Home() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState(null);
  const [judges, setJudges] = useState(null);
  const [faqs, setFaqs] = useState(null);
  const [results, setResults] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    apiGet('/api/timeline').then(setTimeline).catch(() => setTimeline([]));
    apiGet('/api/judges').then(setJudges).catch(() => setJudges([]));
    apiGet('/api/faqs').then(setFaqs).catch(() => setFaqs([]));
    apiGet('/api/results').then(setResults).catch(() => setResults([]));
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
    }
  }, []);

  const faqCats = faqs ? Array.from(new Set(faqs.map((f) => f.category))) : [];
  const winners = (results || []).filter((r) => r.position === 'Winner');
  const runners = (results || []).filter((r) => r.position === 'Runner-up');
  const others = (results || []).filter((r) => r.position !== 'Winner' && r.position !== 'Runner-up');
  const hasResults = (results || []).length > 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav />
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <HeroCanvas className="pointer-events-none absolute inset-0 h-full w-full opacity-100" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_100%,rgba(94,18,36,0.35),transparent_55%)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pt-36 pb-16 sm:px-6 sm:pt-44 sm:pb-24">
          <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <Eyebrow light>The Shark Tank of VIT — Edition XI</Eyebrow>
            <h1 className="font-display mt-6 text-[13.5vw] leading-[0.92] font-medium tracking-tight text-balance sm:text-7xl lg:text-[7.5rem]">
              Startup<br />Street <span className="text-clay-soft italic">XI</span>
            </h1>
            <p className="font-display mt-6 text-xl tracking-wide text-beige sm:text-2xl">
              24 HOURS. ONE IDEA. <span className="text-clay-soft">ONE VENTURE.</span>
            </p>
            <p className="mt-4 flex max-w-xl flex-wrap items-center gap-x-5 gap-y-2 text-sm text-paper/65">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="text-clay-soft" /> 18–19 September</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={15} className="text-clay-soft" /> 24-hour marathon</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-clay-soft" /> VIT Vellore · graVITas 2026</span>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login?mode=register" className="inline-flex items-center gap-2 bg-wine px-7 py-3.5 text-sm font-semibold tracking-wide text-paper transition hover:bg-clay">
                Register / Login <ArrowUpRight size={16} />
              </Link>
              <button onClick={() => scrollTo('#about')} className="inline-flex items-center gap-2 border border-paper/35 px-7 py-3.5 text-sm font-semibold tracking-wide text-paper transition hover:border-paper hover:bg-paper/10">
                Explore Event <ArrowRight size={16} />
              </button>
            </div>
            <div className="mt-10">
              <Countdown dark />
            </div>
          </motion.div>
        </div>
        {/* stat strip */}
        <div className="relative border-t border-paper/12">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-paper/12 px-4 sm:px-6 lg:grid-cols-4">
            {[
              ['24', 'Hours of building'],
              ['500+', 'Student founders'],
              ['2–5', 'Members per team'],
              ['XI', 'Edition, graVITas 2026'],
            ].map(([v, l]) => (
              <div key={l} className="px-4 py-5 sm:px-6">
                <p className="font-display text-3xl font-medium text-beige sm:text-4xl">{v}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/50">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* marquee */}
      <div className="overflow-hidden border-b border-ink/10 bg-cream py-3" aria-hidden>
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
          {[0, 1].map((k) => (
            <p key={k} className="text-[12px] font-semibold uppercase tracking-[0.3em] text-ink/55">
              Ideate · Validate · Connect · Pitch · Ideate · Validate · Connect · Pitch · Ideate · Validate · Connect · Pitch ·
            </p>
          ))}
        </div>
      </div>

      {/* ============ ABOUT ============ */}
      <section id="about" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading
          index="01" label="About the event"
          title={<>A 24-hour entrepreneurship <span className="text-wine italic">marathon.</span></>}
          lede="Startup Street XI is the flagship entrepreneurship event of CSED, VIT Vellore — organized as part of graVITas 2026. Over 500 students develop, validate and refine startup ideas under expert mentorship before pitching to entrepreneurs, investors, Shark Tank-funded founders and industry leaders."
        />
        <div className="mt-12 grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <div className="h-full bg-paper p-7 transition hover:bg-cream">
                <p.icon size={22} className="text-wine" strokeWidth={1.75} />
                <p className="font-display mt-5 text-2xl text-ink">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{p.body}</p>
                <p className="mt-5 text-[11px] font-bold tracking-[0.2em] text-ink/30">0{i + 1}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-8 max-w-3xl border-l-2 border-wine pl-5 text-[15px] leading-relaxed text-ink/75 italic">
            The event is built around mentorship, collaboration, networking and experiential learning — exposing
            participants to real entrepreneurial challenges, from finding the problem to defending the business model
            in front of a jury.
          </p>
        </Reveal>
      </section>

      {/* ============ JOURNEY ============ */}
      <section id="journey" className="scroll-mt-28 bg-ink py-20 text-paper sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            index="02" label="The journey" light
            title={<span className="whitespace-nowrap">Ideate → Validate → <span className="text-clay-soft italic">Connect</span> → Pitch</span>}
            lede="Every team walks the complete startup journey inside 24 hours — from the first problem statement to the final pitch."
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-x-16">
            {JOURNEY.map((j, i) => (
              <Reveal key={j.n} delay={i * 0.05}>
                <div className="group border-t border-paper/15 pt-6 transition hover:border-clay-soft">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-display text-sm tracking-[0.3em] text-clay-soft">{j.n}</p>
                    <j.icon size={26} strokeWidth={1.25} className="text-paper/35 transition group-hover:text-clay-soft" />
                  </div>
                  <h3 className="font-display mt-3 text-4xl font-medium tracking-tight sm:text-5xl">{j.title}</h3>
                  <p className="mt-1 text-sm font-semibold tracking-wide text-beige/80">{j.sub}</p>
                  <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-paper/65">{j.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ JURY ============ */}
      <section id="jury" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading
          index="03" label="Judges & mentors" align="center"
          title={<>Meet the <span className="text-wine italic">jury</span></>}
          lede="Featured judges include technology leaders associated with Shark Tank India Season 1. Full profiles will be revealed by the organizing committee."
        />
        <div className="mt-12">
          {!judges ? (
            <Loader label="Loading jury" />
          ) : judges.length === 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <div className="border border-ink/12 bg-cream/60 p-6">
                    <div className="flex h-44 items-center justify-center bg-beige/50 font-display text-5xl text-ink/25 italic">?</div>
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-wine">To be announced</p>
                    <p className="font-display mt-2 text-2xl text-ink">Jury Member {i}</p>
                    <p className="mt-1 text-sm text-ink/55">Profile to be revealed soon.</p>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {judges.map((j, i) => (
                <Reveal key={j.id} delay={(i % 4) * 0.05}>
                  <article className="group border border-ink/12 bg-white/60 p-6 transition hover:border-wine/40 hover:shadow-[0_18px_45px_rgba(94,18,36,0.08)]">
                    {j.photo_url ? (
                      <img src={j.photo_url} alt={j.name} className="h-44 w-full object-cover grayscale transition group-hover:grayscale-0" loading="lazy" />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-beige/60 font-display text-4xl text-wine/60 italic">
                        {j.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </div>
                    )}
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-wine">{j.organization || 'Startup Street XI'}</p>
                    <h3 className="font-display mt-2 text-2xl leading-tight text-ink">{j.name}</h3>
                    {j.designation && <p className="mt-1 text-sm font-medium text-ink/65">{j.designation}</p>}
                    {j.description && <p className="mt-3 text-sm leading-relaxed text-ink/60">{j.description}</p>}
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ TIMELINE ============ */}
      <section id="timeline" className="scroll-mt-28 border-y border-ink/10 bg-cream/70 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            index="04" label="Event schedule"
            title={<>The road to <span className="text-wine italic">demo day.</span></>}
            lede="The schedule below is maintained live by the organizing committee — updates appear here instantly."
          />
          <div className="mt-12">
            {!timeline ? (
              <Loader label="Loading timeline" />
            ) : timeline.length === 0 ? (
              <Empty title="Schedule coming soon" body="The organizing committee is finalizing the event timeline. Check back shortly." />
            ) : (
              <ol className="relative ml-2 border-l border-ink/15 sm:ml-6">
                {timeline.map((t, i) => (
                  <Reveal key={t.id} delay={Math.min(i * 0.03, 0.3)}>
                    <li className="relative pb-9 pl-8 last:pb-0 sm:pl-12">
                      <span
                        className={`absolute top-1 -left-[7px] h-3.5 w-3.5 rotate-45 border ${t.is_current ? 'border-wine bg-wine' : t.is_completed ? 'border-wine/60 bg-wine/25' : 'border-ink/30 bg-paper'}`}
                        aria-hidden
                      />
                      <div className={`border p-5 sm:p-6 ${t.is_current ? 'border-wine bg-paper shadow-[0_18px_50px_rgba(94,18,36,0.10)]' : 'border-ink/12 bg-paper/70'}`}>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-[11px] font-bold tracking-[0.2em] text-ink/40">{String(i + 1).padStart(2, '0')}</span>
                          {t.is_current && (
                            <span className="bg-wine px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-paper">Current stage</span>
                          )}
                          {t.is_completed && !t.is_current && (
                            <span className="border border-wine/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-wine">Completed</span>
                          )}
                          {t.event_time && (
                            <span className="ml-auto text-xs font-medium text-ink/50">
                              {new Date(t.event_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display mt-2 text-2xl text-ink sm:text-[1.7rem]">{t.title}</h3>
                        {t.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">{t.description}</p>}
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      {/* ============ RESULTS (if published) ============ */}
      {hasResults && (
        <section id="results" className="scroll-mt-28 bg-wine-deep py-20 text-paper sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              index="05" label="Results" light align="center"
              title={<>The verdict is <span className="italic text-clay-soft">in.</span></>}
              lede="Congratulations to the ventures that survived 24 hours of building, validation and pitching."
            />
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {winners.map((r) => (
                <div key={r.id} className="border border-beige/30 bg-wine p-8 text-center">
                  <Trophy className="mx-auto text-beige" size={30} strokeWidth={1.5} />
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.26em] text-beige">Winner</p>
                  <p className="font-display mt-2 text-4xl">{r.team_name}</p>
                  {r.category && <p className="mt-1 text-sm text-paper/65">{r.category}</p>}
                  {r.description && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-paper/70">{r.description}</p>}
                </div>
              ))}
              {runners.map((r) => (
                <div key={r.id} className="border border-paper/20 bg-paper/5 p-8 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-clay-soft">Runner-up</p>
                  <p className="font-display mt-2 text-4xl">{r.team_name}</p>
                  {r.category && <p className="mt-1 text-sm text-paper/65">{r.category}</p>}
                  {r.description && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-paper/70">{r.description}</p>}
                </div>
              ))}
            </div>
            {others.length > 0 && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((r) => (
                  <div key={r.id} className="border border-paper/15 bg-paper/5 p-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-clay-soft">{r.position}{r.category ? ` · ${r.category}` : ''}</p>
                    <p className="font-display mt-2 text-2xl">{r.team_name}</p>
                    {r.description && <p className="mt-2 text-sm leading-relaxed text-paper/65">{r.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ RULES ============ */}
      <section id="rules" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-20 sm:px-6 sm:py-28">
        <SectionHeading
          index={hasResults ? '06' : '05'} label="Rules of the street"
          title={<>Play hard. <span className="text-wine italic">Play fair.</span></>}
          lede="Nine rules govern the marathon. Read them before you register — ignorance is not a defence on demo day."
        />
        <div className="mt-10 grid gap-px border border-ink/12 bg-ink/12 lg:grid-cols-3">
          {RULES.map((r, i) => (
            <Reveal key={i} delay={Math.min(i * 0.03, 0.25)}>
              <div className="flex h-full gap-4 bg-paper p-6">
                <span className="font-display text-2xl text-wine/70 italic">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-sm leading-relaxed text-ink/75">{r}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-6 flex gap-4 border border-wine/30 bg-wine/[0.05] p-5 sm:p-6" role="note" aria-label="Team size notice">
            <AlertTriangle className="mt-0.5 shrink-0 text-wine" size={20} />
            <div className="text-sm leading-relaxed text-ink/75">
              <p className="font-semibold text-ink">A note on team size — flagged for organizers</p>
              <p className="mt-1.5">
                The application brief specifies teams of <strong>2–5 members</strong>, while Rule 2 above mentions
                individuals or teams of 2–4. The platform currently enforces <strong>2–5 members, maximum 5 per
                team</strong>, and team-size limits remain configurable by the admin. Organizers should reconcile the
                rulebook before the event.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="scroll-mt-28 border-t border-ink/10 bg-cream/60 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeading
            index={hasResults ? '07' : '06'} label="Questions, answered" align="center"
            title={<>Before you <span className="text-wine italic">ask.</span></>}
          />
          <div className="mt-10">
            {!faqs ? (
              <Loader label="Loading FAQs" />
            ) : faqs.length === 0 ? (
              <Empty title="FAQs coming soon" body="The organizing committee will publish answers to common questions shortly." />
            ) : (
              faqCats.map((cat) => (
                <div key={cat} className="mb-8">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-wine">{cat}</p>
                  <div className="divide-y divide-ink/10 border-y border-ink/10">
                    {faqs.filter((f) => f.category === cat).map((f) => {
                      const open = openFaq === f.id;
                      return (
                        <div key={f.id}>
                          <button
                            onClick={() => setOpenFaq(open ? null : f.id)}
                            aria-expanded={open}
                            className="flex w-full items-center justify-between gap-4 py-4 text-left"
                          >
                            <span className={`font-display text-lg sm:text-xl ${open ? 'text-wine' : 'text-ink'}`}>{f.question}</span>
                            <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180 text-wine' : 'text-ink/40'}`} />
                          </button>
                          {open && <p className="pb-5 text-sm leading-relaxed whitespace-pre-line text-ink/70">{f.answer}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="bg-ink py-20 text-paper sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-clay-soft">18–19 September · graVITas 2026</p>
            <p className="font-display mx-auto mt-4 max-w-3xl text-4xl leading-tight font-medium text-balance sm:text-6xl">
              You have 24 hours. <span className="italic text-beige">Make them count.</span>
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/login?mode=register" className="inline-flex items-center gap-2 bg-paper px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-beige">
                Register your team <ArrowUpRight size={16} />
              </Link>
              <button onClick={() => navigate('/results')} className="inline-flex items-center gap-2 border border-paper/30 px-7 py-3.5 text-sm font-semibold text-paper transition hover:border-paper">
                View results
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer onNav={scrollTo} />
    </div>
  );
}
