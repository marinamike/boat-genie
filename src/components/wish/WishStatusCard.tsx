import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, MessageSquare, Wrench, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/pricing";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  boat?: {
    name: string;
  } | null;
  work_order_status?: string | null;
}

interface WishStatusCardProps {
  wish: Wish;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  submitted: {
    label: "Seeking Quotes",
    icon: Clock,
    variant: "secondary",
  },
  reviewed: {
    label: "Quote Received",
    icon: MessageSquare,
    variant: "default",
  },
  approved: {
    label: "Work in Progress",
    icon: Wrench,
    variant: "outline",
  },
  in_progress: {
    label: "Work in Progress",
    icon: Wrench,
    variant: "outline",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "default",
  },
  converted: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "default",
  },
  rejected: {
    label: "Cancelled",
    icon: Clock,
    variant: "destructive",
  },
};

// Determine the effective status based on work order status
function getEffectiveStatus(wish: Wish): string {
  // If there's a work order status, use it for more accurate display
  if (wish.work_order_status) {
    if (wish.work_order_status === "completed") return "completed";
    if (wish.work_order_status === "in_progress") return "in_progress";
    if (wish.work_order_status === "pending_qc") return "in_progress";
    if (wish.work_order_status === "qc_passed") return "completed";
  }
  return wish.status;
}

export function WishStatusCard({ wish }: WishStatusCardProps) {
  const effectiveStatus = getEffectiveStatus(wish);
  const status = statusConfig[effectiveStatus] || statusConfig.submitted;
  const StatusIcon = status.icon;

  const formatServiceType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Card className={cn(
      "transition-all hover:shadow-md cursor-pointer",
      wish.is_emergency && "border-destructive/50 bg-destructive/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-medium truncate">{formatServiceType(wish.service_type)}</span>
              {wish.is_emergency && (
                <Badge variant="destructive" className="text-xs">Emergency</Badge>
              )}
            </div>
            
            {wish.boat?.name && (
              <div className="text-sm text-muted-foreground mb-1">
                {wish.boat.name}
              </div>
            )}

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {wish.description}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{format(new Date(wish.created_at), "MMM d, yyyy")}</span>
              {wish.calculated_price && (
                <span className="font-medium text-foreground">
                  {formatPrice(wish.calculated_price)}
                </span>
              )}
            </div>
          </div>

          <Badge variant={status.variant} className="flex items-center gap-1 flex-shrink-0">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
