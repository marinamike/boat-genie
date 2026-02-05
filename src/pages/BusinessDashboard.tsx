import { useBusiness } from "@/contexts/BusinessContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, Wrench, Fuel, Store, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";

type BusinessModule = Database["public"]["Enums"]["business_module"];

const moduleConfig: Record<BusinessModule, { label: string; icon: React.ElementType; href: string; color: string }> = {
  slips: { label: "Slip Management", icon: Ship, href: "/business/slips", color: "text-blue-500" },
  service: { label: "Service Yard", icon: Wrench, href: "/business/jobs", color: "text-orange-500" },
  fuel: { label: "Fuel Dock", icon: Fuel, href: "/business/fuel", color: "text-green-500" },
  ship_store: { label: "Ship Store", icon: Store, href: "/business/store", color: "text-purple-500" },
};

export default function BusinessDashboard() {
  const { business, enabledModules, isOwner, isStaff, loading } = useBusiness();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container max-w-lg mx-auto p-4 pt-8">
        <Card>
          <CardHeader className="text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No Business Found</CardTitle>
            <CardDescription>
              You don't have a business profile yet. Create one to get started with managing your marina or service business.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              to="/register-marina"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Register Business
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
