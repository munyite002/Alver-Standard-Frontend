/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/Dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updatePassword, updateUser } from "@/../api/users.api";
import { getTariffs, type Tariff } from "@/../api/tariffs.api";
import { toast, Toaster } from "sonner";
import { ArrowLeft } from "lucide-react";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
//@ts-ignore
import { useGlobalContext } from "@/../context/GlobalContext.jsx";
import { TariffConfiguration } from "@/components/Settings/tariff-configuration";

export function SettingsPage() {
    const { user } = useGlobalContext();
    const axiosInstance = useAxiosWithAuth(
        import.meta.env.VITE_PUBLIC_STAGING_API
    );
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    //@ts-ignore
    const [tariffs, setTariffs] = useState<Tariff[]>([]);
    //@ts-ignore
    const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);

    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });

    const [userData, setUserData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone.slice(3,) || "",
    });

    //@ts-ignore
    const [newTariffData, setNewTariffData] = useState<{
        name: string;
        provider: "KPLC" | "ALVER_POWER";
        ratePerUnit: number;
    }>({
        name: "",
        provider: "KPLC",
        ratePerUnit: 0
    });

    useEffect(() => {
        fetchTariffs();
    }, []);

    const fetchTariffs = async () => {
        try {
            setIsLoadingTariffs(true);
            const response = await getTariffs(axiosInstance);
            setTariffs(response.data);
        } catch (err) {
            console.error("Error fetching tariffs:", err);
        } finally {
            setIsLoadingTariffs(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const data = {
                name: userData.name,
                email: userData?.email,
                phone: `254${userData?.phone}`
            };
            await updateUser(axiosInstance, data);
            toast.success("User Updated Successfully");
        } catch (err) {
            console.log(`Error updating User: ${err}`);
            toast.error(
                //@ts-ignore
                `Error Updating User: ${err?.response?.data?.error}`
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateUserPassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            toast.error("Password doesn't match");
            return;
        }
        try {
            setIsSaving(true);
            const data = {
                newPassword: passwordData.newPassword,
                oldPassword: passwordData.oldPassword
            };
            await updatePassword(axiosInstance, data);
            toast.success("Password Updated Successfully");
        } catch (err) {
            console.log(`Error updating password: ${err}`);
            toast.error(
                //@ts-ignore
                `Error Updating User Password: ${err?.response?.data?.error}`
            );
        } finally {
            setIsSaving(false);
        }
    };



    return (
        <div className="flex min-h-screen flex-col">
            <Toaster position="top-right" richColors />
            <DashboardHeader />
            <div className="flex-1 space-y-4 p-6 pt-4 md:p-8 md:pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Settings
                        </h2>
                    </div>
                </div>
                <Tabs defaultValue="account" className="space-y-4">
                    <TabsList className="w-full">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="configurations">
                            Configurations
                        </TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>
                                    Update your personal information. This
                                    information will be displayed publicly.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="first-name">
                                            UserName
                                        </Label>
                                        <Input
                                            id="userName"
                                            placeholder="Enter your Name"
                                            value={userData?.name}
                                            onChange={(e) =>
                                                setUserData((prev) => ({
                                                    ...prev,
                                                    name: e.target.value
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={userData?.email}
                                        onChange={(e) =>
                                            setUserData((prev) => ({
                                                ...prev,
                                                email: e.target.value
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Phone</Label>
                                    <div className="flex items-center space-x-2">
                                        <span>+254</span>
                                        <Input
                                        id="phone"
                                        type="text"
                                        placeholder="Enter your phone number"
                                        value={userData?.phone}
                                        onChange={(e) =>
                                            setUserData((prev) => ({
                                                ...prev,
                                                phone: e.target.value
                                            }))
                                        }
                                    />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save changes"}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="configurations" className="space-y-4">
                        <TariffConfiguration />
                    </TabsContent>
                    <TabsContent value="security" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>
                                    Change your password here. After saving,
                                    you'll be logged out.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">
                                        Current password
                                    </Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        value={passwordData.oldPassword}
                                        onChange={(e) =>
                                            setPasswordData((prev) => ({
                                                ...prev,
                                                oldPassword: e.target.value
                                            }))
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">
                                            New password
                                        </Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) =>
                                                setPasswordData((prev) => ({
                                                    ...prev,
                                                    newPassword: e.target.value
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">
                                            Confirm password
                                        </Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={
                                                passwordData.confirmNewPassword
                                            }
                                            onChange={(e) =>
                                                setPasswordData((prev) => ({
                                                    ...prev,
                                                    confirmNewPassword:
                                                        e.target.value
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <Button
                                onClick={handleUpdateUserPassword}
                                disabled={isSaving}
                                className="mx-4 max-w-[150px]"
                            >
                                {isSaving ? "Saving..." : "Save changes"}
                            </Button>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
