import { Outlet } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Ship, 
  Calendar, 
  FileText, 
  MessageSquare, 
  User,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function MarinaLayout() {
  const location = useLocation();
  const { isGodModeUser, isPreviewMode } = useAuth();
  
  const showAdminNav = isGodModeUser && !isPreviewMode;

  const marinaNavItems = [
    { href: "/marina", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/marina/slips", icon: Ship, label: "Slips" },
    { href: "/marina/reservations", icon: Calendar, label: "Bookings" },
    { href: "/marina/leases", icon: FileText, label: "Leases" },
    { href: "/marina/messages", icon: MessageSquare, label: "Messages" },
    ...(showAdminNav ? [{ href: "/admin", icon: Settings, label: "Admin" }] : []),
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      
      {/* Marina-specific bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
          {marinaNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== "/marina" && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-colors min-w-[48px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} strokeWidth={isActive ? 2.5 : 2} />
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
