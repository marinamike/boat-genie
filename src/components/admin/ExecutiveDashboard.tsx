import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar,
  Shield,
  Wallet,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExecutiveStats {
  // Financials
  totalEscrowVolume: number;
  platformFeesEarned: number;
  pendingPayouts: number;
  // Activity
  activeReservations: number;
  liveWorkOrders: number;
  newUsers: {
    owners: number;
    providers: number;
    marinas: number;
    total: number;
  };
}

export function ExecutiveDashboard() {
  const [stats, setStats] = useState<ExecutiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch escrow data from work orders
        const { data: workOrdersData } = await supabase
          .from("work_orders")
          .select("escrow_amount, service_fee, lead_fee, escrow_status, status");

        const escrowVolume = (workOrdersData || []).reduce(
          (sum, wo) => sum + (Number(wo.escrow_amount) || 0), 0
        );

        const platformFees = (workOrdersData || [])
          .filter(wo => wo.status === "completed")
          .reduce((sum, wo) => sum + (Number(wo.service_fee) || 0) + (Number(wo.lead_fee) || 0), 0);

        const pendingPayouts = (workOrdersData || [])
          .filter(wo => wo.escrow_status === "pending_release" || wo.escrow_status === "approved")
          .reduce((sum, wo) => sum + (Number(wo.escrow_amount) || 0), 0);

        // Active work orders
        const liveWorkOrders = (workOrdersData || [])
          .filter(wo => ["pending", "assigned", "in_progress"].includes(wo.status)).length;

        // Active reservations
        const { count: activeReservations } = await supabase
          .from("marina_reservations")
          .select("*", { count: "exact", head: true })
          .in("status", ["approved", "checked_in"]);

        // New users in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentUsers } = await supabase
          .from("profiles")
          .select("id, created_at")
          .gte("created_at", thirtyDaysAgo.toISOString());

        const userIds = (recentUsers || []).map(u => u.id);
        
        let ownerCount = 0, providerCount = 0, marinaCount = 0;
        
        if (userIds.length > 0) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", userIds);

          (roles || []).forEach(r => {
            if (r.role === "boat_owner") ownerCount++;
            else if (r.role === "provider") providerCount++;
            else if (r.role === "admin") marinaCount++;
          });
        }

        setStats({
          totalEscrowVolume: escrowVolume,
          platformFeesEarned: platformFees,
          pendingPayouts: pendingPayouts,
          activeReservations: activeReservations || 0,
          liveWorkOrders,
          newUsers: {
            owners: ownerCount,
            providers: providerCount,
            marinas: marinaCount,
            total: (recentUsers || []).length,
          },
        });
      } catch (error) {
        console.error("Error fetching executive stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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

  if (!stats) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Financials Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <Badge variant="outline" className="text-green-600 border-green-500/30">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Escrow
              </Badge>
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(stats.totalEscrowVolume)}
            </p>
            <p className="text-sm text-muted-foreground">Total Escrow Volume</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-500/30">
                5% + 5%
              </Badge>
            </div>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {formatCurrency(stats.platformFeesEarned)}
            </p>
            <p className="text-sm text-muted-foreground">Platform Fees Earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                Pending
              </Badge>
            </div>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(stats.pendingPayouts)}
            </p>
            <p className="text-sm text-muted-foreground">Pending Payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Reservations</span>
            </div>
            <p className="text-2xl font-bold">{stats.activeReservations}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Work Orders</span>
            </div>
            <p className="text-2xl font-bold">{stats.liveWorkOrders}</p>
            <p className="text-xs text-muted-foreground">Live</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">New Users (30 days)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-bold">{stats.newUsers.owners}</p>
                <p className="text-xs text-muted-foreground">Owners</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold">{stats.newUsers.providers}</p>
                <p className="text-xs text-muted-foreground">Providers</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold">{stats.newUsers.marinas}</p>
                <p className="text-xs text-muted-foreground">Marinas</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{stats.newUsers.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
