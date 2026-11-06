import {
  Settings, Gauge, Logs, FileBarChart,
  FileQuestionIcon, Users, UserCog,
  LayoutDashboard, ListOrdered, MessageSquareText
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
// @ts-ignore
import { useGlobalContext } from "../../../context/GlobalContext";

// ─── Nav definitions ──────────────────────────────────────────────────────────
const CORE_NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, match: ["/", "/dashboard"] },
  { to: "/meters", label: "Meters", icon: Gauge, match: ["/meters"] },
  { to: "/reports", label: "Reports", icon: FileBarChart, match: ["/reports"] },
  { to: "/settings", label: "Settings", icon: Settings, match: ["/settings"] },
];

const ADMIN_NAV = [
  { to: "/logs", label: "Logs", icon: Logs, match: ["/logs"] },
  { to: "/accounts", label: "Accounts", icon: Users, match: ["/accounts"] },
  { to: "/users", label: "Users", icon: UserCog, match: ["/users"] },
  { to: "/tickets", label: "Tickets", icon: FileQuestionIcon, match: ["/tickets"] },
  { to: "/queue", label: "Payment Queue", icon: ListOrdered, match: ["/queue"] },
  { to: "/sms-delivery-reports", label: "SMS Delivery Reports", icon: MessageSquareText, match: ["/sms-delivery-reports"] },
];

// ─── Single nav link ──────────────────────────────────────────────────────────
function NavLink({ item, pathname }: { item: typeof CORE_NAV[0]; pathname: string }) {
  const isActive = item.match.includes(pathname);
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "av-focus group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-text-secondary hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {/* Red marks where you are: nothing else in the sidebar uses it */}
      {isActive && (
        <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r bg-signal" aria-hidden />
      )}

      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-colors",
          isActive ? "text-signal" : "text-muted-foreground group-hover:text-sidebar-foreground"
        )}
        aria-hidden
      />
      <span className="truncate leading-none">{item.label}</span>
    </Link>
  );
}

// ─── DashboardNav ─────────────────────────────────────────────────────────────
export function DashboardNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { mode } = useTheme();

  const { user } = useGlobalContext();
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex h-full flex-col">

      {/* Brand / Logo */}
      <div className="flex h-16 flex-shrink-0 items-center border-b border-sidebar-border px-5">
        <img
          src={mode === "dark" ? "/logo-dark.png" : "/logo-light.png"}
          alt="Alver Power Systems"
          className="h-9 w-auto"
        />
      </div>

      {/* Nav items */}
      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">

        {/* Core section */}
        <div>
          <p className="av-label mb-2 px-3 text-[10.5px] text-muted-foreground">Core</p>
          <div className="space-y-0.5">
            {CORE_NAV.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div>
            <p className="av-label mb-2 px-3 text-[10.5px] text-muted-foreground">Admin</p>
            <div className="space-y-0.5">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.to} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      {user && (
        <div className="flex flex-shrink-0 items-center gap-3 border-t border-sidebar-border px-5 py-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
            <span className="text-xs font-semibold text-sidebar-accent-foreground">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] leading-none font-medium text-sidebar-foreground">
              {user?.name || user?.email || "User"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground capitalize">{user?.role || "member"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
