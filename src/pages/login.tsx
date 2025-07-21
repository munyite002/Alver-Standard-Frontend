/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
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

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const response = await login(formData);
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Toaster position="top-center" richColors />
            <div className="w-full max-w-md">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 p-2">
                            <img src="/icon.png" alt="Alver Logo" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Alver Stron Admin Panel</h1>
                        <p className="text-gray-600">Welcome back! Please sign in to your account</p>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value
                                        }))
                                    }
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                                    onClick={() => navigate("/forgot-password")}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 hover:border-gray-400"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={handleLogin}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500">
                        © 2024 Alver Stron. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}