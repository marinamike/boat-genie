import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Anchor, Calendar, MapPin, CheckCircle2, Clock, XCircle, Ship } from "lucide-react";
import { format } from "date-fns";

interface Reservation {
  id: string;
  status: string;
  stay_type: string;
  requested_arrival: string;
  requested_departure: string | null;
  assigned_slip: string | null;
  created_at: string;
  marina?: { marina_name: string } | null;
  boat?: { name: string } | null;
}

interface ReservationDetailDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ReservationDetailDialog({ reservation, open, onOpenChange }: ReservationDetailDialogProps) {
  if (!reservation) return null;

  const status = statusConfig[reservation.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isCompleted = reservation.status === "checked_out";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

          {/* Details */}
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
          </div>

          {/* Submitted date */}
          <Separator />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Submitted</span>
            <span>{format(new Date(reservation.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
