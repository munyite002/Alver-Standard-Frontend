/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Zap, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
//@ts-ignore
import { useGlobalContext } from "@/../context/GlobalContext";
import { login } from "@/../api/users.api";

export default function LoginPage() {
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleLogin = async (credentials = formData) => {
        try {
            setIsLoading(true);
            const response = await login(credentials);
            const { token, user } = response;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            setIsLoggedIn(true);
            setUser(user);
            toast.success("Login Success! Redirecting . . .");
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (error) {
            const errorMessage =
                (error as any)?.response?.data?.message ||
                (error as Error)?.message ||
                "Unknown error";
            console.log("Error: ", errorMessage);
            toast.error(`Error occured during login: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = () => {
        const demoCredentials = { email: "demo@admin", password: "12345678" };
        setFormData(demoCredentials);
        handleLogin(demoCredentials);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <div className="min-h-screen w-full flex bg-[#F9FAFB] text-[#101828] overflow-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

                .av-font-body { font-family: 'Inter', system-ui, sans-serif; }
                .av-font-display { font-family: 'Space Grotesk', system-ui, sans-serif; }
                .av-font-mono { font-family: 'JetBrains Mono', 'Courier New', monospace; }

                .av-grid-bg {
                    background-image:
                        linear-gradient(rgba(21,93,252,0.055) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(21,93,252,0.055) 1px, transparent 1px);
                    background-size: 34px 34px;
                    mask-image: radial-gradient(ellipse 90% 75% at 50% 35%, #000 45%, transparent 92%);
                }

                @keyframes av-scroll-wave {
                    from { stroke-dashoffset: 0; }
                    to { stroke-dashoffset: -480; }
                }
                .av-wave-line { animation: av-scroll-wave 7s linear infinite; }
                .av-wave-line-slow { animation: av-scroll-wave 11s linear infinite reverse; }

                @keyframes av-pulse-dot {
                    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(254,1,0,0.35); }
                    50% { opacity: 0.55; box-shadow: 0 0 0 5px rgba(254,1,0,0); }
                }
                .av-live-dot { animation: av-pulse-dot 2s ease-in-out infinite; }

                @keyframes av-fade-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .av-fade-up { animation: av-fade-up 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .av-fade-up-1 { animation-delay: 0.05s; }
                .av-fade-up-2 { animation-delay: 0.12s; }
                .av-fade-up-3 { animation-delay: 0.19s; }
                .av-fade-up-4 { animation-delay: 0.26s; }

                @keyframes av-shimmer {
                    from { transform: translateX(-120%) skewX(-15deg); }
                    to { transform: translateX(220%) skewX(-15deg); }
                }
                .av-btn:hover .av-shimmer { animation: av-shimmer 1.1s ease; }

                .av-input {
                    background-color: #FFFFFF;
                    border: 1px solid #E4E7EC;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .av-input:hover { border-color: #C6CBD3; }
                .av-input:focus-within {
                    border-color: #155DFC;
                    box-shadow: 0 0 0 3px rgba(21,93,252,0.14);
                }

                .av-via { fill: #FFFFFF; stroke-width: 2.5; }
            `}</style>

            <Toaster position="top-center" richColors theme="light" />

            {/* ================= Left visual panel ================= */}
            <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between px-16 py-14 border-r border-[#E4E7EC]">
                <div className="absolute inset-0 av-grid-bg pointer-events-none" />
                <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-[#FE0100]/[0.05] blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-[#155DFC]/[0.06] blur-3xl pointer-events-none" />

                {/* Brand mark */}
                <div className="relative z-10 flex items-center gap-3 av-fade-up">
                    <div className="w-10 h-10 rounded-lg bg-[#FE0100]/10 border border-[#FE0100]/25 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[#FE0100]" strokeWidth={2.25} />
                    </div>
                    <div className="leading-tight">
                        <p className="av-font-display text-[15px] font-semibold tracking-wide text-[#101828]">ALVER POWER</p>
                        <p className="av-font-mono text-[10px] tracking-[0.18em] text-[#98A2B3] uppercase">Meter Management</p>
                    </div>
                </div>

                {/* Headline + waveform */}
                <div className="relative z-10 av-fade-up av-fade-up-2">
                    <h1 className="av-font-display text-[2.65rem] leading-[1.12] font-semibold text-[#101828] max-w-md">
                        Visibility into every meter,{" "}
                        <span className="text-[#FE0100]">across the grid.</span>
                    </h1>
                    <p className="av-font-body text-[#667085] mt-4 max-w-sm text-[15px] leading-relaxed">
                        Monitor consumption, manage devices, and keep your network of
                        energy meters running from a single control panel.
                    </p>

                    <div className="mt-12 rounded-xl border border-[#E4E7EC] bg-white/80 backdrop-blur-sm p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                        <svg viewBox="0 0 480 90" className="w-full h-20" preserveAspectRatio="none">
                            <path
                                d="M0,45 L20,45 L32,15 L46,75 L60,45 L120,45 L132,20 L146,70 L160,45 L220,45 L232,15 L246,75 L260,45 L320,45 L332,20 L346,70 L360,45 L420,45 L432,15 L446,75 L460,45 L480,45"
                                fill="none"
                                stroke="#155DFC"
                                strokeOpacity="0.4"
                                strokeWidth="1.5"
                                strokeDasharray="6 4"
                                className="av-wave-line-slow"
                            />
                            <path
                                d="M0,45 Q15,10 30,45 T60,45 T90,45 T120,45 T150,45 T180,45 T210,45 T240,45 T270,45 T300,45 T330,45 T360,45 T390,45 T420,45 T450,45 T480,45"
                                fill="none"
                                stroke="#FE0100"
                                strokeWidth="2"
                                strokeDasharray="10 6"
                                className="av-wave-line"
                            />
                            <circle cx="30" cy="45" r="3" className="av-via" stroke="#155DFC" />
                            <circle cx="240" cy="45" r="3" className="av-via" stroke="#FE0100" />
                            <circle cx="450" cy="45" r="3" className="av-via" stroke="#155DFC" />
                        </svg>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E4E7EC] av-font-mono text-[11px] tracking-wide">
                            <div className="flex items-center gap-1.5 text-[#FE0100] font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FE0100] av-live-dot" />
                                LIVE
                            </div>
                            <span className="text-[#98A2B3]">GRID FREQ <span className="text-[#155DFC]">50.02 Hz</span></span>
                            <span className="text-[#98A2B3]">LOAD <span className="text-[#155DFC]">128.4 kW</span></span>
                            <span className="text-[#98A2B3]">VOLT <span className="text-[#155DFC]">231 V</span></span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="relative z-10 av-font-mono text-[11px] text-[#98A2B3] av-fade-up av-fade-up-3">
                    © {new Date().getFullYear()} Alver Power. All rights reserved.
                </p>
            </div>

            {/* ================= Right form panel ================= */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 relative">
                <div className="lg:hidden absolute inset-0 av-grid-bg pointer-events-none opacity-70" />

                <div className="relative w-full max-w-[400px]">
                    {/* Mobile brand mark */}
                    <div className="lg:hidden flex items-center gap-3 mb-10 av-fade-up justify-center">
                        <div className="w-10 h-10 rounded-lg bg-[#FE0100]/10 border border-[#FE0100]/25 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-[#FE0100]" strokeWidth={2.25} />
                        </div>
                        <div className="leading-tight">
                            <p className="av-font-display text-[15px] font-semibold tracking-wide">ALVER POWER</p>
                            <p className="av-font-mono text-[10px] tracking-[0.18em] text-[#98A2B3] uppercase">Meter Management</p>
                        </div>
                    </div>

                    <div className="mb-9 av-fade-up av-fade-up-1">
                        <div className="flex items-center gap-2 av-font-mono text-[11px] tracking-[0.18em] text-[#155DFC] uppercase mb-3">
                            <Radio className="w-3.5 h-3.5" />
                            Admin Panel
                        </div>
                        <h2 className="av-font-display text-3xl font-semibold text-[#101828]">Sign in to your account</h2>
                        <p className="av-font-body text-[#667085] mt-2 text-[14.5px]">
                            Enter your credentials to access the dashboard.
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* Email Field */}
                        <div className="av-fade-up av-fade-up-2">
                            <label htmlFor="email" className="av-font-mono block text-[11px] tracking-[0.1em] uppercase text-[#667085] mb-2">
                                Email Address
                            </label>
                            <div className="av-input relative rounded-lg flex items-center">
                                <Mail className="ml-3.5 h-[18px] w-[18px] text-[#98A2B3] shrink-0" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@alverpower.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value
                                        }))
                                    }
                                    onKeyDown={handleKeyDown}
                                    className="av-font-body w-full bg-transparent pl-3 pr-4 py-3 text-[14.5px] text-[#101828] placeholder:text-[#98A2B3] outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="av-fade-up av-fade-up-3">
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="av-font-mono text-[11px] tracking-[0.1em] uppercase text-[#667085]">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="av-font-body text-[13px] text-[#155DFC] hover:text-[#0E44C4] transition-colors"
                                    onClick={() => navigate("/forgot-password")}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="av-input relative rounded-lg flex items-center">
                                <Lock className="ml-3.5 h-[18px] w-[18px] text-[#98A2B3] shrink-0" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            password: e.target.value
                                        }))
                                    }
                                    onKeyDown={handleKeyDown}
                                    className="av-font-body w-full bg-transparent pl-3 pr-3 py-3 text-[14.5px] text-[#101828] placeholder:text-[#98A2B3] outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="mr-3.5 text-[#98A2B3] hover:text-[#475467] transition-colors shrink-0"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleLogin()}
                            className="av-btn av-fade-up av-fade-up-4 relative overflow-hidden w-full bg-[#FE0100] hover:bg-[#E00100] disabled:bg-[#FE0100]/50 disabled:cursor-not-allowed text-white av-font-body font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center mt-2 shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                        >
                            <span className="av-shimmer absolute inset-y-0 left-0 w-1/3 bg-white/25 -skew-x-12" />
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>

                        {/* Divider */}
                        <div className="av-fade-up av-fade-up-4 flex items-center gap-3 py-1">
                            <span className="h-px flex-1 bg-[#E4E7EC]" />
                            <span className="av-font-mono text-[10px] tracking-[0.14em] text-[#98A2B3] uppercase">or</span>
                            <span className="h-px flex-1 bg-[#E4E7EC]" />
                        </div>

                        {/* Demo Account Button */}
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={handleDemoLogin}
                            className="av-fade-up av-fade-up-4 w-full bg-white hover:bg-[#F9FAFB] disabled:cursor-not-allowed border border-[#E4E7EC] hover:border-[#155DFC]/40 text-[#155DFC] av-font-body font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <Radio className="w-4 h-4" strokeWidth={2.25} />
                            Try demo account
                        </button>
                    </div>

                    {/* Mobile footer */}
                    <p className="lg:hidden av-font-mono text-center text-[11px] text-[#98A2B3] mt-10">
                        © {new Date().getFullYear()} Alver Power. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
