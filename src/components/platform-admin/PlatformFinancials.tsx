import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Building2, Fuel, Wrench, DollarSign, TrendingUp, Users } from "lucide-react";

interface PlatformMetrics {
  totalActiveMarinas: number;
  totalFuelSales: number;
  serviceJobsThisMonth: number;
  totalUsers: number;
  totalBusinesses: number;
  totalBoats: number;
}

export function PlatformFinancials() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get active marinas (verified businesses with slips module)
        const { count: marinaCount } = await supabase
          .from("businesses")
          .select("*", { count: "exact", head: true })
          .eq("is_verified", true)
          .contains("enabled_modules", ["slips"]);

        // Get total fuel sales (all time)
        const { data: fuelData } = await supabase
          .from("fuel_transactions")
          .select("total_amount");

        const totalFuel = fuelData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

        // Get service jobs this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: jobsCount } = await supabase
          .from("work_orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        // Get total users
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Get total businesses
        const { count: businessCount } = await supabase
          .from("businesses")
          .select("*", { count: "exact", head: true });

        // Get total boats
        const { count: boatCount } = await supabase
          .from("boats")
          .select("*", { count: "exact", head: true });

        setMetrics({
          totalActiveMarinas: marinaCount || 0,
          totalFuelSales: totalFuel,
          serviceJobsThisMonth: jobsCount || 0,
          totalUsers: userCount || 0,
          totalBusinesses: businessCount || 0,
          totalBoats: boatCount || 0,
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const metricCards = [
    {
      title: "Active Marinas",
      value: metrics?.totalActiveMarinas || 0,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Fuel Sales",
      value: `$${(metrics?.totalFuelSales || 0).toLocaleString()}`,
      icon: Fuel,
      color: "text-green-600",
      bgColor: "bg-green-100",
      subtitle: "All Time",
    },
    {
      title: "Service Jobs",
      value: metrics?.serviceJobsThisMonth || 0,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      subtitle: "This Month",
    },
    {
      title: "Total Users",
      value: metrics?.totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Businesses",
      value: metrics?.totalBusinesses || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Registered Boats",
      value: metrics?.totalBoats || 0,
      icon: DollarSign,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Platform Financials
          </CardTitle>
          <CardDescription>
            Overview of platform-wide metrics
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.title}
                    {card.subtitle && <span className="block text-[10px]">{card.subtitle}</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
