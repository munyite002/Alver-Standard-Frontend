/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Menu, Search, Bell, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardNav } from "@/components/Dashboard/dashboard-nav";
import { UserNav } from "@/components/User/user-nav";
import { useLocation } from "react-router-dom";
// Routes where the global search bar is visible
const SEARCH_ROUTES = ["/", "/dashboard"];

export function DashboardHeader({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
}) {

  const location = useLocation();
  const pathname = location.pathname;
  const showSearch = SEARCH_ROUTES.includes(pathname);

  const today = new Date().toLocaleDateString("en-KE", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    year:    "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-100 bg-white/95 backdrop-blur-sm px-4 sm:px-6">

      {/* ── Mobile menu trigger ── */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 border-r border-gray-100">
          <DashboardNav />
        </SheetContent>
      </Sheet>

      {/* ── Search (dashboard routes only) ── */}
      <div className="flex-1 md:flex-none md:w-64">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search transactions…"
              value={searchQuery ?? ""}
              onChange={(e) => {
                // @ts-ignore
                setSearchQuery?.(e.target.value);
              }}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                         focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                         transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery?.("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Right cluster ── */}
      <div className="ml-auto flex items-center gap-2">

        {/* Date chip — desktop only */}
        <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
          <span className="text-xs font-medium text-gray-400">{today}</span>
        </div>

        {/* Notification bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* User nav — unchanged component */}
        <UserNav />
      </div>
    </header>
  );
}
