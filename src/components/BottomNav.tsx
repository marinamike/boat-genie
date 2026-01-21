import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Ship, User, Building2, Anchor, Wrench, HardHat, ClipboardCheck, Book } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

const BottomNav = () => {
  const location = useLocation();
  const { isAdmin, isProvider, isMarinaStaff, hasMarina, loading } = useUserRole();
  const [hydrated, setHydrated] = useState(false);

  // Avoid a brief "base nav" flash while role is loading.
  useEffect(() => {
    if (!loading) setHydrated(true);
  }, [loading]);

  // Boat Owner navigation - includes Boat Log
  const baseNavItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/boat-log", icon: Book, label: "Boat Log" },
    { href: "/membership", icon: Ship, label: "Membership" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // Role-based navigation
  let navItems = baseNavItems;

  if (isAdmin && hasMarina) {
    // Marina Manager with marina - includes Operations
    navItems = [
      { href: "/dashboard", icon: Home, label: "Home" },
      { href: "/marina", icon: Building2, label: "Marina" },
      { href: "/operations", icon: ClipboardCheck, label: "Ops" },
      { href: "/dry-stack", icon: Anchor, label: "Launch" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  } else if (isAdmin) {
    // Admin without marina - still has Operations access
    navItems = [
      { href: "/dashboard", icon: Home, label: "Home" },
      { href: "/operations", icon: ClipboardCheck, label: "Ops" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  } else if (isProvider) {
    // Service Provider
    navItems = [
      { href: "/dashboard", icon: Home, label: "Home" },
      { href: "/provider", icon: Wrench, label: "Jobs" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  } else if (isMarinaStaff) {
    // Marina Staff - mobile-first dock view with Operations access
    navItems = [
      { href: "/dock", icon: HardHat, label: "Dock" },
      { href: "/operations", icon: ClipboardCheck, label: "Ops" },
      { href: "/dry-stack", icon: Anchor, label: "Launch" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {!hydrated ? (
          // Keep layout stable while role loads.
          <div className="h-10" />
        ) : (
          <>
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
          </>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
