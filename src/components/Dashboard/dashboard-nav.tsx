import { CreditCard, Settings, Gauge } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export function DashboardNav() {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <nav className="grid items-start px-2 text-sm font-medium">
      <Link
        to="/"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
          pathname === "/" || pathname === "/dashboard"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-primary"
        )}
      >
        <CreditCard className="h-4 w-4" />
        Transactions
      </Link>
      <Link
        to="/meters"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
          pathname === "/meters"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-primary"
        )}
      >
        <Gauge className="h-4 w-4" />
        Meters
      </Link>
      <Link
        to="/settings"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
          pathname === "/settings"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-primary"
        )}
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </nav>
  )
}
