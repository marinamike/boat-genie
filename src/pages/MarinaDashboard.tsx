import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Anchor, MessageSquare, Settings, Loader2 } from "lucide-react";

import { PendingReservationsCard } from "@/components/marina/dashboard/PendingReservationsCard";
import { ArrivalsDepaturesCard } from "@/components/marina/dashboard/ArrivalsDepatures";
import { ActiveProvidersCard } from "@/components/marina/dashboard/ActiveProvidersCard";
import { LeaseVaultCard } from "@/components/marina/dashboard/LeaseVaultCard";
import { LiveDockList } from "@/components/marina/LiveDockList";
import { MarinaChatSheet } from "@/components/marina/dashboard/MarinaChatSheet";
import { useMarinaReservations, MarinaReservation } from "@/hooks/useMarinaReservations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarineLoadingScreen } from "@/components/ui/marine-loading";

interface Marina {
  id: string;
  marina_name: string;
  address: string | null;
}

const MarinaDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [marina, setMarina] = useState<Marina | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWorkOrderId, setChatWorkOrderId] = useState<string | undefined>();
  const navigate = useNavigate();
  const { approveReservation, rejectReservation } = useMarinaReservations("marina");

  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{
    type: "approve" | "reject";
    reservation: MarinaReservation;
  } | null>(null);
  const [assignedSlip, setAssignedSlip] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchMarina = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("marinas")
        .select("id, marina_name, address")
        .eq("manager_id", user.id)
        .maybeSingle();

      if (data) {
        setMarina(data);
      }
      setLoading(false);
    };

    fetchMarina();
  }, [navigate]);

  const handleApproveClick = (reservation: MarinaReservation) => {
    setApprovalDialog({ type: "approve", reservation });
    setAssignedSlip("");
  };

  const handleRejectClick = (reservation: MarinaReservation) => {
    setApprovalDialog({ type: "reject", reservation });
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (!approvalDialog) return;
    setProcessing(true);
    await approveReservation(approvalDialog.reservation.id, assignedSlip);
    setProcessing(false);
    setApprovalDialog(null);
  };

  const handleReject = async () => {
    if (!approvalDialog || !rejectionReason) return;
    setProcessing(true);
    await rejectReservation(approvalDialog.reservation.id, rejectionReason);
    setProcessing(false);
    setApprovalDialog(null);
  };

  const handleMessageProvider = (workOrderId: string) => {
    setChatWorkOrderId(workOrderId);
    setChatOpen(true);
  };

  if (loading) {
    return <MarineLoadingScreen message="Loading command center..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Anchor className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{marina?.marina_name || "Marina Dashboard"}</h1>
                <p className="text-sm text-primary-foreground/80">Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground"
                onClick={() => setChatOpen(true)}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground"
                onClick={() => navigate("/marina/settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Pending Reservations - Priority */}
          <PendingReservationsCard 
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
          />

          {/* Arrivals & Departures - Today/Tomorrow */}
          <ArrivalsDepaturesCard />

          {/* Active Providers On-Site */}
          <ActiveProvidersCard onMessageProvider={handleMessageProvider} />

          {/* Who's On Dock - Full Width */}
          <div className="md:col-span-2 lg:col-span-2">
            <LiveDockList />
          </div>

          {/* Lease Vault */}
          <LeaseVaultCard />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3 flex-wrap">
          <Button variant="outline" onClick={() => navigate("/marina/slips")}>
            Manage Slips
          </Button>
          <Button variant="outline" onClick={() => navigate("/marina/reservations")}>
            All Reservations
          </Button>
        </div>
      </main>

      {/* Chat Sheet */}
      <MarinaChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialWorkOrderId={chatWorkOrderId}
      />

      {/* Approval Dialog */}
      <Dialog open={approvalDialog?.type === "approve"} onOpenChange={() => setApprovalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Approve reservation for {approvalDialog?.reservation.boat?.name}?
            </p>
            <div className="space-y-2">
              <Label htmlFor="slip">Assign Slip Number (optional)</Label>
              <Input
                id="slip"
                placeholder="e.g., A-15"
                value={assignedSlip}
                onChange={(e) => setAssignedSlip(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(null)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={approvalDialog?.type === "reject"} onOpenChange={() => setApprovalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectionReason}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarinaDashboard;
