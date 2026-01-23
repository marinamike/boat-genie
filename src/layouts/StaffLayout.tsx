import { Outlet } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { ClipboardCheck, Map, UserCheck, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function StaffLayout() {
  const location = useLocation();
  const { role } = useAuth();
  
  const isAdmin = role === "admin";

  // Staff/Admin navigation - operations focused
  const staffNavItems = [
    { href: "/operations", icon: ClipboardCheck, label: "QC Queue" },
    { href: "/dock", icon: Map, label: "Dock View" },
    ...(isAdmin ? [{ href: "/admin", icon: UserCheck, label: "Approvals" }] : []),
    ...(isAdmin ? [{ href: "/marina", icon: Building2, label: "Marina" }] : []),
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      
      {/* Staff/Admin-specific bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {staffNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[56px]",
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
