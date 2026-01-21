import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Ship, User, Building2, Anchor, Wrench, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [isMarinaStaff, setIsMarinaStaff] = useState(false);
  const [hasMarina, setHasMarina] = useState(false);

  useEffect(() => {
    const checkRoles = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Check if admin
        const { data: adminData } = await supabase.rpc("is_admin");
        setIsAdmin(!!adminData);

        // Check if provider
        const { data: providerData } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "provider",
        });
        setIsProvider(!!providerData);

        // Check if marina staff
        const { data: staffData } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "marina_staff",
        });
        setIsMarinaStaff(!!staffData);

        // Check if has marina (for admin)
        if (adminData) {
          const { data: marinaData } = await supabase
            .from("marinas")
            .select("id")
            .eq("manager_id", session.user.id)
            .maybeSingle();
          setHasMarina(!!marinaData);
        }
      } catch (error) {
        console.error("Error checking roles:", error);
      }
    };

    checkRoles();
  }, []);

  const baseNavItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/membership", icon: Ship, label: "Membership" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // Role-based navigation
  let navItems = baseNavItems;

  if (isAdmin && hasMarina) {
    // Marina Manager with marina
    navItems = [
      { href: "/dashboard", icon: Home, label: "Home" },
      { href: "/marina", icon: Building2, label: "Marina" },
      { href: "/dry-stack", icon: Anchor, label: "Launch" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  } else if (isProvider) {
    // Service Provider
    navItems = [
      { href: "/dashboard", icon: Home, label: "Home" },
      { href: "/provider", icon: Wrench, label: "Jobs" },
      { href: "/dry-stack", icon: Anchor, label: "Launch" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  } else if (isMarinaStaff) {
    // Marina Staff - mobile-first dock view
    navItems = [
      { href: "/dock", icon: HardHat, label: "Dock" },
      { href: "/dry-stack", icon: Anchor, label: "Launch" },
      { href: "/profile", icon: User, label: "Profile" },
    ];
  }

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
