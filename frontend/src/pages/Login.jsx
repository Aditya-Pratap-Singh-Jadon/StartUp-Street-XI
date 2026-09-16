import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, ArrowUpRight } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { inputCls, labelCls, FieldError } from "../components/ui";
import Background from "../components/Background";
import { validateGoogleCredential } from "../utils/authConstraints";

const HOSTELS = [
  "MH-A", "MH-B", "MH-BX", "MH-C", "MH-D", "MH-DX",
  "MH-E", "MH-F", "MH-G", "MH-H", "MH-J", "MH-JX",
  "MH-K", "MH-L", "MH-M", "MH-MX", "MH-N", "MH-NX",
  "MH-P", "MH-Q", "MH-R", "MH-T",
  "LH-A", "LH-B", "LH-C", "LH-D", "LH-E", "LH-EX",
  "LH-F", "LH-G", "LH-GX", "LH-H", "LH-J", "LH-S",
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
    params.get("mode") === "register"
      ? "register"
      : "login"
  );

  const [participantType, setParticipantType] =
    useState("vit_student");

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
      if (next) {
        navigate(next, { replace: true });
      } else {
        navigate(
          isAdmin || isSuperadmin
            ? "/admin"
            : "/dashboard",
          { replace: true }
        );
      }
    }
  }, [
    user,
    loading,
    isAdmin,
    isSuperadmin,
    navigate,
    next,
  ]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);

    const cleanEmail =
      email.trim().toLowerCase();

    if (otpMode) {
      if (otp.length !== 6) {
        return setErr(
          "Please enter the 6-digit OTP."
        );
      }

      setBusy(true);

      try {
        await verifyOtp({
          email: cleanEmail,
          otp,
          password,
          name: name.trim(),
          participant_type: participantType,
          reg_no:
            participantType === "vit_student"
              ? regNo.trim()
              : "",
          block:
            participantType === "vit_student"
              ? block
              : "",
          room:
            participantType === "vit_student"
              ? room.trim()
              : "",
        });
      } catch (e) {
        setErr(
          e instanceof Error
            ? e.message
            : "Invalid OTP. Try again."
        );
      } finally {
        setBusy(false);
      }

      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      return setErr(
        "Enter a valid email address."
      );
    }

    if (password.length < 6) {
      return setErr(
        "Password must be at least 6 characters."
      );
    }

    if (
      participantType === "vit_student" &&
      !cleanEmail.endsWith(
        "@vitstudent.ac.in"
      )
    ) {
      return setErr(
        "VIT Students must use their @vitstudent.ac.in email address."
      );
    }

    if (mode === "register") {
      if (name.trim().length < 2) {
        return setErr(
          "Please enter your full name."
        );
      }

      if (
        participantType === "vit_student"
      ) {
        if (regNo.trim().length < 8) {
          return setErr(
            "Please enter a valid Registration Number."
          );
        }

        if (
          !room.trim() ||
          !/^(G|[0-9]+)$/i.test(
            room.trim()
          )
        ) {
          return setErr(
            'Room number can only be numbers or "G".'
          );
        }
      }
    }

    setBusy(true);

    try {
      if (mode === "register") {
        await register({
          email: cleanEmail,
          participant_type:
            participantType,
        });

        setOtpMode(true);
      } else {
        await login(
          cleanEmail,
          password
        );
      }
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

  const handleGoogleSuccess =
    async (credentialResponse) => {
      setErr(null);

      if (
        !validateGoogleCredential(
          credentialResponse.credential
        )
      ) {
        return setErr(
          "Google Login is restricted to @vitstudent.ac.in email addresses."
        );
      }

      setBusy(true);

      try {
        await googleLogin(
          credentialResponse.credential,
          participantType
        );
      } catch (e) {
        setErr(
          e instanceof Error
            ? e.message
            : "Google Authentication failed."
        );
      } finally {
        setBusy(false);
      }
    };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#030711] text-white">

      {/* BACKGROUND */}

      <Background />

      {/* DARK OVERLAY */}

      <div className="absolute inset-0 z-1 bg-[#030711]/35" />

      {/* CONTENT */}

      <div className="relative z-10 h-full">

        {/* MAIN */}

        <div className="flex h-full items-center justify-center px-5 pt-16">

          <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_480px] lg:gap-20">

            {/* LEFT SIDE */}

            <div className="hidden lg:block">

              <div className="max-w-xl">

                <p className="text-[10px] tracking-[0.35em] text-white/25">
                  24 HOURS | ONE VENTURE
                </p>

                <h1 className="mt-5 text-7xl font-semibold leading-[0.82] tracking-[-0.07em] xl:text-8xl">

                  JOIN
                  <br />

                  THE
                  <br />

                  <span className="text-white/35">
                    STREET.
                  </span>

                </h1>

                <p className="mt-8 max-w-md text-sm leading-7 text-white/45">
                  Your idea starts here. Build your team,
                  enter the challenge and turn a problem
                  into something real.
                </p>


                {/* SMALL META */}

                <div className="mt-10 flex items-center gap-8">

                  <div>
                    <p className="text-2xl font-medium">
                      24
                    </p>

                    <p className="mt-1 text-[9px] tracking-[0.25em] text-white/25">
                      HOURS
                    </p>
                  </div>

                  <div className="h-8 w-px bg-white/10" />

                  <div>
                    <p className="text-2xl font-medium">
                      XI
                    </p>

                    <p className="mt-1 text-[9px] tracking-[0.25em] text-white/25">
                      EDITIONS
                    </p>
                  </div>

                  <div className="h-8 w-px bg-white/10" />

                  <div>
                    <p className="text-2xl font-medium">
                      CSED
                    </p>

                    <p className="mt-1 text-[9px] tracking-[0.25em] text-white/25">
                      ORGANIZED BY
                    </p>
                  </div>

                </div>

              </div>

            </div>


            {/* AUTH CARD */}

            <div className="w-full">

              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#050b16]/75 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">

                {/* CARD GLOW */}

                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/[0.07] blur-3xl" />

                <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-violet-500/[0.05] blur-3xl" />


                {/* BACK */}

                <Link
                  to="/"
                  className="relative inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-white/35 transition duration-300 hover:text-white"
                >
                  <ArrowLeft size={13} />
                  BACK
                </Link>


                {/* HEADING */}

                <div className="relative mt-7">

                  <p className="text-[9px] tracking-[0.3em] text-cyan-200/45">
                    {otpMode
                      ? "VERIFICATION"
                      : participantType ===
                        "vit_student"
                        ? "VIT STUDENT"
                        : "EXTERNAL PARTICIPANT"}
                  </p>

                  <h2 className="mt-3 text-4xl font-medium tracking-[-0.05em] sm:text-5xl">
                    {otpMode
                      ? "Verify."
                      : participantType ===
                        "vit_student"
                        ? "Join the street."
                        : mode === "register"
                          ? "Join the street."
                          : "Welcome back."}
                  </h2>

                  <p className="mt-3 max-w-sm text-xs leading-6 text-white/35">
                    {otpMode
                      ? "Enter the verification code sent to your email."
                      : participantType ===
                        "vit_student"
                        ? "Sign in with your VIT student account."
                        : mode === "register"
                          ? "Create your participant account."
                          : "Sign in to access your team dashboard."}
                  </p>

                </div>


                {/* PARTICIPANT TYPE */}

                {!otpMode && (
                  <div className="relative mt-7 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1">

                    <button
                      type="button"
                      onClick={() => {
                        setParticipantType(
                          "vit_student"
                        );
                        setErr(null);
                      }}
                      className={`rounded-lg py-2.5 text-[10px] font-semibold tracking-[0.16em] transition-all duration-300 ${participantType ===
                          "vit_student"
                          ? "bg-white text-black shadow-lg"
                          : "text-white/35 hover:text-white"
                        }`}
                    >
                      VIT STUDENT
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setParticipantType(
                          "external"
                        );
                        setErr(null);
                      }}
                      className={`rounded-lg py-2.5 text-[10px] font-semibold tracking-[0.16em] transition-all duration-300 ${participantType ===
                          "external"
                          ? "bg-white text-black shadow-lg"
                          : "text-white/35 hover:text-white"
                        }`}
                    >
                      EXTERNAL
                    </button>

                  </div>
                )}


                {/* LOGIN / REGISTER */}

                {!otpMode &&
                  participantType ===
                  "external" && (
                    <div className="relative mt-3 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.025] p-1">

                      {["login", "register"].map(
                        (m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setMode(m);
                              setErr(null);
                              setOtpMode(false);
                            }}
                            className={`rounded-lg py-2.5 text-[10px] font-semibold tracking-[0.16em] transition-all duration-300 ${mode === m
                                ? "bg-white text-black"
                                : "text-white/35 hover:text-white"
                              }`}
                          >
                            {m === "login"
                              ? "LOGIN"
                              : "REGISTER"}
                          </button>
                        )
                      )}

                    </div>
                  )}


                {/* FORM */}

                {participantType ===
                  "external" ? (
                  <form
                    onSubmit={submit}
                    className="relative mt-5 space-y-3.5"
                    noValidate
                  >

                    {otpMode ? (
                      <div className="space-y-4">

                        <p className="text-xs leading-6 text-white/45">
                          We sent a 6-digit
                          verification code to{" "}
                          <span className="text-white">
                            {email}
                          </span>
                          .
                        </p>

                        <div>
                          <label
                            htmlFor="otp"
                            className={labelCls}
                          >
                            VERIFICATION CODE
                          </label>

                          <input
                            id="otp"
                            type="text"
                            maxLength={6}
                            className={`${inputCls} text-center text-xl font-bold tracking-[0.5em]`}
                            placeholder="123456"
                            value={otp}
                            onChange={(e) =>
                              setOtp(
                                e.target.value.replace(
                                  /\D/g,
                                  ""
                                )
                              )
                            }
                            autoComplete="one-time-code"
                          />
                        </div>

                      </div>
                    ) : (
                      <>

                        {mode ===
                          "register" && (
                            <div>
                              <label
                                htmlFor="name"
                                className={labelCls}
                              >
                                FULL NAME
                              </label>

                              <input
                                id="name"
                                className={inputCls}
                                placeholder="Your Name"
                                value={name}
                                onChange={(e) =>
                                  setName(
                                    e.target.value
                                  )
                                }
                                autoComplete="name"
                              />
                            </div>
                          )}


                        {mode ===
                          "register" &&
                          participantType ===
                          "vit_student" && (
                            <>
                              <div>
                                <label
                                  htmlFor="regNo"
                                  className={
                                    labelCls
                                  }
                                >
                                  REGISTRATION NUMBER
                                </label>

                                <input
                                  id="regNo"
                                  className={
                                    inputCls
                                  }
                                  placeholder="22XYZ0001"
                                  value={regNo}
                                  onChange={(e) =>
                                    setRegNo(
                                      e.target.value.toUpperCase()
                                    )
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">

                                <div>
                                  <label
                                    htmlFor="block"
                                    className={
                                      labelCls
                                    }
                                  >
                                    HOSTEL
                                  </label>

                                  <select
                                    id="block"
                                    className={`${inputCls} cursor-pointer appearance-none`}
                                    value={block}
                                    onChange={(e) =>
                                      setBlock(
                                        e.target.value
                                      )
                                    }
                                  >
                                    {HOSTELS.map(
                                      (h) => (
                                        <option
                                          key={h}
                                          value={h}
                                          className="bg-[#07101c] text-white"
                                        >
                                          {h}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </div>

                                <div>
                                  <label
                                    htmlFor="room"
                                    className={
                                      labelCls
                                    }
                                  >
                                    ROOM
                                  </label>

                                  <input
                                    id="room"
                                    className={
                                      inputCls
                                    }
                                    placeholder="G or 101"
                                    value={room}
                                    onChange={(e) =>
                                      setRoom(
                                        e.target.value.toUpperCase()
                                      )
                                    }
                                  />
                                </div>

                              </div>
                            </>
                          )}


                        <div>
                          <label
                            htmlFor="email"
                            className={labelCls}
                          >
                            EMAIL
                          </label>

                          <input
                            id="email"
                            type="email"
                            className={inputCls}
                            placeholder={
                              participantType ===
                                "vit_student"
                                ? "you@vitstudent.ac.in"
                                : "you@example.com"
                            }
                            value={email}
                            onChange={(e) =>
                              setEmail(
                                e.target.value
                              )
                            }
                            autoComplete="email"
                          />
                        </div>


                        <div>
                          <label
                            htmlFor="password"
                            className={labelCls}
                          >
                            PASSWORD
                          </label>

                          <input
                            id="password"
                            type="password"
                            className={inputCls}
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) =>
                              setPassword(
                                e.target.value
                              )
                            }
                            autoComplete={
                              mode ===
                                "register"
                                ? "new-password"
                                : "current-password"
                            }
                          />
                        </div>

                      </>
                    )}


                    <FieldError
                      message={err}
                    />


                    <button
                      type="submit"
                      disabled={busy}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-semibold tracking-[0.12em] text-black transition-all duration-300 hover:bg-cyan-100 hover:shadow-[0_0_30px_rgba(103,211,255,.12)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy && (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      )}

                      {otpMode
                        ? "VERIFY & CREATE ACCOUNT"
                        : mode === "register"
                          ? "CREATE ACCOUNT"
                          : "SIGN IN"}

                      {!busy && (
                        <ArrowUpRight
                          size={14}
                          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      )}
                    </button>

                  </form>
                ) : (
                  <div className="relative mt-5">
                    <FieldError
                      message={err}
                    />
                  </div>
                )}


                {/* GOOGLE */}

                {!otpMode &&
                  participantType ===
                  "vit_student" && (
                    <div className="relative mt-5">

                      <div className="mb-4 flex items-center gap-3">

                        <div className="h-px flex-1 bg-white/[0.08]" />

                        <span className="text-[8px] tracking-[0.25em] text-white/20">
                          GOOGLE SIGN IN
                        </span>

                        <div className="h-px flex-1 bg-white/[0.08]" />

                      </div>

                      <div className="flex w-full justify-center [&>div]:!w-full [&>div]:!max-w-none [&>div]:invert-[0.9] [&>div]:hue-rotate-[180deg]">
                        <GoogleLogin
                          onSuccess={
                            handleGoogleSuccess
                          }
                          onError={() =>
                            setErr(
                              "Google Login Failed"
                            )
                          }
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


                {/* FOOTER */}

                <div className="relative mt-6 border-t border-white/[0.06] pt-5 text-center">

                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}