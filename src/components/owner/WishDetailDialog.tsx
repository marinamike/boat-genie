import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles, Clock, MessageSquare, Wrench, CheckCircle2, Calendar, Ship,
  AlertTriangle, Pencil, Trash2, DollarSign, Receipt, XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Wish {
  id: string;
  service_type: string;
  description: string;
  status: string;
  urgency: string | null;
  is_emergency: boolean;
  calculated_price: number | null;
  preferred_date: string | null;
  created_at: string;
  boat?: { name: string } | null;
  work_order_status?: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  source_reference: string | null;
  created_at: string;
  paid_at: string | null;
}

interface WishDetailDialogProps {
  wish: Wish | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Seeking Quotes", icon: Clock, variant: "secondary" },
  accepted: { label: "Accepted", icon: CheckCircle2, variant: "default" },
  closed: { label: "Cancelled", icon: Clock, variant: "destructive" },
  assigned: { label: "Assigned", icon: Wrench, variant: "outline" },
  in_progress: { label: "In Progress", icon: Wrench, variant: "default" },
  pending_qc: { label: "QC Review", icon: Clock, variant: "secondary" },
  completed: { label: "Completed", icon: CheckCircle2, variant: "default" },
};

function getEffectiveStatus(wish: Wish): string {
  if (wish.work_order_status) {
    if (wish.work_order_status === "completed" || wish.work_order_status === "qc_passed") return "completed";
    if (wish.work_order_status === "pending_qc") return "pending_qc";
    if (wish.work_order_status === "in_progress") return "in_progress";
    if (wish.work_order_status === "assigned") return "assigned";
  }
  if (wish.status === "converted") return "assigned";
  return wish.status;
}

