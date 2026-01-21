import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import type { DisputedWorkOrder } from "@/hooks/useAdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DisputedJobsPanelProps {
  disputes: DisputedWorkOrder[];
  onRefresh: () => void;
}

export function DisputedJobsPanel({ disputes, onRefresh }: DisputedJobsPanelProps) {
  const [selectedDispute, setSelectedDispute] = useState<DisputedWorkOrder | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resolveDispute = async (action: "release" | "refund") => {
    if (!selectedDispute) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get user info for audit log
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", session.user.id)
        .single();

      const newStatus = action === "release" ? "released" : "none";
      
      // Update work order
      const { error: updateError } = await supabase
        .from("work_orders")
        .update({
          escrow_status: newStatus,
          dispute_reason: null,
          disputed_at: null,
          disputed_by: null,
          ...(action === "release" && { 
            funds_released_at: new Date().toISOString(),
            status: "completed"
          }),
          ...(action === "refund" && { 
            status: "cancelled" 
          }),
        })
        .eq("id", selectedDispute.id);

      if (updateError) throw updateError;

      // Log the resolution
      await supabase.from("qc_audit_logs").insert({
        work_order_id: selectedDispute.id,
        boat_id: selectedDispute.boat_id,
        performed_by: session.user.id,
        performer_name: profile?.full_name || "Unknown",
        performer_email: profile?.email,
        performer_role: "admin",
        action: action === "release" ? "dispute_resolved_release" : "dispute_resolved_refund",
        notes: resolutionNotes || `Dispute resolved: ${action === "release" ? "Funds released to provider" : "Funds refunded to owner"}`,
      });

      toast({
        title: "Dispute Resolved",
        description: action === "release" 
          ? "Funds have been released to the provider" 
          : "Escrow has been cancelled - owner to be refunded",
      });

      setSelectedDispute(null);
      setResolutionNotes("");
      onRefresh();
    } catch (error: any) {
      console.error("Error resolving dispute:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Disputed Jobs ({disputes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {disputes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>No disputed jobs</p>
                <p className="text-sm">All escrow payments are processing normally</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    className="p-4 border border-destructive/30 rounded-lg bg-destructive/5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold truncate">{dispute.title}</p>
                          <Badge variant="destructive" className="text-xs">
                            Disputed
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {dispute.boat_name}
                          {dispute.provider_name && (
                            <> • <span className="text-foreground">{dispute.provider_name}</span></>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${dispute.escrow_amount?.toFixed(2) || "0.00"}
                        </Badge>
                      </div>
                    </div>

                    {/* Dispute Reason */}
                    <div className="p-3 bg-background/50 rounded border mb-3">
                      <p className="text-sm font-medium text-destructive mb-1">Dispute Reason:</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.dispute_reason || "No reason provided"}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(dispute.disputed_at!), "PPp")}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {dispute.disputed_by_name || "Unknown"}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      Review & Resolve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Resolve Dispute
            </DialogTitle>
            <DialogDescription>
              Review the dispute and decide how to handle the frozen escrow funds.
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedDispute.title}</p>
                <p className="text-sm text-muted-foreground">{selectedDispute.boat_name}</p>
                <p className="text-sm font-medium mt-2">
                  Escrow Amount: ${selectedDispute.escrow_amount?.toFixed(2) || "0.00"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Dispute Reason:</p>
                <p className="text-sm text-muted-foreground p-2 bg-destructive/10 rounded">
                  {selectedDispute.dispute_reason}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Resolution Notes (optional)</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add notes about the resolution..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => resolveDispute("refund")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Cancel & Refund Owner
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={() => resolveDispute("release")}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Release to Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
