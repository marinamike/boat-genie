import { Outlet } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Ship, 
  Users, 
  Settings, 
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function MarinaLayout() {
  const location = useLocation();
  const { isGodModeUser, isPreviewMode } = useAuth();
  
  const showAdminNav = isGodModeUser && !isPreviewMode;

  // Marina Navigation per spec: Command Center, Slip Grid, On-Site Providers, Profile Settings
  const marinaNavItems = [
    { href: "/marina", icon: LayoutDashboard, label: "Command" },
    { href: "/marina/slips", icon: Ship, label: "Slips" },
    { href: "/marina/reservations", icon: Users, label: "On-Site" },
    { href: "/marina/settings", icon: Settings, label: "Settings" },
    ...(showAdminNav ? [{ href: "/admin", icon: Crown, label: "God Mode" }] : []),
  ];

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      
      {/* Marina-specific bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
          {marinaNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== "/marina" && item.href !== "/admin" && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-colors min-w-[48px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                  item.href === "/admin" && "text-amber-500 hover:text-amber-600"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary", item.href === "/admin" && "text-amber-500")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[10px] mt-1 font-medium", isActive && "font-semibold")}>
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
