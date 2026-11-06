/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { resetPasswordWithOTP } from "@/../api/users.api"
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordPage() {
    const [code, setCode] = React.useState(['', '', '', '', '', '']);
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [errors, setErrors] = React.useState<any>({});

    const navigate = useNavigate();
    const userId = React.useMemo(() => {
        const state = window.history.state && window.history.state.usr;
        return state?.id || '';
    }, []);


    console.log("UserId: ", userId);

    const handleCodeChange = (index: any, value: any) => {
        if (value.length > 1) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index: any, e: any) => {
        // Handle backspace to go to previous input
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        const codeValue = code.join('');
        if (codeValue.length !== 6) {
            newErrors.code = 'Please enter the complete 6-digit code';
        }

        if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async() => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            const otp = code.join('');
            await resetPasswordWithOTP({
                otp,
                newPassword: password,
                userId
            });
            toast.success("Password reset successfully!");
            setIsSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error: any) {
            console.error("Error: ", error);
            const errorMessage = error?.response?.data?.message || "An error occurred. Please try again.";
            toast.error(errorMessage);
        }
  };

    if (isSuccess) {
        return (
            <AuthShell>
                <div className="space-y-3">
                <p className="av-label av-rise text-accent-text" style={{ animationDelay: "80ms" }}>Account access</p>
                <h1 className="auth-title av-display av-rise text-[clamp(30px,3vw,42px)] leading-[1.04] font-bold tracking-[-0.035em] text-foreground" style={{ animationDelay: "130ms" }}>
                    Password reset<span className="text-signal">.</span>
                </h1>
                <p className="auth-shortest-hide av-rise max-w-[40ch] text-[15px] leading-relaxed text-text-secondary" style={{ animationDelay: "180ms" }}>
                    Your password has been successfully reset. You can now sign in with your new password.
                </p>
            </div>
                <div className="av-rise mt-9" style={{ animationDelay: "240ms" }}>
                    <button className="auth-cta auth-focus group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg text-[15px] font-semibold disabled:opacity-60" onClick={() => navigate("/login")}>
                        <span className="auth-sheen" aria-hidden />
                        <span className="relative">Continue to Login</span>
                    </button>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <div className="space-y-3">
                <p className="av-label av-rise text-accent-text" style={{ animationDelay: "80ms" }}>Account access</p>
                <h1 className="auth-title av-display av-rise text-[clamp(30px,3vw,42px)] leading-[1.04] font-bold tracking-[-0.035em] text-foreground" style={{ animationDelay: "130ms" }}>
                    Reset password<span className="text-signal">.</span>
                </h1>
                <p className="auth-shortest-hide av-rise max-w-[40ch] text-[15px] leading-relaxed text-text-secondary" style={{ animationDelay: "180ms" }}>
                    Enter the 6-digit code sent to your phone number and create a new password.
                </p>
            </div>

            <div className="mt-7 space-y-4">
                <fieldset className="auth-field av-rise space-y-2" style={{ animationDelay: "240ms" }}>
                    <legend className="auth-label av-label">Verification Code</legend>
                    <div className="flex gap-2">
                        {code.map((digit, index) => (
                            <Input
                                key={index}
                                id={`code-${index}`}
                                type="text"
                                inputMode="numeric"
                                autoComplete={index === 0 ? "one-time-code" : "off"}
                                aria-label={`Digit ${index + 1} of 6`}
                                aria-invalid={!!errors.code}
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="auth-input av-num min-w-0 flex-1 px-0 text-center font-mono text-lg font-medium"
                                disabled={isLoading}
                            />
                        ))}
                    </div>
                    {errors.code && <p role="alert" className="text-[13px] text-danger-text">{errors.code}</p>}
                </fieldset>

                <div className="auth-field av-rise space-y-2" style={{ animationDelay: "300ms" }}>
                    <Label htmlFor="password" className="auth-label av-label block">New Password</Label>
                    <div className="auth-input-wrap">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            aria-invalid={!!errors.password}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="auth-input pr-12"
                            disabled={isLoading}
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
                    {errors.password && <p role="alert" className="text-[13px] text-danger-text">{errors.password}</p>}
                </div>

                <div className="auth-field av-rise space-y-2" style={{ animationDelay: "340ms" }}>
                    <Label htmlFor="confirmPassword" className="auth-label av-label block">Confirm New Password</Label>
                    <div className="auth-input-wrap">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            aria-invalid={!!errors.confirmPassword}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="auth-input pr-12"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            aria-pressed={showConfirmPassword}
                            className="auth-focus absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                            {showConfirmPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                        </button>
                        <span className="auth-beam" aria-hidden />
                    </div>
                    {errors.confirmPassword && <p role="alert" className="text-[13px] text-danger-text">{errors.confirmPassword}</p>}
                </div>

                <p className="av-rise text-xs leading-relaxed text-muted-foreground" style={{ animationDelay: "380ms" }}>
                    Password must contain at least 8 characters, a mix of uppercase and lowercase letters, and at least one number.
                </p>

                <div className="av-rise" style={{ animationDelay: "420ms" }}>
                    <button onClick={handleSubmit} disabled={isLoading} aria-busy={isLoading} className="auth-cta auth-focus group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg text-[15px] font-semibold disabled:opacity-60">
                        <span className="auth-sheen" aria-hidden />
                        <span className="relative">{isLoading ? "Resetting Password..." : "Reset Password"}</span>
                        {isLoading && <span className="auth-charge" aria-hidden />}
                    </button>
                </div>

                <button className="auth-focus rounded-sm text-[13px] font-medium text-accent-text av-rise" style={{ animationDelay: "460ms" }} onClick={() => navigate("/forgot-password")}>
                    Back
                </button>
            </div>
        </AuthShell>
    );
}

export default ResetPasswordPage;
