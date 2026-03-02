import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Clock, MessageSquare, Wrench, CheckCircle2, Calendar, Ship, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/pricing";

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

interface WishDetailDialogProps {
  wish: Wish | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  submitted: { label: "Seeking Quotes", icon: Clock, variant: "secondary" },
  reviewed: { label: "Quote Received", icon: MessageSquare, variant: "default" },
  approved: { label: "Work in Progress", icon: Wrench, variant: "outline" },
  in_progress: { label: "Work in Progress", icon: Wrench, variant: "outline" },
  completed: { label: "Completed", icon: CheckCircle2, variant: "default" },
  converted: { label: "Completed", icon: CheckCircle2, variant: "default" },
  rejected: { label: "Cancelled", icon: Clock, variant: "destructive" },
};

function getEffectiveStatus(wish: Wish): string {
  if (wish.work_order_status) {
    if (wish.work_order_status === "completed" || wish.work_order_status === "qc_passed") return "completed";
    if (wish.work_order_status === "in_progress" || wish.work_order_status === "pending_qc") return "in_progress";
  }
  return wish.status;
}

const formatServiceType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function WishDetailDialog({ wish, open, onOpenChange }: WishDetailDialogProps) {
  if (!wish) return null;

  const effectiveStatus = getEffectiveStatus(wish);
  const status = statusConfig[effectiveStatus] || statusConfig.submitted;
  const StatusIcon = status.icon;
  const isCompleted = effectiveStatus === "completed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

          {/* Details */}
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
          </div>

          <Separator />

          {/* Description */}
          <div>
            <span className="text-sm font-medium">Description</span>
            <p className="text-sm text-muted-foreground mt-1">{wish.description}</p>
          </div>

          {/* Price / Receipt */}
          {wish.calculated_price != null && (
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
      </DialogContent>
    </Dialog>
  );
}
