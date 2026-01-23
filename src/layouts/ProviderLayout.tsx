import { Outlet } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, ListOrdered, DollarSign, User } from "lucide-react";
import { cn } from "@/lib/utils";

const providerNavItems = [
  { href: "/provider", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/provider", icon: Briefcase, label: "My Jobs", tab: "schedule" },
  { href: "/provider", icon: ListOrdered, label: "Services", tab: "profile" },
  { href: "/provider", icon: DollarSign, label: "Payouts", tab: "earnings" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function ProviderLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      
      {/* Provider-specific bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {providerNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href && !item.tab;

            return (
              <Link
                key={`${item.href}-${idx}`}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-xs mt-1 font-medium", isActive && "font-semibold")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
