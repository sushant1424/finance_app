import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, CreditCard, Tags, PieChart, Target, Brain, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Budgets", href: "/budgets", icon: PieChart },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Insights (ML)", href: "/insights", icon: Brain },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
          <Wallet className="h-6 w-6" /> FinTrack
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto py-4">
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <Link
            to="/settings"
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
              location.pathname === "/settings"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            )}
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400" />
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
