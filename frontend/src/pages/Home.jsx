import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Background from "../components/Background";
import { useAuth } from "../contexts/AuthContext";

const timeline = [
    {
        number: "06",
        title: "THE PITCH",
        text: "24 hours are over. Now make them believe.",
    },
    {
        number: "05",
        title: "REFINEMENT",
        text: "Break it. Fix it. Build it better.",
    },
    {
        number: "04",
        title: "MENTORSHIP",
        text: "You don't build alone.",
    },
    {
        number: "03",
        title: "STRATEGY",
        text: "Turn the idea into a business that makes sense.",
    },
    {
        number: "02",
        title: "VALIDATION",
        text: "Find the signal. Prove someone needs it.",
    },
    {
        number: "01",
        title: "IDEATION",
        text: "Ask the question nobody else is asking.",
    },
];

export default function Home() {
    const { user } = useAuth();
    const [accessMode, setAccessMode] = useState("register");

    useEffect(() => {
        // Use a timeout to ensure layout has settled before scrolling to bottom
        const timer = setTimeout(() => {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "instant",
            });
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleAnchorClick = (event, id) => {
        event.preventDefault();
        scrollToSection(id);
    };

    return (
        <main className="relative isolate overflow-hidden text-white">

            <Background />

            <div className="relative z-10 text-white">

                <header className="fixed left-0 right-0 top-0 z-50">

                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">

                        {/* LOGO */}

                        <button
                            onClick={(e) =>
                                handleAnchorClick(
                                    e,
                                    "foundation"
                                )
                            }
                            className="flex items-center gap-3"
                        >

                            <div className="text-left flex">
                                <div className="mt-4 flex items-center gap-3 ">
                                    <img src="/logo.png" alt="Logo" className="h-15 w-65" />
                                </div>
                            </div>
                        </button>


                        {/* DESKTOP NAV */}

                        <nav className="hidden items-center gap-8 rounded-full border border-white/10 bg-black/25 px-6 py-3 backdrop-blur-xl md:flex">

                            <button
                                onClick={(e) =>
                                    handleAnchorClick(
                                        e,
                                        "about"
                                    )
                                }
                                className="text-xs tracking-[0.15em] text-white/50 transition duration-300 hover:text-white"
                            >
                                ABOUT
                            </button>

                            <button
                                onClick={(e) =>
                                    handleAnchorClick(
                                        e,
                                        "journey"
                                    )
                                }
                                className="text-xs tracking-[0.15em] text-white/50 transition duration-300 hover:text-white"
                            >
                                JOURNEY
                            </button>

                            {user ? (
                                <Link
                                    to="/dashboard"
                                    className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold tracking-[0.12em] text-black transition duration-300 hover:bg-cyan-100"
                                >
                                    DASHBOARD
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-xs tracking-[0.15em] text-white/50 transition duration-300 hover:text-white"
                                    >
                                        LOGIN
                                    </Link>

                                    <Link
                                        to="/login?mode=register"
                                        className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold tracking-[0.12em] text-black transition duration-300 hover:bg-cyan-100"
                                    >
                                        REGISTER
                                    </Link>
                                </>
                            )}

                        </nav>


                        {/* MOBILE NAV */}

                        <div className="flex items-center gap-2 md:hidden">
                            {user ? (
                                <Link
                                    to="/dashboard"
                                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
                                >
                                    DASHBOARD
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/70 backdrop-blur-xl"
                                    >
                                        LOGIN
                                    </Link>

                                    <Link
                                        to="/login?mode=register"
                                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
                                    >
                                        JOIN
                                    </Link>
                                </>
                            )}
                        </div>

                    </div>
                </header>

                <section
                    id="city"
                    className="relative flex min-h-screen items-center"
                >

                    <div className="mx-auto w-full max-w-7xl px-6 py-32 lg:px-10">

                        <div className="max-w-5xl">
                            {/*
                            <p className="mb-8 text-[10px] tracking-[0.4em] text-cyan-200/70">
                                THE CITY IS BUILT
                            </p>
                            */}

                            <h1 className="text-[clamp(4.5rem,12vw,11rem)] font-semibold leading-[0.78] tracking-[-0.08em]">
                                STARTUP
                                <br />

                                <span className="text-white/70">
                                    STREET
                                </span>

                                <span className="text-cyan-200/70">
                                    XI
                                </span>
                            </h1>

                            <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

                                <p className="max-w-xl text-xl leading-relaxed text-white/55 md:text-2xl">
                                    You built the city.
                                    <br />

                                    <span className="text-white">
                                        Now step into it.
                                    </span>
                                </p>

                                <Link
                                    to="/login?mode=register"
                                    className="group flex w-fit items-center gap-5 rounded-full border border-white/15 bg-white/5 px-6 py-4 backdrop-blur-xl transition duration-300 hover:border-cyan-200/30 hover:bg-white/9"
                                >
                                    <span className="text-sm font-medium">
                                        ENTER THE STREET
                                    </span>

                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:translate-x-1">
                                        →
                                    </span>
                                </Link>

                            </div>

                        </div>

                    </div>
                </section>

                <section
                    id="about"
                    className="relative min-h-screen border-t border-white/6"
                >

                    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-32 lg:px-10">

                        <div className="grid w-full gap-20 lg:grid-cols-[0.8fr_1.2fr]">

                            <div>

                                <h2 className="text-6xl font-medium leading-[0.85] tracking-[-0.06em] md:text-8xl">
                                    IDEAS
                                    <br />

                                    <span className="text-white/30">
                                        BECOME
                                    </span>

                                    <br />

                                    REAL.
                                </h2>

                            </div>


                            <div className="flex flex-col justify-end">

                                <p className="max-w-3xl text-3xl leading-[1.15] tracking-[-0.04em] text-white/80 md:text-5xl">
                                    Startup Street is a 24-hour journey from a raw problem to a venture worth believing in.
                                </p>

                                <p className="mt-8 max-w-2xl text-sm leading-7 text-white/40 md:text-base">
                                    Presented by CSED, Startup Street brings together entrepreneurial thinking, mentorship, validation, strategy and pitching into one intense experience.
                                </p>


                                <div className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">

                                    <div className="bg-[#070d19]/80 p-5">
                                        <p className="text-3xl font-medium">
                                            24
                                        </p>

                                        <p className="mt-2 text-[9px] tracking-[0.2em] text-white/30">
                                            HOURS
                                        </p>
                                    </div>

                                    <div className="bg-[#070d19]/80 p-5">
                                        <p className="text-3xl font-medium">
                                            06
                                        </p>

                                        <p className="mt-2 text-[9px] tracking-[0.2em] text-white/30">
                                            STAGES
                                        </p>
                                    </div>

                                    <div className="bg-[#070d19]/80 p-5">
                                        <p className="text-3xl font-medium">
                                            01
                                        </p>

                                        <p className="mt-2 text-[9px] tracking-[0.2em] text-white/30">
                                            IDEA
                                        </p>
                                    </div>

                                    <div className="bg-[#070d19]/80 p-5">
                                        <p className="text-3xl font-medium">
                                            ∞
                                        </p>

                                        <p className="mt-2 text-[9px] tracking-[0.2em] text-white/30">
                                            POSSIBILITIES
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>
                    </div>
                </section>

                <section
                    id="journey"
                    className="relative border-t border-white/6"
                >

                    <div className="mx-auto max-w-7xl px-6 py-32 lg:px-10">

                        <div className="mb-28 flex flex-col justify-between gap-8 md:flex-row md:items-end">

                            <div>

                                <h2 className="text-6xl font-medium leading-[0.85] tracking-[-0.06em] md:text-8xl">
                                    BUILD
                                    <br />

                                    <span className="text-white/30">
                                        UPWARD.
                                    </span>
                                </h2>

                            </div>

                            <p className="max-w-sm text-sm leading-6 text-white/35">
                                Six stages.
                                <br />
                                One night.
                                <br />
                                One venture taking shape.
                            </p>

                        </div>


                        <div className="relative">

                            <div className="absolute bottom-0 left-5 top-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2" />

                            <div className="space-y-24">

                                {timeline.map((item, index) => (

                                    <div
                                        key={item.number}
                                        className="relative grid min-h-45 items-center md:grid-cols-2"
                                    >

                                        <div
                                            className={`pl-16 md:pl-0 ${index % 2 === 0
                                                ? "md:pr-28 md:text-right"
                                                : "md:col-start-2 md:pl-28"
                                                }`}
                                        >

                                            <h3 className="mt-3 text-4xl font-medium tracking-tighter md:text-6xl">
                                                {item.title}
                                            </h3>

                                            <p className="mt-5 max-w-sm text-sm leading-6 text-white/35 md:ml-auto">
                                                {item.text}
                                            </p>

                                        </div>


                                        <div className="absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#050a14] md:left-1/2 md:-translate-x-1/2">

                                            <div className="h-2 w-2 rounded-full bg-cyan-200/70 shadow-[0_0_18px_rgba(56,217,255,.45)]" />

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>
                    </div>
                </section>

                <section
                    id="foundation"
                    className="relative flex min-h-screen items-center border-t border-white/6"
                >

                    <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">

                        <div className="max-w-5xl">

                            <h2 className="text-[clamp(4rem,10vw,9rem)] font-semibold leading-[0.8] tracking-[-0.075em]">
                                EVERYTHING
                                <br />

                                <span className="text-white/35">
                                    STARTS
                                </span>

                                <br />

                                SOMEWHERE.
                            </h2>


                            <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

                                <div>

                                    <p className="text-xl text-white/50 md:text-2xl">
                                        Start with a problem.
                                    </p>

                                    <p className="mt-2 text-sm text-white/25">
                                        Not an idea.
                                    </p>

                                </div>


                                <div className="flex flex-col items-start gap-4">

                                    <Link
                                        to="/login?mode=register"
                                        className="group flex items-center gap-5 rounded-full bg-white px-7 py-4 text-sm font-semibold text-black transition duration-300 hover:bg-cyan-100"
                                    >
                                        START BUILDING

                                        <span className="transition-transform duration-300 group-hover:-translate-y-1">
                                            ↑
                                        </span>
                                    </Link>

                                    <span className="text-[9px] tracking-[0.3em] text-white/25">
                                        SCROLL UP TO BUILD THE CITY
                                    </span>

                                </div>

                            </div>

                        </div>
                        <div className="text-center text-sm text-white/25">
                            Copyright © {new Date().getFullYear()} CSED, VIT. All rights reserved.
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}
