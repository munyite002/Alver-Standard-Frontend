/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardNav } from "@/components/Dashboard/dashboard-nav";
import { UserNav } from "@/components/User/user-nav";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/lib/theme";
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
  const { mode, toggleMode } = useTheme();
  const toLight = mode === "dark";

  const today = new Date().toLocaleDateString("en-KE", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    year:    "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:px-6">

      {/* ── Mobile menu trigger ── */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="av-focus flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-accent hover:text-foreground md:hidden">
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Toggle Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-r border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Main menu</SheetTitle>
          <DashboardNav />
        </SheetContent>
      </Sheet>

      {/* ── Search (dashboard routes only) ── */}
      <div className="min-w-0 flex-1 md:w-72 md:flex-none">
        {showSearch && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              aria-label="Search transactions"
              placeholder="Search transactions…"
              value={searchQuery ?? ""}
              onChange={(e) => {
                // @ts-ignore
                setSearchQuery?.(e.target.value);
              }}
              className="h-10 w-full rounded-lg border border-input bg-card pr-9 pl-9 text-sm text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery?.("")}
                aria-label="Clear search"
                className="av-focus absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Right cluster ── */}
      <div className="ml-auto flex flex-shrink-0 items-center gap-1 sm:gap-2">

        {/* Date: desktop only */}
        <span className="av-label hidden px-2 text-[10.5px] text-muted-foreground lg:block">{today}</span>

        <button
          type="button"
          onClick={(e) => toggleMode(e.currentTarget)}
          aria-label={toLight ? "Switch to light theme" : "Switch to dark theme"}
          className="av-focus flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-accent hover:text-foreground"
        >
          {toLight ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
        </button>

        <div className="mx-1 h-5 w-px bg-border" />

        <UserNav />
      </div>
    </header>
  );
}
