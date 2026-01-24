import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Wrench, Loader2, Lock, LayoutDashboard, Briefcase, Plus } from "lucide-react";
import { ProfileManagement } from "@/components/provider/ProfileManagement";
import { ProviderMetricsHeader } from "@/components/provider/ProviderMetricsHeader";
import { DailySchedule } from "@/components/provider/DailySchedule";
import { LeadStream } from "@/components/provider/LeadStream";
import { EarningsTab } from "@/components/provider/EarningsTab";
import { CreateWorkOrderDialog } from "@/components/provider/CreateWorkOrderDialog";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ProviderRatingDisplay } from "@/components/reviews/ProviderRatingDisplay";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderOnboarding } from "@/hooks/useProviderOnboarding";
import { useProviderMetrics } from "@/hooks/useProviderMetrics";
import { useJobBoard } from "@/hooks/useJobBoard";
// BottomNav removed - handled by ProviderLayout
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

const ProviderDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, toggleAvailability } = useProviderProfile();
  const { 
    profile: onboardingProfile, 
    canAccessJobBoard, 
  } = useProviderOnboarding();
  const {
    metrics,
    activeWorkOrders,
    completedJobs,
    providerServices,
    notifyArrival,
    updateWorkOrderStatus,
    refetch: refetchMetrics,
  } = useProviderMetrics();
  const {
    availableWishes,
    submittingQuote,
    submitQuote,
  } = useJobBoard();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Check if user has provider role
      const { data: providerData } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "provider",
      });

      if (!providerData) {
        navigate("/dashboard");
        return;
      }

      setIsProvider(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const isActive = onboardingProfile?.onboarding_status === "active";
  const canViewJobs = canAccessJobBoard();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Provider Portal</h1>
                <p className="text-sm text-primary-foreground/80">
                  {profile?.business_name || "Service Provider"}
                </p>
              </div>
            </div>
          </div>
          
          {profile && isActive && (
            <div className="flex items-center gap-2">
              <NotificationBell className="text-primary-foreground" />
              <Badge 
                variant={profile.is_available ? "default" : "secondary"}
                className={profile.is_available ? "bg-green-500" : ""}
              >
                {profile.is_available ? "Available" : "Unavailable"}
              </Badge>
              <Switch
                checked={profile.is_available}
                onCheckedChange={toggleAvailability}
              />
            </div>
          )}
        </div>
      </header>

      <main className="px-4 py-6">
            {/* Metrics Header and Create Job Button - Only show when active */}
            {canViewJobs && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <ProviderMetricsHeader
                    activeJobs={metrics.activeJobsCount}
                    pendingQuotes={metrics.pendingQuotesCount}
                    totalEarnings={metrics.totalEarnings}
                  />
                </div>
                <Button 
                  onClick={() => setCreateJobDialogOpen(true)}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Job
                </Button>
              </div>
            )}

            <Tabs 
              value={searchParams.get("tab") || "schedule"} 
              onValueChange={(value) => setSearchParams({ tab: value })}
              className="space-y-6"
            >
              {(searchParams.get("tab") === "dashboard" || searchParams.get("tab") === "schedule" || searchParams.get("tab") === "leads" || !searchParams.get("tab")) && (
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="schedule" 
                    className="flex items-center gap-1"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Schedule</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="leads" 
                    className="flex items-center gap-1"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Leads</span>
                  </TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="schedule">
                {!canViewJobs ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Dashboard Locked</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Complete your setup checklist and get approved by an admin to access your operations dashboard.
                      </p>
                      <Button onClick={() => setSearchParams({ tab: "setup" })}>
                        Complete Setup
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <DailySchedule 
                    workOrders={activeWorkOrders}
                    onNotifyArrival={notifyArrival}
                    onUpdateStatus={updateWorkOrderStatus}
                    onRefresh={refetchMetrics}
                  />
                )}
              </TabsContent>

              <TabsContent value="leads">
                {!canViewJobs ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Leads Locked</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Complete your setup checklist to view and quote on leads.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <LeadStream 
                    wishes={availableWishes}
                    providerServices={providerServices}
                    onSubmitQuote={submitQuote}
                    submitting={submittingQuote}
                  />
                )}
              </TabsContent>

              <TabsContent value="setup">
                <ProfileManagement />
              </TabsContent>

              <TabsContent value="earnings">
                {!canViewJobs ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Earnings Locked</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        Complete your setup to start earning.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <EarningsTab 
                    completedJobs={completedJobs}
                    totalEarnings={metrics.totalEarnings}
                  />
                )}
              </TabsContent>

            </Tabs>
      </main>

      <CreateWorkOrderDialog
        open={createJobDialogOpen}
        onOpenChange={setCreateJobDialogOpen}
        onSuccess={refetchMetrics}
      />

      {/* BottomNav handled by ProviderLayout */}
    </div>
  );
};

export default ProviderDashboard;
