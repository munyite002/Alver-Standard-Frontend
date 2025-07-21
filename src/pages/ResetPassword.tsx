/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Shield, Eye, EyeOff, ArrowLeft, Loader, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { resetPasswordWithOTP } from "@/../api/users.api"

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset!</h2>

                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>

                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
                            Continue to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Back Link */}
                <button className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200" onClick={() => navigate("/forgot-password")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </button>

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <Toaster position='top-center' richColors />
                    {/* Header with blue accent */}
                    <div className="border-l-4 border-l-blue-500 bg-blue-50/30 px-8 py-6">
                        <div className="flex items-center mb-2">
                            <Shield className="h-6 w-6 text-blue-600 mr-2" />
                            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                        </div>
                        <p className="text-gray-600">
                            Enter the 6-digit code sent to your phone number and create a new password.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Verification Code */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Verification Code
                                </label>
                                <div className="flex space-x-3 justify-center">
                                    {code.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`code-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            value={digit}
                                            onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${errors.code ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            disabled={isLoading}
                                        />
                                    ))}
                                </div>
                                {errors.code && (
                                    <p className="mt-2 text-sm text-red-600">{errors.code}</p>
                                )}
                            </div>

                            {/* New Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className={`w-full pr-12 pl-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${errors.password ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className={`w-full pr-12 pl-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Password Requirements */}
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <p className="font-medium mb-1">Password must contain:</p>
                                <ul className="text-xs space-y-1">
                                    <li>• At least 8 characters</li>
                                    <li>• Mix of uppercase and lowercase letters</li>
                                    <li>• At least one number</li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="h-4 w-4 animate-spin mr-2" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Need help? Contact support at{' '}
                        <span className="text-blue-600">operations@alverpower.com</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordPage;