import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LINKS = [
  { to: '/#about', label: 'About' },
  { to: '/#journey', label: 'Journey' },
  { to: '/#jury', label: 'Jury' },
  { to: '/#timeline', label: 'Timeline' },
  { to: '/#rules', label: 'Rules' },
  { to: '/#faq', label: 'FAQ' },
];

export default function Nav() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (hash) => {
    setOpen(false);
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 120);
    } else {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-wine-deep text-paper">
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.24em] sm:text-[11px]">
          <span className="hidden sm:inline">CSED · VIT Vellore · graVITas 2026</span>
          <span className="sm:hidden">graVITas 2026 · VIT Vellore</span>
          <span aria-hidden className="text-clay-soft">—</span>
          <span>18–19 September</span>
        </p>
      </div>
      <div
        className={`border-b transition-all ${scrolled ? 'border-ink/10 bg-paper/92 shadow-[0_8px_30px_rgba(22,19,15,0.06)] backdrop-blur-md' : 'border-transparent bg-paper/60 backdrop-blur-sm'}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="group flex items-baseline gap-2.5" aria-label="Startup Street XI home">
            <span className="bg-ink px-2 py-1 font-display text-sm font-bold tracking-tight text-paper transition group-hover:bg-wine">
              SS—XI
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.26em] text-ink/70 md:inline">
              Startup Street
            </span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => go(l.to.slice(1))}
                className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink/65 transition hover:text-wine"
              >
                {l.label}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-2.5 lg:flex">
            {user ? (
              <>
                <NavLink
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className="border border-ink/20 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition hover:border-wine hover:text-wine"
                >
                  {isAdmin ? 'Admin' : 'Dashboard'}
                </NavLink>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink/55 transition hover:text-wine"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink/70 transition hover:text-wine"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/login?mode=register"
                  className="inline-flex items-center gap-1.5 bg-wine px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-paper transition hover:bg-wine-deep"
                >
                  Register <ArrowUpRight className="h-3.5 w-3.5" />
                </NavLink>
              </>
            )}
            {profile?.role === 'participant' || (!user && false) ? null : null}
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center border border-ink/15 text-ink lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-ink/10 bg-paper px-4 pt-2 pb-6 lg:hidden">
            <nav className="flex flex-col" aria-label="Mobile">
              {LINKS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => go(l.to.slice(1))}
                  className="border-b border-ink/8 py-3 text-left font-display text-2xl text-ink transition hover:text-wine"
                >
                  {l.label}
                </button>
              ))}
              <div className="mt-4 flex gap-2.5">
                {user ? (
                  <>
                    <NavLink
                      to={isAdmin ? '/admin' : '/dashboard'}
                      onClick={() => setOpen(false)}
                      className="flex-1 bg-ink px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-paper"
                    >
                      {isAdmin ? 'Admin' : 'Dashboard'}
                    </NavLink>
                    <button
                      onClick={() => {
                        signOut();
                        setOpen(false);
                      }}
                      className="flex-1 border border-ink/20 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.16em]"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="flex-1 border border-ink/20 px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.16em]"
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/login?mode=register"
                      onClick={() => setOpen(false)}
                      className="flex-1 bg-wine px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-paper"
                    >
                      Register
                    </NavLink>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
