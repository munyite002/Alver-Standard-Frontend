import { Outlet } from "react-router-dom";
import { DashboardNav } from "@/components/Dashboard/dashboard-nav";

function RootLayout() {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar - hidden on mobile */}
            <div className="hidden md:block w-64 border-r bg-background">
                <div className="flex h-16 items-center border-b px-6">
                <h1 className="text-xl font-semibold">Alver Stron Dashboard</h1>
                </div>
                <div className="p-6">
                    <DashboardNav />
                </div>
            </div>
            {/* Main content */}
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
}

export default RootLayout;
