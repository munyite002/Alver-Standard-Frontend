import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useTheme } from "@/lib/theme";

const ease = [0.16, 1, 0.3, 1] as const;

/** Sign-in canvas: the form and the console panel beside it both follow the theme. */
export function AuthShell({ children }: { children: ReactNode }) {
    const { mode, toggleMode } = useTheme();
    const toLight = mode === "dark";

    return (
        <main className="relative isolate flex min-h-dvh w-full bg-background lg:h-dvh lg:overflow-hidden">
            <Toaster position="top-center" richColors />
            <div className="auth-ambient" aria-hidden />

            <section className="relative z-10 flex w-full flex-col px-6 py-7 [@media(max-height:620px)]:py-4 sm:px-12 lg:w-[44%] lg:overflow-y-auto xl:px-20">
                <div className="auth-current" aria-hidden />
                <header className="av-rise flex items-center justify-between gap-4">
                    <img
                        src={mode === "dark" ? "/logo-dark.png" : "/logo-light.png"}
                        alt="Alver Power Systems"
                        className="h-10 w-auto"
                    />
                    <button
                        type="button"
                        onClick={(e) => toggleMode(e.currentTarget)}
                        aria-label={toLight ? "Switch to light theme" : "Switch to dark theme"}
                        className="auth-focus av-label flex h-10 items-center gap-2 rounded-lg px-2.5 text-text-secondary transition-colors hover:text-foreground"
                    >
                        {toLight ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
                        {toLight ? "Light" : "Dark"}
                    </button>
                </header>

                <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-8 [@media(max-height:720px)]:py-3">{children}</div>

                <footer className="auth-taller-only av-label av-rise text-[10.5px] text-muted-foreground" style={{ animationDelay: "420ms" }}>
                    © {new Date().getFullYear()} Alver Power. All rights reserved.
                </footer>
            </section>

            <PowerConsole />
        </main>
    );
}

/* ─────────────── Console: payment, vend, meter, which is what this product does ─────────────── */

const PAYMENT = { x: 58, y: 220 };
const VEND_X = 200;
const BUS_X = 318;
const METER_X = 410;
const meterRows = [34, 106, 178, 250, 322, 394];
const TRAVEL = 0.72; // share of each cycle spent travelling; the rest is the meter's flash
const routes = meterRows.map((y) => {
    const toVend = VEND_X - PAYMENT.x;
    const total = BUS_X - PAYMENT.x + Math.abs(y - PAYMENT.y) + (METER_X - BUS_X);
    return {
        y,
        vendAt: (toVend / total) * TRAVEL,
        d: `M${PAYMENT.x} ${PAYMENT.y} H${BUS_X} V${y} H${METER_X}`
    };
});

// Modules that exist in this panel's navigation.
const modules = ["Meters", "Payment Queue", "Reports", "Accounts", "Tickets", "SMS Delivery"];

const PULSE_DUR = 3.6;
const DRAW_DONE = 1.5;
const key = (n: number) => Math.min(Math.max(n, 0.001), 0.999).toFixed(3);

function PowerConsole() {
    const panel = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();

    // Written straight to CSS vars: no re-render per pointer frame.
    const track = (e: React.PointerEvent) => {
        const el = panel.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    const timing = (i: number) => ({
        dur: `${PULSE_DUR}s`,
        begin: `${DRAW_DONE + i * 0.6}s`,
        repeatCount: "indefinite" as const
    });

    return (
        <aside
            ref={panel}
            onPointerMove={track}
            aria-hidden
            className="auth-panel relative z-10 hidden h-full flex-col lg:flex lg:w-[56%]"
        >
            <div className="auth-panel-glow" />
            <span className="auth-reg auth-reg-tl" />
            <span className="auth-reg auth-reg-tr" />
            <span className="auth-reg auth-reg-bl" />
            <span className="auth-reg auth-reg-br" />

            <div className="relative flex shrink-0 items-center justify-between px-12 pt-9 font-mono text-[11px] tracking-[0.16em] text-[var(--panel-label)] xl:px-16">
                <span>
                    ALVER POWER <span className="text-[var(--panel-faint)]">/</span> ADMIN CONSOLE
                </span>
                <LocalClock />
            </div>

            <div className="relative min-h-0 flex-1 px-10 py-4 xl:px-16">
                <svg viewBox="0 0 520 440" className="h-full w-full" fill="none">
                    <defs>
                        <filter id="auth-glow" x="-200%" y="-200%" width="500%" height="500%">
                            <feGaussianBlur stdDeviation="4" result="b" />
                            <feMerge>
                                <feMergeNode in="b" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Wires energise outward from the payment */}
                    {routes.map((r, i) => (
                        <motion.path
                            key={r.y}
                            d={r.d}
                            className="auth-wire"
                            strokeWidth={1.5}
                            strokeLinejoin="round"
                            initial={reduce ? false : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.3, ease, delay: 0.35 + i * 0.04 }}
                        />
                    ))}

                    {/* Payment */}
                    <motion.g
                        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease, delay: 0.2 }}
                        style={{ transformOrigin: `${PAYMENT.x}px ${PAYMENT.y}px` }}
                    >
                        <circle cx={PAYMENT.x} cy={PAYMENT.y} r={30} className="auth-red-fill" fillOpacity={0.1} />
                        <circle cx={PAYMENT.x} cy={PAYMENT.y} r={15} className="auth-red-stroke auth-canvas-fill" strokeWidth={1.75} />
                        <circle cx={PAYMENT.x} cy={PAYMENT.y} r={4} className="auth-red-fill" />
                        <text x={PAYMENT.x} y={PAYMENT.y + 50} textAnchor="middle" className="auth-svg-label">M-PESA</text>
                    </motion.g>

                    {/* Vending */}
                    <motion.g
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease, delay: 0.7 }}
                    >
                        <rect x={VEND_X - 30} y={PAYMENT.y - 20} width={60} height={40} rx={8} className="auth-node" strokeWidth={1.25} />
                        <path
                            d={`M${VEND_X + 3} ${PAYMENT.y - 11} L${VEND_X - 7} ${PAYMENT.y + 2} H${VEND_X} L${VEND_X - 3} ${PAYMENT.y + 11} L${VEND_X + 7} ${PAYMENT.y - 2} H${VEND_X} Z`}
                            className="auth-mark"
                        />
                        <text x={VEND_X} y={PAYMENT.y + 50} textAnchor="middle" className="auth-svg-label">TOKEN</text>
                    </motion.g>

                    {/* The vending box lights as a pulse passes through it */}
                    {!reduce &&
                        routes.map((r, i) => (
                            <rect key={r.y} x={VEND_X - 30} y={PAYMENT.y - 20} width={60} height={40} rx={8} className="auth-red-stroke" strokeWidth={1.5} opacity={0} filter="url(#auth-glow)">
                                <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={`0;${key(r.vendAt - 0.03)};${key(r.vendAt)};${key(r.vendAt + 0.1)};1`} {...timing(i)} />
                            </rect>
                        ))}

                    {/* Meters */}
                    {routes.map((r, i) => (
                        <motion.g
                            key={r.y}
                            initial={reduce ? false : { opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, ease, delay: 1.1 + i * 0.05 }}
                        >
                            {!reduce && (
                                <circle cx={METER_X + 14} cy={r.y} r={14} className="auth-red-stroke" strokeWidth={1.5} opacity={0}>
                                    <animate attributeName="opacity" values="0;0;0.9;0" keyTimes={`0;${TRAVEL - 0.02};${TRAVEL + 0.01};1`} {...timing(i)} />
                                    <animate attributeName="r" values="14;14;14;26" keyTimes={`0;${TRAVEL - 0.02};${TRAVEL + 0.01};1`} {...timing(i)} />
                                </circle>
                            )}
                            <rect x={METER_X} y={r.y - 14} width={28} height={28} rx={7} className="auth-node" strokeWidth={1.25} />
                            <rect x={METER_X + 7} y={r.y - 7} width={14} height={7} rx={1.5} className="auth-screen" />
                            <circle cx={METER_X + 14} cy={r.y + 6} r={2} className="auth-dot" />
                            {!reduce && (
                                <circle cx={METER_X + 14} cy={r.y + 6} r={2} className="auth-red-fill" opacity={0}>
                                    <animate attributeName="opacity" values="0;0;1;0" keyTimes={`0;${TRAVEL - 0.02};${TRAVEL + 0.01};1`} {...timing(i)} />
                                </circle>
                            )}
                            <text x={METER_X + 40} y={r.y + 4} className="auth-svg-label">METER</text>
                        </motion.g>
                    ))}

                    {/* Pulses travelling payment → token → meter */}
                    {!reduce &&
                        routes.map((r, i) => (
                            <g key={r.y} opacity={0} filter="url(#auth-glow)">
                                <circle r={8} className="auth-red-fill" opacity={0.3} />
                                <circle r={3} className="auth-pulse" />
                                <animateMotion path={r.d} keyPoints="0;1;1" keyTimes={`0;${TRAVEL};1`} calcMode="linear" {...timing(i)} />
                                <animate attributeName="opacity" values="0;1;1;0;0" keyTimes={`0;0.04;${TRAVEL - 0.04};${TRAVEL};1`} {...timing(i)} />
                            </g>
                        ))}
                </svg>
            </div>

            <div className="relative shrink-0 space-y-5 px-12 pb-10 xl:px-16">
                <h2 className="av-display text-[clamp(26px,2.5vw,40px)] leading-[1.05] font-bold tracking-[-0.03em] text-[var(--panel-heading)]">
                    Visibility into every meter,
                    <br />
                    <span className="text-[var(--panel-accent)]">across the grid.</span>
                </h2>
                <p className="auth-tall-only max-w-[52ch] text-[14.5px] leading-relaxed text-[var(--panel-text)]">
                    Monitor consumption, manage devices, and keep your network of energy meters running from a single control panel.
                </p>
                <ul className="auth-taller-only flex flex-wrap gap-2">
                    {modules.map((m) => (
                        <li key={m} className="auth-chip">{m}</li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}

function LocalClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <span className="tabular-nums">
            LOCAL <span className="text-[var(--panel-value)]">{now.toLocaleTimeString([], { hour12: false })}</span>
        </span>
    );
}
