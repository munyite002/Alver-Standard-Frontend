/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { initiateForgotPassword } from "@/../api/users.api";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [userId, setUserId] = React.useState('');

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!phoneNumber.trim()) return;

        try {
            setIsLoading(true);
            const response = await initiateForgotPassword({ phone: `254${(handleCleanPhoneNumber(phoneNumber))}` });
            if (response.status === 200) {
                setIsSubmitted(true);
                setUserId(response.data.userId);
                toast.success("Code sent successfully! Please check your messages.");
            } else {
                toast.error("Failed to send code. Please try again.");
            }

        } catch (error: any) {
            console.error("Error: ", error);
            const errorMessage = error?.response?.data?.message || "An error occurred. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPhoneNumber = (value: any) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');

        // Format as XXX XXX XXXX
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    };

    const handlePhoneChange = (e: any) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhoneNumber(formatted);
    };

    const handleCleanPhoneNumber = (phoneNumber: string) => {
        // Remove spaces and return to raw format
        const rawNumber = phoneNumber.replace(/\s/g, '');
        return rawNumber;
    }

    if (isSubmitted) {
        return (
            <AuthShell>
                <div className="space-y-3">
                <p className="av-label av-rise text-accent-text" style={{ animationDelay: "80ms" }}>Check your phone</p>
                <h1 className="auth-title av-display av-rise text-[clamp(30px,3vw,42px)] leading-[1.04] font-bold tracking-[-0.035em] text-foreground" style={{ animationDelay: "130ms" }}>
                    Code sent<span className="text-signal">.</span>
                </h1>
                <p className="auth-shortest-hide av-rise max-w-[40ch] text-[15px] leading-relaxed text-text-secondary" style={{ animationDelay: "180ms" }}>
                    We've sent a 6-digit verification code to <strong className="av-num font-medium text-foreground">{phoneNumber}</strong>. Please check your messages and use the code to reset your password.
                </p>
            </div>
                <div className="mt-9 space-y-3">
                    <div className="av-rise" style={{ animationDelay: "240ms" }}>
                        <button className="auth-cta auth-focus group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg text-[15px] font-semibold disabled:opacity-60" onClick={() => navigate("/reset-password", { state: { id: userId } })}>
                            <span className="auth-sheen" aria-hidden />
                            <span className="relative flex items-center gap-2">
                                Continue to Reset Password
                                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                            </span>
                        </button>
                    </div>
                    <div className="av-rise" style={{ animationDelay: "300ms" }}>
                        <button onClick={() => setIsSubmitted(false)} className="auth-alt auth-focus flex h-12 w-full items-center justify-center rounded-lg text-[15px] font-semibold">
                            Try Different Number
                        </button>
                    </div>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <div className="space-y-3">
                <p className="av-label av-rise text-accent-text" style={{ animationDelay: "80ms" }}>Account access</p>
                <h1 className="auth-title av-display av-rise text-[clamp(30px,3vw,42px)] leading-[1.04] font-bold tracking-[-0.035em] text-foreground" style={{ animationDelay: "130ms" }}>
                    Forgot password<span className="text-signal">.</span>
                </h1>
                <p className="auth-shortest-hide av-rise max-w-[40ch] text-[15px] leading-relaxed text-text-secondary" style={{ animationDelay: "180ms" }}>
                    Enter your phone number and we'll send you a code to reset your password.
                </p>
            </div>

            <div className="mt-9 space-y-5">
                <div className="auth-field av-rise space-y-2" style={{ animationDelay: "240ms" }}>
                    <Label htmlFor="phone" className="auth-label av-label block">Phone Number</Label>
                    <div className="auth-input-wrap">
                        <span className="av-num pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[15px] text-muted-foreground">+254</span>
                        <Input
                            id="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel-national"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="712 345 678"
                            className="auth-input av-num pl-[3.75rem]"
                            disabled={isLoading}
                            required
                        />
                        <span className="auth-beam" aria-hidden />
                    </div>
                    <p className="text-xs text-muted-foreground">Enter your phone number without the country code</p>
                </div>

                <div className="av-rise pt-1" style={{ animationDelay: "300ms" }}>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || !phoneNumber.trim()}
                        aria-busy={isLoading}
                        className="auth-cta auth-focus group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg text-[15px] font-semibold disabled:opacity-60"
                    >
                        <span className="auth-sheen" aria-hidden />
                        <span className="relative">{isLoading ? "Sending Code..." : "Send Reset Code"}</span>
                        {isLoading && <span className="auth-charge" aria-hidden />}
                    </button>
                </div>

                <p className="av-rise text-sm text-text-secondary" style={{ animationDelay: "360ms" }}>
                    Remember your password?{' '}
                    <button className="auth-focus rounded-sm text-[13px] font-medium text-accent-text" onClick={() => navigate("/login")}>Sign In</button>
                </p>
            </div>
        </AuthShell>
    );
}

export default ForgotPasswordPage;
