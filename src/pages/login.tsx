/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
//@ts-ignore
import { useGlobalContext } from "@/../context/GlobalContext";
import { login } from "@/../api/users.api";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <AuthShell>
            <div className="space-y-3">
                <p className="av-label av-rise text-accent-text" style={{ animationDelay: "80ms" }}>
                    Admin Panel
                </p>
                <h1
                    className="auth-title av-display av-rise text-[clamp(30px,3vw,42px)] leading-[1.04] font-bold tracking-[-0.035em] text-foreground"
                    style={{ animationDelay: "130ms" }}
                >
                    Sign in to your account<span className="text-signal">.</span>
                </h1>
                <p className="auth-shortest-hide av-rise max-w-[40ch] text-[15px] leading-relaxed text-text-secondary" style={{ animationDelay: "180ms" }}>
                    Enter your credentials to access the dashboard.
                </p>
            </div>

            <div className="mt-9 space-y-5 [@media(max-height:720px)]:mt-5 [@media(max-height:720px)]:space-y-3">
                <div className="auth-field av-rise space-y-2" style={{ animationDelay: "240ms" }}>
                    <Label htmlFor="email" className="auth-label av-label block">
                        Email Address
                    </Label>
                    <div className="auth-input-wrap">
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            spellCheck={false}
                            placeholder="you@alverpower.com"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    email: e.target.value
                                }))
                            }
                            onKeyDown={handleKeyDown}
                            className="auth-input"
                            required
                        />
                        <span className="auth-beam" aria-hidden />
                    </div>
                </div>

                <div className="auth-field av-rise space-y-2" style={{ animationDelay: "300ms" }}>
                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="password" className="auth-label av-label block">
                            Password
                        </Label>
                        <button
                            type="button"
                            className="auth-focus group relative rounded-sm text-[13px] font-medium text-accent-text"
                            onClick={() => navigate("/forgot-password")}
                        >
                            Forgot password?
                            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
                        </button>
                    </div>
                    <div className="auth-input-wrap">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    password: e.target.value
                                }))
                            }
                            onKeyDown={handleKeyDown}
                            className="auth-input pr-12"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            className="auth-focus absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                        </button>
                        <span className="auth-beam" aria-hidden />
                    </div>
                </div>

                <div className="av-rise pt-2" style={{ animationDelay: "360ms" }}>
                    <button
                        type="button"
                        disabled={isLoading}
                        aria-busy={isLoading}
                        onClick={() => handleLogin()}
                        className="auth-cta auth-focus group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg text-[15px] font-semibold"
                    >
                        <span className="auth-sheen" aria-hidden />
                        {isLoading ? (
                            <span className="relative">Signing in...</span>
                        ) : (
                            <span className="relative flex items-center gap-2">
                                Sign in
                                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                            </span>
                        )}
                        {isLoading && <span className="auth-charge" aria-hidden />}
                    </button>
                </div>

                <div className="av-rise flex items-center gap-3" style={{ animationDelay: "400ms" }}>
                    <span className="h-px flex-1 bg-border" />
                    <span className="av-label text-[10px] text-muted-foreground">or</span>
                    <span className="h-px flex-1 bg-border" />
                </div>

                <div className="av-rise" style={{ animationDelay: "430ms" }}>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleDemoLogin}
                        className="auth-alt auth-focus flex h-12 w-full items-center justify-center rounded-lg text-[15px] font-semibold"
                    >
                        Try demo account
                    </button>
                </div>
            </div>
        </AuthShell>
    );
}
