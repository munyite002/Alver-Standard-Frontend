/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { updatePassword, updateUser } from "@/../api/users.api";
import { toast, Toaster } from "sonner";
// import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
//@ts-ignore
import { useGlobalContext } from "@/../context/GlobalContext.jsx";

export function SettingsPage() {
    const { user } = useGlobalContext();
    const axiosInstance = useAxiosWithAuth(
        import.meta.env.VITE_PUBLIC_STAGING_API
    );
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);

    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });

    const [userData, setUserData] = useState({
        name: user?.name || "",
        email: user?.email || ""
    });

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const data = {
                name: userData.name,
                email: userData?.email
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
                        {/* <TabsTrigger value="configurations">
                            Configurations
                        </TabsTrigger> */}
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
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save changes"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* <Card>
                            <CardHeader>
                                <CardTitle>Company Information</CardTitle>
                                <CardDescription>
                                    Update your company details and business
                                    information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company-name">
                                        Company name
                                    </Label>
                                    <Input
                                        id="company-name"
                                        placeholder="Enter your company name"
                                        defaultValue="Acme Inc."
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="business-id">
                                            Business ID
                                        </Label>
                                        <Input
                                            id="business-id"
                                            placeholder="Enter your business ID"
                                            defaultValue="123456"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tax-id">Tax ID</Label>
                                        <Input
                                            id="tax-id"
                                            placeholder="Enter your tax ID"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="Enter your address"
                                    />
                                </div>
                            </CardContent>
                        </Card> */}
                    </TabsContent>
                    <TabsContent value="configurations" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Price Tariff Configuration
                                </CardTitle>
                                <CardDescription>
                                    Manage and update your current pricing
                                    structure.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Current Tariff Display */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium">
                                        Current Tariff
                                    </h3>
                                    <Separator />
                                    <div className="grid grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <Label className="text-muted-foreground">
                                                Rate
                                            </Label>
                                            <p className="text-lg font-semibold">
                                                Ksh 31/kWh
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tariff Modification Form */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">
                                        Update Tariff
                                    </h3>
                                    <Separator />
                                    <form className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="base-rate">
                                                    Base Rate ($/kWh)
                                                </Label>
                                                <Input
                                                    id="base-rate"
                                                    type="number"
                                                    step="1"
                                                    min="30"
                                                    defaultValue="30"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <Button type="submit">
                                                Update Tariff
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
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
                        {/* <Card>
                            <CardHeader>
                                <CardTitle>Two-Factor Authentication</CardTitle>
                                <CardDescription>
                                    Add an extra layer of security to your
                                    account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="2fa">Enable 2FA</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Protect your account with two-factor
                                            authentication.
                                        </p>
                                    </div>
                                    <Switch id="2fa" />
                                </div>
                            </CardContent>
                        </Card> */}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
