import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardNav } from "@/components/Dashboard/dashboard-nav";
import { DashboardHeader } from "@/components/Dashboard/dashboard-header";


function RootLayout() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="flex min-h-dvh bg-background">
            <a href="#main-content" className="skip-link">
                Skip to content
            </a>

            {/* Sidebar - hidden on mobile */}
            <aside className="sticky top-0 hidden h-dvh w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar md:block">
                <DashboardNav />
            </aside>

            {/* Main content */}
            <div className="flex min-w-0 flex-1 flex-col">
                <DashboardHeader
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
                <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-auto outline-none">
                    <Outlet context={{ searchQuery, setSearchQuery }} />
                </main>
            </div>
        </div>
    );
}

export default RootLayout;
