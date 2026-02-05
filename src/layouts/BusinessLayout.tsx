import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Ship, 
  Wrench,
  Fuel,
  Store,
  Users,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/contexts/BusinessContext";
import { Database } from "@/integrations/supabase/types";

type BusinessModule = Database["public"]["Enums"]["business_module"];

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  module?: BusinessModule;
}

const moduleNavItems: NavItem[] = [
  { href: "/business", icon: LayoutDashboard, label: "Command" },
  { href: "/business/slips", icon: Ship, label: "Slips", module: "slips" },
  { href: "/business/jobs", icon: Wrench, label: "Jobs", module: "service" },
  { href: "/business/fuel", icon: Fuel, label: "Fuel", module: "fuel" },
  { href: "/business/store", icon: Store, label: "Store", module: "store" },
];

const staticNavItems: NavItem[] = [
  { href: "/business/staff", icon: Users, label: "Staff" },
  { href: "/business/settings", icon: Settings, label: "Settings" },
];

export function BusinessLayout() {
  const location = useLocation();
  const { enabledModules, hasModuleAccess, isOwner, loading } = useBusiness();

  // Filter nav items based on enabled modules and permissions
  const visibleModuleItems = moduleNavItems.filter((item) => {
    if (!item.module) return true; // Always show non-module items like Command
    return enabledModules.includes(item.module) && hasModuleAccess(item.module, "read");
  });

  // Only owners can see staff management
  const visibleStaticItems = staticNavItems.filter((item) => {
    if (item.href === "/business/staff") return isOwner;
    return true;
  });

  const allNavItems = [
    ...visibleModuleItems,
    ...visibleStaticItems,
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      
      {/* Dynamic bottom navigation based on enabled modules */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto overflow-x-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== "/business" && location.pathname.startsWith(item.href));

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
                <Icon 
                  className={cn("w-5 h-5", isActive && "text-primary")} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
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
