import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import {
  inputCls,
  labelCls,
  FieldError,
} from "../components/ui";
import Background from "../components/Background";

export default function AdminLogin() {
  const navigate = useNavigate();

  const {
    user,
    isAdmin,
    isSuperadmin,
    loading,
    login,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin || isSuperadmin) {
        navigate("/admin", { replace: true });
      } else {
        setErr(
          "Access denied. You do not have admin privileges."
        );
      }
    }
  }, [
    user,
    loading,
    isAdmin,
    isSuperadmin,
    navigate,
  ]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);

    const cleanEmail = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return setErr("Enter a valid email address.");
    }

    if (password.length < 6) {
      return setErr(
        "Password must be at least 6 characters."
      );
    }

    setBusy(true);

    try {
      await login(cleanEmail, password);
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "Authentication failed. Try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#050816] text-white isolate">
      <Background />

      {/* Atmospheric overlay */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_18%_35%,rgba(56,217,255,0.10),transparent_32%),radial-gradient(circle_at_82%_65%,rgba(139,92,246,0.10),transparent_34%)]" />

      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden px-5 py-6 sm:px-8">
        {/* Back */}
        <Link
          to="/"
          className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/35 transition hover:text-cyan-200 sm:left-8 sm:top-8"
        >
          <ArrowLeft size={13} />
          Back to site
        </Link>

        {/* Top event marker */}
        <div className="absolute right-5 top-5 z-20 hidden items-center gap-2 sm:flex sm:right-8 sm:top-8">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(56,217,255,0.8)]" />
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">
            Organizer access
          </span>
        </div>

        <div className="grid w-full max-w-[1080px] items-center gap-10 lg:grid-cols-[1fr_430px] lg:gap-20">
          {/* LEFT */}
          <div className="hidden lg:block">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 overflow-hidden rounded-md border border-white/10 bg-white">
                <span className="flex items-center px-3 font-display text-sm font-black tracking-tight text-[#050816]">
                  STARTUP
                </span>

                <span className="flex items-center bg-[#38D9FF] px-3 font-display text-sm font-black tracking-tight text-[#050816]">
                  XI
                </span>
              </div>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/25">
                  CSED presents
                </p>

                <p className="mt-1 text-[10px] text-white/45">
                  VIT Vellore · graVITas 2026
                </p>
              </div>
            </div>

            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-300/60">
              00 / CONTROL ACCESS
            </p>

            <h1 className="font-display mt-4 max-w-[650px] text-5xl leading-[0.92] tracking-[-0.04em] text-white xl:text-7xl">
              BUILD THE
              <br />
              <span className="text-white/30">
                CITY.
              </span>
            </h1>

            <p className="mt-7 max-w-[500px] text-sm leading-7 text-white/35">
              The organizer console controls the systems
              behind Startup Street XI — participants,
              submissions, timeline, announcements,
              jury and results.
            </p>

            <div className="mt-9 grid max-w-[520px] grid-cols-3 gap-2">
              {[
                ["01", "Teams"],
                ["02", "Submissions"],
                ["03", "Results"],
              ].map(([num, label]) => (
                <div
                  key={num}
                  className="border border-white/[0.07] bg-white/[0.025] px-4 py-4"
                >
                  <p className="font-mono text-[8px] text-cyan-300/55">
                    {num}
                  </p>

                  <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-9 flex items-center gap-3">
              <div className="h-px w-12 bg-cyan-300/30" />

              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/20">
                Restricted organizer environment
              </p>
            </div>
          </div>

          {/* LOGIN CARD */}
          <div className="w-full">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-[#071022]/85 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              {/* Card glow */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl" />

              {/* Header */}
              <div className="relative border-b border-white/[0.07] px-6 py-5 sm:px-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200">
                      <LockKeyhole size={13} />
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/25">
                        Secure gateway
                      </p>

                      <p className="mt-0.5 text-[10px] font-semibold text-white/60">
                        Organizer Login
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/20">
                    AUTH / 01
                  </span>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={submit}
                noValidate
                className="relative px-6 py-7 sm:px-8 sm:py-8"
              >
                <div className="mb-7">
                  <h2 className="font-display text-3xl tracking-tight text-white">
                    Welcome back.
                  </h2>

                  <p className="mt-2 text-[10px] leading-relaxed text-white/30">
                    Sign in to access the Startup Street XI
                    management console.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className={`${labelCls} text-white/40`}
                    >
                      Organizer email
                    </label>

                    <div className="relative mt-2">
                      <Terminal
                        size={13}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20"
                      />

                      <input
                        id="email"
                        type="email"
                        className={`${inputCls} w-full border-white/[0.09] bg-white/[0.025] pl-10 text-white placeholder:text-white/15 focus:border-cyan-300/30 focus:ring-cyan-300/10`}
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className={`${labelCls} text-white/40`}
                      >
                        Password
                      </label>

                      <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/15">
                        Protected
                      </span>
                    </div>

                    <div className="relative mt-2">
                      <LockKeyhole
                        size={13}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20"
                      />

                      <input
                        id="password"
                        type="password"
                        className={`${inputCls} w-full border-white/[0.09] bg-white/[0.025] pl-10 text-white placeholder:text-white/15 focus:border-cyan-300/30 focus:ring-cyan-300/10`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <FieldError message={err} />

                  <button
                    type="submit"
                    disabled={busy}
                    className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-white px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#050816] transition duration-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    {busy ? (
                      <>
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                        Authenticating
                      </>
                    ) : (
                      <>
                        Enter console
                        <ArrowLeft
                          size={13}
                          className="rotate-180 transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>

                {/* Security note */}
                <div className="mt-7 border-t border-white/[0.06] pt-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={13}
                      className="mt-0.5 shrink-0 text-cyan-300/40"
                    />

                    <p className="text-[8px] leading-relaxed text-white/20">
                      This area is restricted to authorized
                      Startup Street XI organizers. Unauthorized
                      access is not permitted.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="mt-5 flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/15">
                STARTUP STREET XI
              </p>

              <p className="text-[7px] uppercase tracking-[0.15em] text-white/15">
                CSED · VIT VELLORE · 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}