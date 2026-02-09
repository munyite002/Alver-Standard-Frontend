import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardNav } from "@/components/Dashboard/dashboard-nav";
import { DashboardHeader } from "@/components/Dashboard/dashboard-header";


function RootLayout() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - hidden on mobile */}
            <div className="hidden md:block w-64 flex-shrink-0 border-r border-gray-200 bg-white">
                <div className="flex h-16 items-center border-b border-gray-200 px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center p-1">
                            <img src="/icon.png" alt="Alver Logo" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900 leading-none">Alver Stron</h1>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-medium">Dashboard</p>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    <div className="mb-6">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                            Main Menu
                        </h2>
                        <DashboardNav />
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <DashboardHeader
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
                <main className="flex-1 overflow-x-auto">
                    <Outlet context={{ searchQuery, setSearchQuery }} />
                </main>
            </div>
        </div>
    );
}

export default RootLayout;
