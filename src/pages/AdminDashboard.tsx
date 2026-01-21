import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Crown, TrendingUp, UserCheck, Briefcase, Users, Shield, AlertTriangle } from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { MarketplaceHealthCard } from "@/components/admin/MarketplaceHealthCard";
import { ProviderApprovalQueue } from "@/components/admin/ProviderApprovalQueue";
import { GlobalWorkOrderFeed } from "@/components/admin/GlobalWorkOrderFeed";
import { UserManagement } from "@/components/admin/UserManagement";
import { ViewAsUserPanel } from "@/components/admin/ViewAsUserPanel";
import { InsuranceExpiryAlerts } from "@/components/admin/InsuranceExpiryAlerts";
import { DisputedJobsPanel } from "@/components/admin/DisputedJobsPanel";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    isGodMode,
    loading,
    marketplaceHealth,
    users,
    workOrders,
    disputedOrders,
    viewAsUserId,
    setViewAsUserId,
    updateUserRole,
    refetch,
  } = useAdminDashboard();

  useEffect(() => {
    if (!loading && !isGodMode) {
      navigate("/dashboard");
    }
  }, [loading, isGodMode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isGodMode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8" />
            <h1 className="text-2xl font-bold">God Mode</h1>
          </div>
          <p className="text-white/80">
            Full platform oversight and control
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Access Warning */}
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
          <Shield className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700 dark:text-yellow-500">
            You have elevated privileges. All actions are logged.
          </span>
        </div>

        {/* Insurance Expiry Alerts - Always visible at top */}
        <InsuranceExpiryAlerts />

        {/* View As User Panel */}
        <ViewAsUserPanel
          users={users}
          viewAsUserId={viewAsUserId}
          onViewAsUser={setViewAsUserId}
        />

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-2 relative">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Disputes</span>
              {disputedOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {disputedOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Providers</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <MarketplaceHealthCard health={marketplaceHealth} />
          </TabsContent>

          <TabsContent value="disputes" className="space-y-6">
            <DisputedJobsPanel disputes={disputedOrders} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <ProviderApprovalQueue />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <GlobalWorkOrderFeed workOrders={workOrders} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement users={users} onUpdateRole={updateUserRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
