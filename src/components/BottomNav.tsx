import { Link, useLocation } from "react-router-dom";
import { Home, Ship, User, Building2, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

const BottomNav = () => {
  const location = useLocation();
  const { isAdmin, hasMarina, isProvider } = useUserRole();

  const baseNavItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/membership", icon: Ship, label: "Membership" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // Add marina management for admins with marina
  const navItems = isAdmin && hasMarina
    ? [
        ...baseNavItems.slice(0, 1),
        { href: "/marina", icon: Building2, label: "Marina" },
        { href: "/dry-stack", icon: Anchor, label: "Launch" },
        ...baseNavItems.slice(2),
      ]
    : isProvider
    ? [
        ...baseNavItems.slice(0, 1),
        { href: "/dry-stack", icon: Anchor, label: "Launch" },
        ...baseNavItems.slice(1),
      ]
    : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors touch-target min-w-[64px]",
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
  );
};

export default BottomNav;
