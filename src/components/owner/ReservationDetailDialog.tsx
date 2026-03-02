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
import {
  Anchor, Calendar, MapPin, CheckCircle2, Clock, XCircle, Ship,
  Pencil, Trash2, DollarSign, Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  status: string;
  stay_type: string;
  requested_arrival: string;
  requested_departure: string | null;
  assigned_slip: string | null;
  created_at: string;
  special_requests?: string | null;
  power_requirements?: string | null;
  marina?: { marina_name: string } | null;
  boat?: { name: string } | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  source_reference: string | null;
  created_at: string;
  paid_at: string | null;
}

interface ReservationDetailDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Confirmed", icon: CheckCircle2, variant: "default" },
  checked_in: { label: "Checked In", icon: Anchor, variant: "default" },
  checked_out: { label: "Completed", icon: CheckCircle2, variant: "outline" },
  rejected: { label: "Declined", icon: XCircle, variant: "destructive" },
  cancelled: { label: "Cancelled", icon: XCircle, variant: "destructive" },
};

const stayTypeLabels: Record<string, string> = {
  transient: "Transient",
  monthly: "Monthly",
  seasonal: "Seasonal",
  annual: "Annual",
  longterm: "Long-Term",
  day_dock: "Day Dock",
};

export function ReservationDetailDialog({ reservation, open, onOpenChange, onUpdated }: ReservationDetailDialogProps) {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editing, setEditing] = useState(false);
  const [editArrival, setEditArrival] = useState("");
  const [editDeparture, setEditDeparture] = useState("");
  const [editSpecialRequests, setEditSpecialRequests] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!reservation || !open) return;
    setEditing(false);

    // Fetch invoices linked to this reservation
    const fetchInvoices = async () => {
      const { data } = await supabase
        .from("customer_invoices")
        .select("id, amount, status, source_reference, created_at, paid_at")
        .eq("source_id", reservation.id)
        .order("created_at", { ascending: false });

      setInvoices(data || []);
    };

    fetchInvoices();
  }, [reservation, open]);

  if (!reservation) return null;

  const status = statusConfig[reservation.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isCompleted = reservation.status === "checked_out";
  const isPending = reservation.status === "pending";

  const handleEdit = () => {
    setEditArrival(reservation.requested_arrival);
    setEditDeparture(reservation.requested_departure || "");
    setEditSpecialRequests(reservation.special_requests || "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("marina_reservations")
      .update({
        requested_arrival: editArrival,
        requested_departure: editDeparture || null,
        special_requests: editSpecialRequests || null,
      })
      .eq("id", reservation.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update reservation.", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Your reservation has been updated." });
      setEditing(false);
      onUpdated?.();
      onOpenChange(false);
    }
  };

  const handleCancel = async () => {
    const { error } = await supabase
      .from("marina_reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.id);

    if (error) {
      toast({ title: "Error", description: "Failed to cancel reservation.", variant: "destructive" });
    } else {
      toast({ title: "Cancelled", description: "Your reservation has been cancelled." });
      onUpdated?.();
      onOpenChange(false);
    }
    setConfirmDelete(false);
  };

  const invoiceTotal = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Anchor className="w-5 h-5 text-primary" />
              {isCompleted ? "Stay Receipt" : "Reservation Details"}
            </DialogTitle>
            <DialogDescription>
              {reservation.marina?.marina_name || "Marina Reservation"}
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

            {/* Editable or read-only */}
            {editing ? (
              <div className="space-y-3">
                <div>
                  <Label>Arrival Date</Label>
                  <Input
                    type="date"
                    value={editArrival}
                    onChange={(e) => setEditArrival(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Departure Date</Label>
                  <Input
                    type="date"
                    value={editDeparture}
                    onChange={(e) => setEditDeparture(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Special Requests</Label>
                  <Textarea
                    value={editSpecialRequests}
                    onChange={(e) => setEditSpecialRequests(e.target.value)}
                    className="mt-1"
                    rows={3}
                    placeholder="Any special requirements..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {reservation.boat?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Ship className="w-3.5 h-3.5" /> Vessel
                    </span>
                    <span className="text-sm font-medium">{reservation.boat.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Marina
                  </span>
                  <span className="text-sm font-medium">{reservation.marina?.marina_name || "—"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stay Type</span>
                  <Badge variant="outline" className="text-xs">
                    {stayTypeLabels[reservation.stay_type] || reservation.stay_type}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Arrival
                  </span>
                  <span className="text-sm">{format(new Date(reservation.requested_arrival), "MMM d, yyyy")}</span>
                </div>

                {reservation.requested_departure && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Departure
                    </span>
                    <span className="text-sm">{format(new Date(reservation.requested_departure), "MMM d, yyyy")}</span>
                  </div>
                )}

                {reservation.assigned_slip && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Assigned Slip</span>
                      <span className="text-sm font-bold text-primary">{reservation.assigned_slip}</span>
                    </div>
                  </>
                )}

                {reservation.special_requests && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium">Special Requests</span>
                      <p className="text-sm text-muted-foreground mt-1">{reservation.special_requests}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Charges / Invoices */}
            {invoices.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Receipt className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Charges</span>
                  </div>
                  <div className="space-y-2 bg-muted/30 rounded-lg p-3">
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
                    {invoices.length > 1 && (
                      <>
                        <Separator className="my-1" />
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Total</span>
                          <span className="text-primary">{formatPrice(invoiceTotal)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Submitted date */}
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Submitted</span>
              <span>{format(new Date(reservation.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>

          {/* Actions for pending reservations */}
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
                    Cancel Reservation
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
            <AlertDialogTitle>Cancel this reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your reservation request. You can always submit a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
