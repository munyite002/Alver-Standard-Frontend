import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/Dashboard/dashboard-header";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";

export function SettingsPage() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
        }, 1000);
    };

    return (
        <div className="flex min-h-screen flex-col">
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
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                </div>
                <Tabs defaultValue="account" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="notifications">
                            Notifications
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
                                            First name
                                        </Label>
                                        <Input
                                            id="first-name"
                                            placeholder="Enter your first name"
                                            defaultValue="Admin"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last-name">
                                            Last name
                                        </Label>
                                        <Input
                                            id="last-name"
                                            placeholder="Enter your last name"
                                            defaultValue="User"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        defaultValue="admin@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Input
                                        id="bio"
                                        placeholder="Enter your bio"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
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
                        </Card>
                    </TabsContent>
                    <TabsContent value="notifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Configure how you receive notifications.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">
                                        Email Notifications
                                    </h3>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="new-payments">
                                                New Payments
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications for new
                                                payments.
                                            </p>
                                        </div>
                                        <Switch
                                            id="new-payments"
                                            defaultChecked
                                        />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="payment-failed">
                                                Failed Payments
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications for failed
                                                payments.
                                            </p>
                                        </div>
                                        <Switch
                                            id="payment-failed"
                                            defaultChecked
                                        />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="account-updates">
                                                Account Updates
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications for
                                                account updates.
                                            </p>
                                        </div>
                                        <Switch id="account-updates" />
                                    </div>
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
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">
                                            Confirm password
                                        </Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">
                                    <Save className="mr-2 h-4 w-4" />
                                    Change password
                                </Button>
                            </CardFooter>
                        </Card>
                        <Card>
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
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
