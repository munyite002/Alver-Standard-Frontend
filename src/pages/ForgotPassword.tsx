/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Phone, ArrowLeft, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { initiateForgotPassword } from "@/../api/users.api";

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    {/* Success Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Phone className="h-8 w-8 text-green-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Code Sent!</h2>

                        <p className="text-gray-600 mb-6 leading-relaxed">
                            We've sent a 6-digit verification code to <strong>{phoneNumber}</strong>.
                            Please check your messages and use the code to reset your password.
                        </p>

                        <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                            onClick={() => navigate("/reset-password", { state: { id: userId } })}
                        >
                            Continue to Reset Password
                        </button>

                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="w-full mt-3 text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors duration-200"
                        >
                            Try Different Number
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Toaster position='top-center' richColors />
            <div className="max-w-md w-full">
                {/* Back Link */}
                <button className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors duration-200" onClick={() => navigate("/login")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                </button>

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header with blue accent */}
                    <div className="border-l-4 border-l-blue-500 bg-blue-50/30 px-8 py-6">
                        <div className="flex items-center mb-2">
                            <Phone className="h-6 w-6 text-blue-600 mr-2" />
                            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
                        </div>
                        <p className="text-gray-600">
                            Enter your phone number and we'll send you a code to reset your password.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-sm">+254</span>
                                    </div>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={handlePhoneChange}
                                        placeholder="712 345 678"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900"
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Enter your phone number without the country code
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading || !phoneNumber.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="h-4 w-4 animate-spin mr-2" />
                                        Sending Code...
                                    </>
                                ) : (
                                    'Send Reset Code'
                                )}
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600 text-center">
                                Remember your password?{' '}
                                <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200" onClick={() => navigate("/login")}>
                                    Sign In
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Having trouble? Contact support at{' '}
                        <span className="text-blue-600">support@company.com</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;