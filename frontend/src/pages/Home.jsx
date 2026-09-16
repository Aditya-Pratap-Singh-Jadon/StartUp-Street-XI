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
                                        "tracks"
                                    )
                                }
                                className="text-xs tracking-[0.15em] text-white/50 transition duration-300 hover:text-white"
                            >
                                TRACKS
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

                            <button
                                onClick={(e) =>
                                    handleAnchorClick(
                                        e,
                                        "startup-street"
                                    )
                                }
                                className="text-xs tracking-[0.15em] text-white/50 transition duration-300 hover:text-white"
                            >
                                ABOUT
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
                    id="roles"
                    className="relative border-t border-white/6"
                >
                    <div className="mx-auto max-w-7xl px-6 py-32 lg:px-10">
                        <div className="mb-14 max-w-4xl">
                            <p className="text-[25px] tracking-[0.35em] text-cyan-200/70">
                                ROLES
                            </p>
                            <h2 className="mt-6 text-5xl font-medium leading-[0.9] tracking-[-0.06em] md:text-7xl">
                                HOW
                                <span className="text-white/30"> TEAMS MOVE</span>
                            </h2>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                            {[
                                {
                                    title: "Product & Innovation",
                                    focus: "Problem, idea, product, differentiation",
                                    question: "What are we building, and why?"
                                },
                                {
                                    title: "Technology & Development",
                                    focus: "Technology, prototype, feasibility, development",
                                    question: "How does it work?"
                                },
                                {
                                    title: "Marketing & Growth",
                                    focus: "Customers, branding, acquisition, competition",
                                    question: "Who will buy it, and how do we reach them?"
                                },
                                {
                                    title: "Finance & Business Model",
                                    focus: "Pricing, revenue, costs, margins, funding",
                                    question: "How does it make money?"
                                },
                                {
                                    title: "Operations & Strategy",
                                    focus: "Execution, supply chain, partnerships, scaling",
                                    question: "How do we make it work in the real world?"
                                }
                            ].map((role) => (
                                <div
                                    key={role.title}
                                    className="rounded-[1.5rem] border border-cyan-200/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_60%)] p-5 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.08)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200/40 md:p-6"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-200/10 text-xs font-semibold tracking-[0.2em] text-cyan-100">
                                        {role.title.split(" ")[0].slice(0, 2).toUpperCase()}
                                    </div>

                                    <h3 className="mt-5 text-xl font-medium leading-tight tracking-[-0.04em] text-white">
                                        {role.title}
                                    </h3>

                                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/40">
                                        {role.focus}
                                    </p>

                                    <p className="mt-4 text-sm leading-6 text-white/70">
                                        “{role.question}”
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="tracks"
                    className="relative border-t border-white/6"
                >
                    <div className="mx-auto max-w-7xl px-6 py-32 lg:px-10">
                        <div className="mb-14 max-w-4xl">
                            <p className="text-[25px] tracking-[0.35em] text-cyan-200/70">
                                TRACKS
                            </p>
                            <h2 className="mt-6 text-5xl font-medium leading-[0.9] tracking-[-0.06em] md:text-7xl">
                                WHAT
                                <span className="text-white/30"> YOU CAN BUILD</span>
                            </h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {[
                                {
                                    title: "Responsible Production & Consumption",
                                    sdg: "SDG 12",
                                    text: "Waste reduction, circular economy, sustainable fashion, recycling, supply chains, resource optimization, sustainable products."
                                },
                                {
                                    title: "Healthcare & Wellbeing",
                                    sdg: "SDG 3",
                                    text: "Healthcare accessibility, preventive care, diagnostics, mental wellbeing, health monitoring, medical technology."
                                },
                                {
                                    title: "Zero Hunger & Food Security",
                                    sdg: "SDG 2",
                                    text: "Food wastage, nutrition, agricultural technology, food distribution, farmer support, hunger mapping, affordable food."
                                },
                                {
                                    title: "Open Innovation",
                                    sdg: "SDG 9 / SDG 17",
                                    text: "Open-ended problems, public-good technology, accessibility, infrastructure, education, climate, community solutions."
                                },
                                {
                                    title: "AI for Good",
                                    sdg: "SDG 9 + relevant SDGs",
                                    text: "Generative AI, machine learning, computer vision, automation, AI agents, predictive systems, AI-powered social impact."
                                },
                                {
                                    title: "Finance & Financial Inclusion",
                                    sdg: "SDG 8",
                                    text: "FinTech, financial literacy, fraud detection, personal finance, credit access, digital payments, MSMEs, investment."
                                },
                                {
                                    title: "Climate Action & Resilience",
                                    sdg: "SDG 13",
                                    text: "Build solutions that help communities, businesses and ecosystems adapt to and mitigate climate change."
                                }
                            ].map((track) => (
                                <div
                                    key={track.title}
                                    className="group rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition duration-300 hover:border-cyan-200/30 hover:bg-white/[0.05] md:p-6"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-[8px] tracking-[0.28em] text-cyan-200/70">
                                            {track.sdg}
                                        </p>
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>

                                    <h3 className="mt-5 text-xl font-medium leading-tight tracking-[-0.04em] text-white md:text-[1.6rem]">
                                        {track.title}
                                    </h3>

                                    <p className="mt-3 text-sm leading-6 text-white/60 md:text-[0.95rem]">
                                        {track.text}
                                    </p>
                                </div>
                            ))}
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
                    id="startup-street"
                    className="relative border-t border-white/6"
                >
                    <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
                        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">

                            <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.06)] md:p-10">
                                <h3 className="text-3xl font-medium tracking-[-0.05em] md:text-4xl text-cyan-200/70">
                                    A 24-HOUR RACE FROM PROBLEM TO VENTURE
                                </h3>
                                <p className="mt-6 w-full text-base leading-7 text-white/65 md:text-lg">
                                    Startup Street is a 24-hour flagship entrepreneurship marathon where innovators transform ideas into impactful ventures. Participants brainstorm, validate, strategize, and refine business concepts under expert mentorship before presenting Shark Tank-style pitches. The event fosters innovation, collaboration, networking, and experiential learning, empowering aspiring entrepreneurs to create scalable, real-world solutions.
                                </p>
                            </div>

                            <div className="text-right p-0">
                                <p className="text-[50px] font-semibold leading-[0.78] tracking-[-0.08em]">
                                    STARTUP STREET
                                </p>
                                <h2 className="mt-6 text-5xl font-medium leading-[0.9] tracking-[-0.06em] md:text-7xl">
                                    THE
                                    <span className="text-white/30"> JOURNEY</span>
                                </h2>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    id="csed"
                    className="relative border-t border-white/6"
                >
                    <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
                        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                            <div>
                                <p className="text-[50px] font-semibold leading-[0.78] tracking-[-0.08em]">
                                    CSED
                                </p>
                                <h2 className="mt-6 text-5xl font-medium leading-[0.9] tracking-[-0.06em] md:text-7xl">
                                    THE
                                    <span className="text-white/30"> ECOSYSTEM</span>
                                </h2>
                            </div>

                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.06)] md:p-10">
                                <h3 className="text-3xl font-medium tracking-[-0.05em] md:text-4xl text-cyan-200/70">
                                    CENTRE FOR STUDENT ENTREPRENEURSHIP DEVELOPMENT
                                </h3>
                                <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 md:text-lg">
                                    CSED is the student-driven ecosystem that nurtures entrepreneurship through mentorship, innovation, and action. It gives emerging founders the support, exposure, and confidence to turn curiosity into momentum.
                                </p>
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
