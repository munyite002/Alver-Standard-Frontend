import { CreditCard, Settings, Gauge, Logs, FileBarChart, FileQuestionIcon, Users } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
// @ts-ignore
import { useGlobalContext } from "../../../context/GlobalContext";

export function DashboardNav() {
  const location = useLocation()
  const pathname = location.pathname

  const { user } = useGlobalContext();
  const isAdmin = user?.role === "admin";

  console.log("DashboardNav rendering, current pathname:", pathname, "Role:", user?.role);

  return (
    <nav className="space-y-2">
      <Link
        to="/"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          pathname === "/" || pathname === "/dashboard"
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <CreditCard className={cn("h-4 w-4", pathname === "/" || pathname === "/dashboard" ? "text-blue-600" : "text-gray-500")} />
        Dashboard
      </Link>
      <Link
        to="/meters"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          pathname === "/meters"
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <Gauge className={cn("h-4 w-4", pathname === "/meters" ? "text-blue-600" : "text-gray-500")} />
        Meters
      </Link>
      <Link
        to="/settings"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          pathname === "/settings"
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <Settings className={cn("h-4 w-4", pathname === "/settings" ? "text-blue-600" : "text-gray-500")} />
        Settings
      </Link>
      <Link
        to="/reports"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          pathname === "/reports"
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <FileBarChart className={cn("h-4 w-4", pathname === "/reports" ? "text-blue-600" : "text-gray-500")} />
        Reports
      </Link>

      {isAdmin && (
        <>
          <Link
            to="/logs"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              pathname === "/logs"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Logs className={cn("h-4 w-4", pathname === "/logs" ? "text-blue-600" : "text-gray-500")} />
            Logs
          </Link>
          <Link
            to="/accounts"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              pathname === "/accounts"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Users className={cn("h-4 w-4", pathname === "/accounts" ? "text-blue-600" : "text-gray-500")} />
            Accounts
          </Link>
          <Link
            to="/users"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              pathname === "/users"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Users className={cn("h-4 w-4", pathname === "/users" ? "text-blue-600" : "text-gray-500")} />
            Users
          </Link>
          <Link
            to="/tickets"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              pathname === "/tickets"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <FileQuestionIcon className={cn("h-4 w-4", pathname === "/tickets" ? "text-blue-600" : "text-gray-500")} />
            Tickets
          </Link>
        </>
      )}
    </nav>
  )
}