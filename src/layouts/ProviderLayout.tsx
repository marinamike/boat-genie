import { Outlet } from "react-router-dom";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { LayoutDashboard, Briefcase, ClipboardList, DollarSign, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Provider Navigation per spec: Dashboard, Service Menu, Active Jobs, Payouts
const providerNavItems = [
  { href: "/provider", icon: LayoutDashboard, label: "Dashboard", tab: "dashboard" },
  { href: "/provider", icon: ClipboardList, label: "Services", tab: "setup" },
  { href: "/provider", icon: Briefcase, label: "Jobs", tab: "schedule" },
  { href: "/provider", icon: DollarSign, label: "Payouts", tab: "earnings" },
];

export function ProviderLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      
      {/* Provider-specific bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {providerNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.tab 
              ? location.pathname === "/provider" && currentTab === item.tab
              : location.pathname === item.href;
            
            const linkHref = item.tab ? `${item.href}?tab=${item.tab}` : item.href;

            return (
              <Link
                key={`${item.href}-${idx}`}
                to={linkHref}
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
