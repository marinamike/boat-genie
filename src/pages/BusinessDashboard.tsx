import { useBusiness } from "@/contexts/BusinessContext";
import { useStoreInventory } from "@/hooks/useStoreInventory";
import { useFuelManagement } from "@/hooks/useFuelManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, Wrench, Fuel, Store, Building2, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import { LowStockAlerts } from "@/components/store/LowStockAlerts";

type BusinessModule = Database["public"]["Enums"]["business_module"];
const PLATFORM_ADMIN_EMAIL = "info@marinamike.com";

const shipStoreConfig = { label: "Ship Store", icon: Store, href: "/business/store", color: "text-purple-500" };

const moduleConfig: Record<BusinessModule, { label: string; icon: React.ElementType; href: string; color: string }> = {
  slips: { label: "Slip Management", icon: Ship, href: "/business/slips", color: "text-blue-500" },
  service: { label: "Service Yard", icon: Wrench, href: "/business/jobs", color: "text-orange-500" },
  fuel: { label: "Fuel Dock", icon: Fuel, href: "/business/fuel", color: "text-green-500" },
  ship_store: shipStoreConfig,
  store: shipStoreConfig,
};

export default function BusinessDashboard() {
  const { business, enabledModules, isOwner, isStaff, loading } = useBusiness();
  const { lowStockItems } = useStoreInventory();
  const { tanks } = useFuelManagement();
  const { user } = useAuth();

  const isPlatformAdmin = user?.email === PLATFORM_ADMIN_EMAIL;

  // Get low fuel tanks
  const lowFuelTanks = tanks.filter(t => 
    t.is_active && t.current_volume_gallons <= t.low_level_threshold_gallons
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Platform admin sees admin overview instead of setup prompt
  if (!business && isPlatformAdmin) {
    return (
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Admin View</h1>
            <p className="text-muted-foreground">No business profile attached</p>
          </div>
          <Badge variant="default" className="flex items-center gap-1 bg-primary text-primary-foreground">
            <Shield className="w-3 h-3" />
            Platform Admin
          </Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Business Module Overview</CardTitle>
            <CardDescription>
              You're viewing the Business dashboard as a platform admin. Create or select a business profile to manage operations, or use the Platform Admin suite for global oversight.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link
              to="/business/settings"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Business Profile
            </Link>
            <Link
              to="/platform-admin"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Go to Platform Admin
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container max-w-lg mx-auto p-4 pt-8">
        <Card>
          <CardHeader className="text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Welcome to Business</CardTitle>
            <CardDescription>
              Set up your business profile to start managing your marina, service yard, or both. Configure your modules and settings to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              to="/business/settings"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Set Up Business
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{business.business_name}</h1>
          <p className="text-muted-foreground">
            {isOwner ? "Owner" : "Staff"} Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          {business.is_verified ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Pending Verification
            </Badge>
          )}
        </div>
      </div>

      {/* Active Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Active Modules</h2>
        {enabledModules.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No modules enabled yet.{" "}
              {isOwner && (
                <Link to="/business/settings" className="text-primary hover:underline">
                  Enable modules in settings
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {enabledModules.map((module) => {
              const config = moduleConfig[module];
              const Icon = config.icon;

              return (
                <Link key={module} to={config.href}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`p-3 rounded-lg bg-muted ${config.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium">{config.label}</p>
                        <p className="text-sm text-muted-foreground">Manage →</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      {(lowStockItems.length > 0 || lowFuelTanks.length > 0) && (
        <LowStockAlerts 
          lowStockItems={lowStockItems} 
          lowFuelTanks={lowFuelTanks.map(t => ({
            id: t.id,
            tank_name: t.tank_name,
            fuel_type: t.fuel_type,
            current_volume_gallons: t.current_volume_gallons,
            low_level_threshold_gallons: t.low_level_threshold_gallons,
          }))}
        />
      )}

      {/* Quick Stats Placeholder */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Today's Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Active Bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Open Jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Revenue Today</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
