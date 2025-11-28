import { Outlet } from "react-router-dom";
import { DashboardNav } from "@/components/Dashboard/dashboard-nav";


function RootLayout() {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar - hidden on mobile */}
            <div className="hidden md:block w-64 border-r border-gray-200 bg-white">
                <div className="flex h-16 items-center border-b border-gray-200 px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center p-1">
                            <img src="/icon.png" alt="Alver Logo" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Alver Stron</h1>
                            <p className="text-xs text-gray-500">Dashboard</p>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    <div className="mb-6">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Main Menu
                        </h2>
                        <DashboardNav/>
                    </div>
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
