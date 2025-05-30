/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";
//@ts-ignore
import { useGlobalContext } from "@/../context/GlobalContext";
import { login } from "@/../api/users.api";
import { toast, Toaster } from "sonner";

export function LoginPage() {
    const { setUser, setIsLoggedIn } = useGlobalContext();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <Toaster position="top-right" richColors />
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-primary/10 p-2">
                            <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <div>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        email: e.target.value
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2 my-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Button
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    type="button"
                                >
                                    Forgot password?
                                </Button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        password: e.target.value
                                    }))
                                }
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            type="button"
                            disabled={isLoading}
                            onClick={handleLogin}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                    </CardFooter>
                </div>
            </Card>
        </div>
    );
}
