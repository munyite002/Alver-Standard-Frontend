import { BarChart3, CreditCard, Home, Settings, Users } from "lucide-react"
import { Link } from "react-router-dom"

export function DashboardNav() {
  return (
    <nav className="grid items-start px-2 text-sm font-medium">
      <Link
        to="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary transition-all hover:text-primary"
      >
        <Home className="h-4 w-4" />
        Dashboard
      </Link>
      <Link
        to="#"
        className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-accent-foreground transition-all"
      >
        <CreditCard className="h-4 w-4" />
        Transactions
      </Link>
      <Link
        to="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <Users className="h-4 w-4" />
        Customers
      </Link>
      <Link
        to="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <BarChart3 className="h-4 w-4" />
        Analytics
      </Link>
      <Link
        to="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </nav>
  )
}