const formatServiceType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function WishDetailDialog({ wish, open, onOpenChange, onUpdated }: WishDetailDialogProps) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [workOrderCharges, setWorkOrderCharges] = useState<{
    retail_price: number | null;
    escrow_amount: number | null;
    materials_deposit: number | null;
    service_fee: number | null;
    emergency_fee: number | null;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editPreferredDate, setEditPreferredDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancelAccepted, setConfirmCancelAccepted] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState<{ message: string | null; fee_percent: number | null } | null>(null);
  const [cancellationAcknowledged, setCancellationAcknowledged] = useState(false);

  useEffect(() => {
    if (!wish || !open) return;
    setEditing(false);

    // Fetch related work order charges and invoices
    const fetchCharges = async () => {
      // Find work orders linked to this wish's boat
      const { data: workOrders } = await supabase
        .from("work_orders")
        .select("id, retail_price, escrow_amount, materials_deposit, service_fee, emergency_fee, boat_id")
        .eq("boat_id", (wish as any).boat_id || "")
        .order("created_at", { ascending: false })
        .limit(1);

      if (workOrders && workOrders.length > 0) {
        const wo = workOrders[0];
        setWorkOrderCharges({
          retail_price: wo.retail_price,
          escrow_amount: wo.escrow_amount,
          materials_deposit: wo.materials_deposit,
          service_fee: wo.service_fee,
          emergency_fee: wo.emergency_fee,
        });

        // Fetch invoices linked to this work order
        const { data: invoiceData } = await supabase
          .from("customer_invoices")
          .select("id, amount, status, source_reference, created_at, paid_at")
          .eq("source_id", wo.id)
          .order("created_at", { ascending: false });

        setInvoices(invoiceData || []);
      } else {
        setWorkOrderCharges(null);
        setInvoices([]);
      }
    };

    fetchCharges();
  }, [wish, open]);

  if (!wish) return null;

  const effectiveStatus = getEffectiveStatus(wish);
  const status = statusConfig[effectiveStatus] || statusConfig.submitted;
  const StatusIcon = status.icon;
  const isCompleted = effectiveStatus === "completed";
  const isPending = effectiveStatus === "submitted" || effectiveStatus === "reviewed";
  const isAccepted = effectiveStatus === "approved" || effectiveStatus === "in_progress";

  const handleCancelAccepted = async () => {
    // Fetch provider's cancellation policy from the work order's provider business
    const { data: workOrders } = await supabase
      .from("work_orders")
      .select("id, provider_id, retail_price")
      .eq("boat_id", (wish as any).boat_id || "")
      .in("status", ["assigned", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (workOrders && workOrders.length > 0) {
      const wo = workOrders[0];
      // Fetch the provider's business for cancellation policy
      const { data: business } = await supabase
        .from("businesses")
        .select("cancellation_policy_message, cancellation_fee_percent")
        .eq("owner_id", wo.provider_id)
        .maybeSingle();

      setCancellationPolicy({
        message: (business as any)?.cancellation_policy_message ?? null,
        fee_percent: (business as any)?.cancellation_fee_percent ?? null,
      });
    } else {
      setCancellationPolicy({ message: null, fee_percent: null });
    }
    setCancellationAcknowledged(false);
    setConfirmCancelAccepted(true);
  };

  const handleConfirmCancelAccepted = async () => {
    // Cancel work order and wish
    const { data: workOrders } = await supabase
      .from("work_orders")
      .select("id")
      .eq("boat_id", (wish as any).boat_id || "")
      .in("status", ["assigned", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (workOrders && workOrders.length > 0) {
      await supabase.from("work_orders").update({ status: "cancelled" }).eq("id", workOrders[0].id);
    }
    await supabase.from("wish_forms").update({ status: "rejected" }).eq("id", wish.id);

    toast({ title: "Service Cancelled", description: "The accepted service has been cancelled." });
    onUpdated?.();
    onOpenChange(false);
    setConfirmCancelAccepted(false);
  };

  const cancellationFee = cancellationPolicy?.fee_percent && workOrderCharges?.retail_price
    ? (workOrderCharges.retail_price * cancellationPolicy.fee_percent) / 100
    : 0;

  const handleEdit = () => {
    setEditDescription(wish.description);
    setEditPreferredDate(wish.preferred_date || "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("wish_forms")
      .update({
        description: editDescription,
        preferred_date: editPreferredDate || null,
      })
      .eq("id", wish.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update wish.", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Your wish has been updated." });
      setEditing(false);
      onUpdated?.();
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("wish_forms")
      .update({ status: "rejected" })
      .eq("id", wish.id);

    if (error) {
      toast({ title: "Error", description: "Failed to cancel wish.", variant: "destructive" });
    } else {
      toast({ title: "Cancelled", description: "Your wish has been cancelled." });
      onUpdated?.();
      onOpenChange(false);
    }
    setConfirmDelete(false);
  };

  const hasCharges = workOrderCharges?.retail_price || workOrderCharges?.escrow_amount || invoices.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {isCompleted ? "Service Receipt" : "Wish Details"}
            </DialogTitle>
            <DialogDescription>
              {formatServiceType(wish.service_type)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={status.variant} className="flex items-center gap-1">
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
            </div>

            <Separator />

            {/* Editable or read-only details */}
            {editing ? (
              <div className="space-y-3">
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Preferred Date</Label>
                  <Input
                    type="date"
                    value={editPreferredDate}
                    onChange={(e) => setEditPreferredDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {wish.boat?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Ship className="w-3.5 h-3.5" /> Vessel
                    </span>
                    <span className="text-sm font-medium">{wish.boat.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Requested
                  </span>
                  <span className="text-sm">{format(new Date(wish.created_at), "MMM d, yyyy")}</span>
                </div>

                {wish.preferred_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Preferred Date</span>
                    <span className="text-sm">{format(new Date(wish.preferred_date), "MMM d, yyyy")}</span>
                  </div>
                )}

                {wish.urgency && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Urgency</span>
                    <span className="text-sm capitalize">{wish.urgency}</span>
                  </div>
                )}

                {wish.is_emergency && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Emergency Request
                  </div>
                )}

                <Separator />

                <div>
                  <span className="text-sm font-medium">Description</span>
                  <p className="text-sm text-muted-foreground mt-1">{wish.description}</p>
                </div>
              </div>
            )}

            {/* Charges Section */}
            {hasCharges && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Receipt className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Charges</span>
                  </div>
                  <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                    {workOrderCharges?.retail_price != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Total</span>
                        <span className="font-medium">{formatPrice(workOrderCharges.retail_price)}</span>
                      </div>
                    )}
                    {workOrderCharges?.materials_deposit != null && workOrderCharges.materials_deposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Materials Deposit</span>
                        <span className="font-medium">{formatPrice(workOrderCharges.materials_deposit)}</span>
                      </div>
                    )}
                    {workOrderCharges?.service_fee != null && workOrderCharges.service_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Fee</span>
                        <span>{formatPrice(workOrderCharges.service_fee)}</span>
                      </div>
                    )}
                    {workOrderCharges?.emergency_fee != null && workOrderCharges.emergency_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Emergency Fee</span>
                        <span>{formatPrice(workOrderCharges.emergency_fee)}</span>
                      </div>
                    )}
                    {workOrderCharges?.escrow_amount != null && (
                      <>
                        <Separator className="my-1" />
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Escrow Total</span>
                          <span className="text-primary">{formatPrice(workOrderCharges.escrow_amount)}</span>
                        </div>
                      </>
                    )}

                    {/* Invoices */}
                    {invoices.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        {invoices.map((inv) => (
                          <div key={inv.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {inv.source_reference || "Invoice"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatPrice(inv.amount)}</span>
                              <Badge variant={inv.status === "paid" ? "default" : "secondary"} className="text-xs">
                                {inv.status === "paid" ? "Paid" : inv.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

          {/* Cancel button for accepted/in-progress wishes */}
          {isAccepted && !editing && (
            <DialogFooter className="flex-row gap-2 sm:justify-end">
              <Button variant="destructive" size="sm" onClick={handleCancelAccepted}>
                <XCircle className="w-4 h-4 mr-1" />
                Cancel Service
              </Button>
            </DialogFooter>
          )}
            {!hasCharges && wish.calculated_price != null && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{isCompleted ? "Total Paid" : "Estimated Cost"}</span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(wish.calculated_price)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Actions for pending wishes */}
          {isPending && (
            <DialogFooter className="flex-row gap-2 sm:justify-between">
              {editing ? (
                <>
                  <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Cancel Wish
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this wish?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your service request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Wish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel Wish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancellation Policy Acknowledgment Dialog */}
      <AlertDialog open={confirmCancelAccepted} onOpenChange={setConfirmCancelAccepted}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancellation Policy
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {cancellationPolicy?.message || "Cancellations after acceptance may be subject to a fee."}
                </p>
                {cancellationFee > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-3 text-sm">
                    <span className="font-semibold text-destructive">
                      Cancellation fee: {formatPrice(cancellationFee)}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      ({cancellationPolicy?.fee_percent}% of {formatPrice(workOrderCharges?.retail_price || 0)})
                    </span>
                  </div>
                )}
                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="cancel-acknowledge"
                    checked={cancellationAcknowledged}
                    onCheckedChange={(checked) => setCancellationAcknowledged(checked === true)}
                  />
                  <label htmlFor="cancel-acknowledge" className="text-sm leading-tight cursor-pointer">
                    {cancellationFee > 0
                      ? `I acknowledge and accept the cancellation fee of ${formatPrice(cancellationFee)}`
                      : "I understand this cancellation cannot be undone"}
                  </label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Service</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelAccepted}
              disabled={!cancellationAcknowledged}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
