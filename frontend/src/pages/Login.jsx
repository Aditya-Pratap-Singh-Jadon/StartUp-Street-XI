import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { inputCls, labelCls, FieldError } from "../components/ui";
import Background from "../components/Background";
import { validateGoogleCredential } from "../utils/authConstraints";

const HOSTELS = [
  "MH-A",
  "MH-B",
  "MH-BX",
  "MH-C",
  "MH-D",
  "MH-DX",
  "MH-E",
  "MH-F",
  "MH-G",
  "MH-H",
  "MH-J",
  "MH-JX",
  "MH-K",
  "MH-L",
  "MH-M",
  "MH-MX",
  "MH-N",
  "MH-NX",
  "MH-P",
  "MH-Q",
  "MH-R",
  "MH-T",
  "LH-A",
  "LH-B",
  "LH-C",
  "LH-D",
  "LH-E",
  "LH-EX",
  "LH-F",
  "LH-G",
  "LH-GX",
  "LH-H",
  "LH-J",
  "LH-S",
];

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    isSuperadmin,
    loading,
    login,
    register,
    verifyOtp,
    googleLogin,
  } = useAuth();
  const [mode, setMode] = useState(
    params.get("mode") === "register" ? "register" : "login",
  );
  const [participantType, setParticipantType] = useState("vit_student");
  const [otpMode, setOtpMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [block, setBlock] = useState("A");
  const [room, setRoom] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const next = params.get("next") || "";

  useEffect(() => {
    if (!loading && user) {
      if (next) navigate(next, { replace: true });
      else
        navigate(isAdmin || isSuperadmin ? "/admin" : "/dashboard", {
          replace: true,
        });
    }
  }, [user, loading, isAdmin, isSuperadmin, navigate, next]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    const cleanEmail = email.trim().toLowerCase();

    if (otpMode) {
      if (otp.length !== 6) return setErr("Please enter the 6-digit OTP.");
      setBusy(true);
      try {
        await verifyOtp({
          email: cleanEmail,
          otp,
          password,
          name: name.trim(),
          participant_type: participantType,
          reg_no: participantType === "vit_student" ? regNo.trim() : "",
          block: participantType === "vit_student" ? block : "",
          room: participantType === "vit_student" ? room.trim() : "",
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Invalid OTP. Try again.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return setErr("Enter a valid email address.");
    if (password.length < 6)
      return setErr("Password must be at least 6 characters.");

    if (
      participantType === "vit_student" &&
      !cleanEmail.endsWith("@vitstudent.ac.in")
    ) {
      return setErr(
        "VIT Students must use their @vitstudent.ac.in email address.",
      );
    }

    if (mode === "register") {
      if (name.trim().length < 2) return setErr("Please enter your full name.");
      if (participantType === "vit_student") {
        if (regNo.trim().length < 8)
          return setErr("Please enter a valid Registration Number.");
        if (!room.trim() || !/^(G|[0-9]+)$/i.test(room.trim()))
          return setErr('Room number can only be numbers or "G".');
      }
    }

    setBusy(true);
    try {
      if (mode === "register") {
        await register({
          email: cleanEmail,
          participant_type: participantType,
        });
        setOtpMode(true);
      } else {
        await login(cleanEmail, password);
      }
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Authentication failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErr(null);
    if (!validateGoogleCredential(credentialResponse.credential)) {
      return setErr(
        "Google Login is restricted to @vitstudent.ac.in email addresses.",
      );
    }
    setBusy(true);
    try {
      await googleLogin(credentialResponse.credential, participantType);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Google Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen isolate overflow-hidden bg-black text-white">
      <Background />
      <div className="relative z-10 grid min-h-screen lg:grid-cols-2 bg-black/40 backdrop-blur-sm">
        <div className="relative hidden flex-col justify-between border-r border-white/10 p-10 lg:flex">
          <Link to="/" className="flex items-baseline gap-2.5">
            <span className="bg-white px-2 py-1 font-display text-sm font-bold text-black">
              SS—XI
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/60">
              Startup Street
            </span>
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
              The Shark Tank of VIT
            </p>
            <p className="font-display mt-4 text-5xl leading-[1.02] font-medium xl:text-6xl">
              One idea.
              <br />
              One venture.
              <br />
              <span className="text-cyan-300 italic">24 hours.</span>
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Register to form your team, receive your Team Code, track the live
              schedule and submit your final pitch.
            </p>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
            CSED · VIT Vellore · graVITas 2026
          </p>
        </div>
        <div className="flex items-center justify-center px-4 py-16 sm:px-10">
          <div className="w-full max-w-md border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/55 hover:text-cyan-300"
            >
              <ArrowLeft size={14} /> Back to site
            </Link>
            <h1 className="font-display mt-6 text-4xl font-medium tracking-tight sm:text-5xl">
              {participantType === "vit_student"
                ? "Join the street."
                : mode === "register"
                  ? "Join the street."
                  : "Welcome back."}
            </h1>
            <p className="mt-2 text-sm text-white/60 mb-6">
              {participantType === "vit_student"
                ? "Sign in with your VIT student account to access the dashboard."
                : mode === "register"
                  ? "Create your participant account to form or join a team."
                  : "Sign in to access your team dashboard."}
            </p>

            {!otpMode && (
              <div className="mb-6 grid grid-cols-2 gap-2 p-1 border border-white/15 bg-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setParticipantType("vit_student");
                    setErr(null);
                  }}
                  className={`py-2 text-xs font-bold uppercase tracking-[0.1em] transition ${participantType === "vit_student" ? "bg-cyan-900/50 border border-cyan-400/30 text-white" : "text-white/60 hover:text-white"}`}
                >
                  VIT Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setParticipantType("external");
                    setErr(null);
                  }}
                  className={`py-2 text-xs font-bold uppercase tracking-[0.1em] transition ${participantType === "external" ? "bg-cyan-900/50 border border-cyan-400/30 text-white" : "text-white/60 hover:text-white"}`}
                >
                  External
                </button>
              </div>
            )}

            {!otpMode && participantType === "external" && (
              <div className="grid grid-cols-2 border border-white/15 p-1 text-center text-[12px] font-bold uppercase tracking-[0.16em]">
                {["login", "register"].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setErr(null);
                      setOtpMode(false);
                    }}
                    className={`py-2.5 transition ${mode === m ? "bg-white text-black" : "text-white/55 hover:text-white"}`}
                  >
                    {m === "login" ? "Login" : "Register"}
                  </button>
                ))}
              </div>
            )}

            {participantType === "external" ? (
              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                {otpMode ? (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-white/90">
                      We sent a 6-digit verification code to{" "}
                      <span className="font-bold text-white">{email}</span>.
                      Please enter it below.
                    </p>
                    <div>
                      <label htmlFor="otp" className={labelCls}>
                        Verification Code (OTP)
                      </label>
                      <input
                        id="otp"
                        type="text"
                        maxLength={6}
                        className={`${inputCls} text-center tracking-[0.5em] font-bold text-xl`}
                        placeholder="123456"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        autoComplete="one-time-code"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {mode === "register" && (
                      <div>
                        <label htmlFor="name" className={labelCls}>
                          Full name
                        </label>
                        <input
                          id="name"
                          className={inputCls}
                          placeholder="Aarav Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                        />
                      </div>
                    )}
                    {mode === "register" &&
                      participantType === "vit_student" && (
                        <>
                          <div>
                            <label htmlFor="regNo" className={labelCls}>
                              Registration Number
                            </label>
                            <input
                              id="regNo"
                              className={inputCls}
                              placeholder="22BCE0001"
                              value={regNo}
                              onChange={(e) =>
                                setRegNo(e.target.value.toUpperCase())
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="block" className={labelCls}>
                                Hostel
                              </label>
                              <div className="relative">
                                <select
                                  id="block"
                                  className={`${inputCls} appearance-none cursor-pointer`}
                                  value={block}
                                  onChange={(e) => setBlock(e.target.value)}
                                >
                                  {HOSTELS.map((h) => (
                                    <option
                                      key={h}
                                      value={h}
                                      className="bg-black text-white"
                                    >
                                      {h}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label htmlFor="room" className={labelCls}>
                                Room Number
                              </label>
                              <input
                                id="room"
                                className={inputCls}
                                placeholder="G or 101"
                                value={room}
                                onChange={(e) =>
                                  setRoom(e.target.value.toUpperCase())
                                }
                              />
                            </div>
                          </div>
                        </>
                      )}
                    <div>
                      <label htmlFor="email" className={labelCls}>
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={inputCls}
                        placeholder={
                          participantType === "vit_student"
                            ? "you@vitstudent.ac.in"
                            : "you@example.com"
                        }
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className={labelCls}>
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        className={inputCls}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={
                          mode === "register"
                            ? "new-password"
                            : "current-password"
                        }
                      />
                    </div>
                  </>
                )}

                <FieldError message={err} />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3.5 text-sm font-semibold tracking-wide text-black transition hover:bg-cyan-100 disabled:opacity-60"
                >
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  {otpMode
                    ? "Verify & Create Account"
                    : mode === "register"
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>
            ) : (
              <div className="mt-6">
                <FieldError message={err} />
              </div>
            )}

            {!otpMode && participantType === "vit_student" && (
              <div className="mt-6">
                <div className="flex justify-center w-full [&>div]:invert-[0.9] [&>div]:hue-rotate-[180deg]">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setErr("Google Login Failed")}
                    useOneTap
                    theme="outline"
                    size="large"
                    width="100%"
                    text="continue_with"
                    hosted_domain="vitstudent.ac.in"
                  />
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-[11px] leading-relaxed tracking-wide text-white/40 uppercase">
              Startup Street XI · CSED, VIT Vellore · graVITas 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
