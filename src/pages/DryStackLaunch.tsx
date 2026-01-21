import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Anchor, ArrowLeft, Warehouse, Users, Settings } from "lucide-react";
import { useLaunchQueue } from "@/hooks/useLaunchQueue";
import { useLaunchCard } from "@/hooks/useLaunchCard";
import { PublicQueueView } from "@/components/launch/PublicQueueView";
import { QueueManager } from "@/components/launch/QueueManager";
import { LaunchCardForm } from "@/components/launch/LaunchCardForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BottomNav from "@/components/BottomNav";
import type { LaunchQueueItem } from "@/hooks/useLaunchQueue";

const DryStackLaunch = () => {
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [launchCardItem, setLaunchCardItem] = useState<LaunchQueueItem | null>(null);
  const navigate = useNavigate();

  const {
    queue, publicQueue, settings, staleBoats,
    updateStatus, flagAsStale, chargeReRackFee, updateLaunchMode,
  } = useLaunchQueue();

  const { submitLaunchCard, loading: cardLoading } = useLaunchCard();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          navigate("/login");
          return;
        }

        const { data: admin, error: adminError } = await supabase.rpc("is_admin");
        if (adminError) throw adminError;

        const { data: provider, error: providerError } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "provider",
        });
        if (providerError) throw providerError;

        setIsStaff(!!admin || !!provider);
      } catch (e) {
        console.error("DryStackLaunch auth check failed:", e);
        // Fail open to non-staff view rather than trapping user on spinner.
        setIsStaff(false);
      } finally {
        setLoading(false);
      }
    };

    const timeout = window.setTimeout(() => {
      // Safety: never trap the UI on the spinner.
      setLoading(false);
    }, 4000);

    checkAuth();
    return () => window.clearTimeout(timeout);
  }, [navigate]);

  const handleChargeReRackFee = async (item: LaunchQueueItem) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return chargeReRackFee(item, user.id);
    return false;
  };

  const handleLaunchCardSubmit = async (data: Parameters<typeof submitLaunchCard>[3]) => {
    if (!launchCardItem) return;
    await submitLaunchCard(launchCardItem.id, launchCardItem.boat_id, "haul_out", data);
    setLaunchCardItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Anchor className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Dry Stack & Launch</h1>
              <p className="text-sm text-primary-foreground/80">
                {settings?.launch_mode === "live_queue" ? "Live Queue (FCFS)" : "Scheduled Windows"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Tabs defaultValue={isStaff ? "manager" : "public"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="public"><Users className="w-4 h-4 mr-1.5" />Public Queue</TabsTrigger>
            {isStaff && <TabsTrigger value="manager"><Settings className="w-4 h-4 mr-1.5" />Manager</TabsTrigger>}
          </TabsList>

          <TabsContent value="public" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Running List</CardTitle></CardHeader>
              <CardContent><PublicQueueView queue={publicQueue} /></CardContent>
            </Card>
          </TabsContent>

          {isStaff && (
            <TabsContent value="manager" className="mt-4 space-y-4">
              {/* Launch Mode Toggle */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold">Launch Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        {settings?.launch_mode === "live_queue" ? "First-Come First-Served" : "Scheduled Time Windows"}
                      </p>
                    </div>
                    <Switch
                      checked={settings?.launch_mode === "scheduled_windows"}
                      onCheckedChange={(checked) => updateLaunchMode(checked ? "scheduled_windows" : "live_queue")}
                    />
                  </div>
                </CardContent>
              </Card>

              <QueueManager
                queue={queue}
                staleBoats={staleBoats}
                reRackFee={settings?.re_rack_fee || 50}
                onUpdateStatus={updateStatus}
                onFlagStale={flagAsStale}
                onChargeReRackFee={handleChargeReRackFee}
                onOpenLaunchCard={setLaunchCardItem}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Launch Card Dialog */}
      <Dialog open={!!launchCardItem} onOpenChange={() => setLaunchCardItem(null)}>
        <DialogContent className="max-w-md p-0">
          {launchCardItem && (
            <LaunchCardForm
              boatName={launchCardItem.boat?.name || "Unknown Boat"}
              operationType="haul_out"
              onSubmit={handleLaunchCardSubmit}
              loading={cardLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default DryStackLaunch;
