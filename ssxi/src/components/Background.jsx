"use client";

import { useEffect, useRef, useState } from "react";

const buildings = [
    // starts almost immediately
    { x: 61, w: 13, h: 76, start: 0.02, depth: "front" },

    // then different areas of the city
    { x: 11, w: 7, h: 42, start: 0.09, depth: "far" },
    { x: 38, w: 13, h: 67, start: 0.15, depth: "front" },
    { x: 85, w: 11, h: 62, start: 0.22, depth: "front" },

    // middle / background buildings
    { x: 30, w: 8, h: 37, start: 0.29, depth: "mid" },
    { x: 75, w: 9, h: 53, start: 0.36, depth: "mid" },
    { x: 2, w: 8, h: 30, start: 0.43, depth: "far" },

    // another tall landmark
    { x: 19, w: 11, h: 54, start: 0.50, depth: "mid" },
    { x: 52, w: 8, h: 47, start: 0.57, depth: "mid" },

    // final edge building
    { x: 95, w: 7, h: 35, start: 0.65, depth: "far" },
];

const windowRows = 18;

function Building({ building, progress }) {
    const buildProgress = Math.max(
        0,
        Math.min(
            1,
            (progress - building.start) /
            0.22
        )
    );

    /*
      IMPORTANT:
  
      The building stays at its actual X position.
  
      It does NOT scale from the center.
  
      Its height grows upward from the ground,
      making it look like floors are physically
      being constructed.
    */

    const currentHeight =
        Math.max(0.015, buildProgress) *
        building.h;

    const floorsBuilt = Math.floor(
        buildProgress * windowRows
    );

    const opacity =
        building.depth === "far"
            ? 0.45
            : building.depth === "mid"
                ? 0.65
                : 0.9;

    return (
        <div
            className="absolute bottom-[20%]"
            style={{
                left: `${building.x}%`,
                width: `${building.w}%`,
                height: `${currentHeight}%`,
                opacity:
                    buildProgress > 0 ? opacity : 0,
            }}
        >
            {/* BUILDING SHADOW */}
            <div className="absolute inset-0 bg-black/30" />

            {/* MAIN STRUCTURE */}
            <div
                className="absolute inset-0 overflow-hidden border-x border-white/[0.06]"
                style={{
                    background:
                        "linear-gradient(90deg, rgba(12,10,18,.98), rgba(35,24,39,.94), rgba(10,9,16,.98))",
                    boxShadow:
                        "inset 12px 0 30px rgba(0,0,0,.45), inset -12px 0 30px rgba(0,0,0,.35)",
                }}
            >
                {/* FLOOR SLABS */}

                {Array.from({
                    length: windowRows,
                }).map((_, floor) => {
                    const floorVisible =
                        floor <= floorsBuilt;

                    if (!floorVisible) return null;

                    const bottom =
                        5 + floor * 5.2;

                    return (
                        <div
                            key={floor}
                            className="absolute left-0 right-0"
                            style={{
                                bottom: `${bottom}%`,
                            }}
                        >
                            {/* concrete slab */}
                            <div className="h-[2px] bg-slate-400/[0.14]" />

                            {/* floor windows */}
                            <div className="mt-2 grid grid-cols-3 gap-[14%] px-[10%]">
                                {[0, 1, 2].map(
                                    (windowIndex) => {
                                        const lit =
                                            (floor * 7 +
                                                windowIndex * 13 +
                                                Math.floor(
                                                    building.x
                                                )) %
                                            6 ===
                                            0;

                                        return (
                                            <div
                                                key={windowIndex}
                                                className="h-2"
                                                style={{
                                                    background: lit
                                                        ? "rgba(255,150,174,.5)"
                                                        : "rgba(110,90,110,.10)",
                                                    boxShadow: lit
                                                        ? "0 0 8px rgba(255,130,160,.18)"
                                                        : "none",
                                                }}
                                            />
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* VERTICAL COLUMNS */}

                {[18, 50, 82].map(
                    (left) => (
                        <div
                            key={left}
                            className="absolute bottom-0 top-0 w-px bg-slate-300/[0.08]"
                            style={{
                                left: `${left}%`,
                            }}
                        />
                    )
                )}

                {/* TOP FLOOR / ACTIVE CONSTRUCTION */}

                {buildProgress < 1 && (
                    <>
                        {/* unfinished floor */}
                        <div className="absolute inset-x-0 top-0 h-[3px] bg-rose-200/40 shadow-[0_0_12px_rgba(251,113,133,.25)]" />

                        {/* vertical rebar */}
                        {[15, 30, 50, 70, 85].map(
                            (left) => (
                                <div
                                    key={left}
                                    className="absolute top-0 h-[8%] w-px bg-slate-300/30"
                                    style={{
                                        left: `${left}%`,
                                    }}
                                />
                            )
                        )}

                        {/* active construction glow */}
                        <div className="absolute -top-1 left-0 right-0 h-5 bg-gradient-to-t from-rose-300/[0.08] to-transparent" />
                    </>
                )}

                {/* ROOFTOP EQUIPMENT WHEN COMPLETE */}

                {buildProgress > 0.92 && (
                    <>
                        <div className="absolute -top-[5%] left-[20%] h-[5%] w-[20%] bg-slate-600/50" />

                        <div className="absolute -top-[4%] right-[18%] h-[4%] w-[12%] bg-slate-600/40" />
                    </>
                )}
            </div>

            {/* BUILDING EDGE LIGHT */}

            <div className="absolute bottom-0 left-0 top-0 w-px bg-white/[0.05]" />

            <div className="absolute bottom-0 right-0 top-0 w-px bg-white/[0.03]" />
        </div>
    );
}

function ConstructionSite({ progress }) {
    /*
      The construction activity itself moves through
      the city as the user builds upward.
    */

    const active =
        Math.max(
            0,
            Math.min(
                1,
                progress / 0.7
            )
        );

    return (
        <div
            className="absolute bottom-[19%] left-0 right-0"
            style={{
                opacity:
                    progress < 0.85
                        ? 1
                        : Math.max(
                            0,
                            1 -
                            (progress - 0.85) *
                            6
                        ),
            }}
        >
            {/* BUILDING BASE / FOUNDATION */}

            <div className="absolute bottom-0 left-1/2 h-3 w-[28vw] -translate-x-1/2 bg-rose-950/30" />

            <div className="absolute bottom-0 left-1/2 h-px w-[34vw] -translate-x-1/2 bg-rose-200/30" />

            {/* ACTIVE BUILD LINE */}

            <div
                className="absolute bottom-0 h-px bg-rose-300/60 shadow-[0_0_15px_rgba(251,113,133,.4)]"
                style={{
                    left: `${10 + active * 75}%`,
                    width: "8%",
                }}
            />

            {/* SMALL CONSTRUCTION CRAN */}

            <div
                className="absolute bottom-0"
                style={{
                    left: `${20 + active * 55}%`,
                }}
            >
                {/* mast */}

                <div className="relative h-[28vh] w-[2px] bg-slate-300/25">
                    {/* horizontal braces */}

                    {Array.from({
                        length: 7,
                    }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute left-1/2 h-px w-5 -translate-x-1/2 bg-slate-300/15"
                            style={{
                                bottom: `${i * 14}%`,
                            }}
                        />
                    ))}

                    {/* crane arm */}

                    <div className="absolute -top-1 left-0 h-px w-[16vw] bg-slate-300/25" />

                    {/* cable */}

                    <div
                        className="absolute -top-1 left-[12vw] h-[13vh] w-px origin-top rotate-[8deg] bg-slate-300/20"
                    />

                    {/* hook */}

                    <div className="absolute left-[13vw] top-[12vh] h-4 w-2 border-b border-x border-slate-300/25" />
                </div>
            </div>
        </div>
    );
}

function Street({ progress }) {
    const visible = Math.min(
        1,
        progress * 2.5
    );

    return (
        <div
            className="absolute bottom-0 left-0 right-0 h-[24%]"
            style={{
                opacity: visible,
            }}
        >
            {/* GROUND */}

            <div className="absolute inset-0 bg-[#10090f]" />

            {/* CITY ROAD */}

            <div className="absolute bottom-0 left-[20%] right-[20%] h-[78%] overflow-hidden bg-[#130b13]">
                <div
                    className="absolute inset-0"
                    style={{
                        clipPath:
                            "polygon(43% 0, 57% 0, 100% 100%, 0 100%)",
                        background:
                            "linear-gradient(90deg, transparent, rgba(200,55,90,.12), transparent)",
                    }}
                />

                {/* road markings */}

                {[15, 35, 55, 75].map(
                    (top) => (
                        <div
                            key={top}
                            className="absolute left-1/2 h-px -translate-x-1/2 bg-white/10"
                            style={{
                                top: `${top}%`,
                                width: `${Math.max(
                                    3,
                                    (100 - top) * 0.06
                                )}%`,
                            }}
                        />
                    )
                )}
            </div>

            {/* SIDE STREETS */}

            <div
                className="absolute bottom-0 left-0 h-full w-[40%]"
                style={{
                    background:
                        "linear-gradient(70deg, transparent 49.5%, rgba(70,130,140,.10) 50%, transparent 50.5%)",
                }}
            />

            <div
                className="absolute bottom-0 right-0 h-full w-[40%]"
                style={{
                    background:
                        "linear-gradient(-70deg, transparent 49.5%, rgba(70,130,140,.10) 50%, transparent 50.5%)",
                }}
            />
        </div>
    );
}

export default function Background() {
    const [progress, setProgress] =
        useState(0);

    const targetProgress =
        useRef(0);

    useEffect(() => {
        const update = () => {
            const maxScroll =
                document.documentElement
                    .scrollHeight -
                window.innerHeight;

            if (maxScroll <= 0) return;

            /*
              BOTTOM = 0
              TOP = 1
            */

            targetProgress.current =
                Math.max(
                    0,
                    Math.min(
                        1,
                        1 -
                        window.scrollY /
                        maxScroll
                    )
                );
        };

        update();

        window.addEventListener(
            "scroll",
            update,
            { passive: true }
        );

        window.addEventListener(
            "resize",
            update
        );

        return () => {
            window.removeEventListener(
                "scroll",
                update
            );

            window.removeEventListener(
                "resize",
                update
            );
        };
    }, []);

    /*
      Smooth interpolation.
      Core scroll animation stays intact.
    */

    useEffect(() => {
        let frame;

        const animate = () => {
            setProgress(
                (current) => {
                    const next =
                        current +
                        (targetProgress.current -
                            current) *
                        0.018;

                    return Math.abs(
                        next -
                        targetProgress.current
                    ) < 0.001
                        ? targetProgress.current
                        : next;
                }
            );

            frame =
                requestAnimationFrame(
                    animate
                );
        };

        frame =
            requestAnimationFrame(
                animate
            );

        return () =>
            cancelAnimationFrame(frame);
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05080e]">

            {/* SKY */}

            <div
                className="absolute inset-0"
                style={{
                    background: `
            radial-gradient(circle at 50% 35%, rgba(55,100,135,.18), transparent 40%),
            radial-gradient(circle at 20% 50%, rgba(130,55,75,.10), transparent 30%),
            radial-gradient(circle at 80% 45%, rgba(45,95,125,.12), transparent 30%),
            linear-gradient(180deg, #05080e 0%, #101e29 60%, #06090e 100%)
          `,
                }}
            />

            {/* SOFT ATMOSPHERE */}

            <div
                className="absolute left-1/2 top-[30%] h-[45%] w-[70%] -translate-x-1/2 rounded-full blur-3xl"
                style={{
                    background:
                        "rgba(50,105,140,.08)",
                }}
            />

            {/* DISTANT CITY */}

            <div
                className="absolute bottom-[20%] left-0 right-0 h-[30%]"
                style={{
                    opacity:
                        0.35 +
                        progress * 0.35,
                }}
            >
                {Array.from({
                    length: 28,
                }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute bottom-0 bg-[#09121b]"
                        style={{
                            left: `${i * 3.8}%`,
                            width: `${2 + (i % 3)}%`,
                            height: `${20 + ((i * 27) % 65)}%`,
                        }}
                    >
                        {Array.from({
                            length: 7,
                        }).map((_, j) => (
                            <div
                                key={j}
                                className="absolute left-[15%] h-[2px] w-[45%]"
                                style={{
                                    bottom: `${12 + j * 12}%`,
                                    background:
                                        j % 5 === 0
                                            ? "rgba(120,180,195,.18)"
                                            : "rgba(100,120,140,.06)",
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* BUILDINGS */}

            {buildings.map(
                (building, i) => (
                    <Building
                        key={i}
                        building={building}
                        progress={progress}
                    />
                )
            )}

            {/* ACTIVE CONSTRUCTION */}

            <ConstructionSite
                progress={progress}
            />

            {/* STREET */}

            <Street
                progress={progress}
            />

            {/* CITY LIGHTS */}

            <div
                className="absolute bottom-[18%] left-0 right-0"
                style={{
                    opacity:
                        Math.max(
                            0,
                            progress
                        ),
                }}
            >
                {[18, 31, 44, 58, 72, 86].map(
                    (left, i) => (
                        <div
                            key={i}
                            className="absolute h-[2px] w-7 rounded-full"
                            style={{
                                left: `${left}%`,
                                bottom: `${5 + (i % 3) * 6}%`,
                                background:
                                    i % 2
                                        ? "rgba(244,126,104,.5)"
                                        : "rgba(100,190,210,.4)",
                                boxShadow:
                                    i % 2
                                        ? "0 0 10px rgba(244,126,104,.25)"
                                        : "0 0 10px rgba(100,190,210,.2)",
                            }}
                        />
                    )
                )}
            </div>

            {/* GROUND DARKENING */}

            <div
                className="absolute bottom-0 left-0 right-0 h-[20%]"
                style={{
                    background:
                        "linear-gradient(180deg, transparent, rgba(2,5,10,.85) 75%, #02050a)",
                }}
            />

            {/* HORIZON */}

            <div
                className="absolute bottom-[19%] left-0 right-0 h-[12%]"
                style={{
                    background:
                        "linear-gradient(180deg, transparent, rgba(60,100,125,.05), transparent)",
                    filter: "blur(8px)",
                }}
            />

            {/* CINEMATIC VIGNETTE */}

            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(circle at center, transparent 45%, rgba(0,0,0,.55) 100%)",
                }}
            />

            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#02050a] to-transparent" />

            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#02050a] to-transparent" />
        </div>
    );
}