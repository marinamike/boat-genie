import { Outlet } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { Home, Book, Sparkles, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ownerNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/boat-log", icon: Book, label: "Boat Log" },
  { href: "/dashboard", icon: Sparkles, label: "Wish", action: "wish" },
  { href: "/membership", icon: Wallet, label: "Wallet" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function OwnerLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      
      {/* Owner-specific bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {ownerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href && item.action !== "wish";

            return (
              <Link
                key={`${item.href}-${item.label}`}
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
