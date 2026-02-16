import {
  CreditCard, Settings, Gauge, Logs, FileBarChart,
  FileQuestionIcon, Users, Zap, ChevronRight, ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  { to: "/users", label: "Users", icon: Users, match: ["/users"] },
  { to: "/tickets", label: "Tickets", icon: FileQuestionIcon, match: ["/tickets"] },
];

// ─── Single nav link ──────────────────────────────────────────────────────────
function NavLink({ item, pathname }: { item: typeof CORE_NAV[0]; pathname: string }) {
  const isActive = item.match.includes(pathname);
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      )}
    >
      {/* Left accent bar — visible on hover only when not active */}
      {!isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r h-0 group-hover:h-4 bg-blue-400 transition-all duration-200" />
      )}

      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0 transition-colors",
          isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      <span className="leading-none">{item.label}</span>

      {/* Active trailing indicator */}
      {isActive && (
        <ChevronRight className="w-3 h-3 ml-auto text-blue-200" />
      )}
    </Link>
  );
}

// ─── DashboardNav ─────────────────────────────────────────────────────────────
export function DashboardNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const { user } = useGlobalContext();
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex flex-col h-full">

      {/* Brand / Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center p-1">
            <img src="/icon.png" alt="Alver Logo" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">Alver Power Portal</p>
            <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

        {/* Core section */}
        <div>
          <p className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-gray-300">
            Core
          </p>
          <div className="space-y-0.5">
            {CORE_NAV.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Admin</p>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-100">
                <ShieldCheck className="w-2.5 h-2.5 text-amber-500" />
                <span className="text-amber-600 font-bold" style={{ fontSize: "9px", lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Only
                </span>
              </div>
            </div>
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
        <div className="px-3 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-xs font-bold text-white">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 leading-none truncate">
                {user?.name || user?.email || "User"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role || "member"}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}