import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Ship, 
  Calendar, 
  MapPin, 
  Clock,
  ChevronRight,
  Zap,
  User
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

type ReservationStatus = "pending" | "approved" | "checked_in" | "checked_out" | "rejected" | "cancelled";
type StayType = "transient" | "longterm" | "day_dock";

interface ReservationCardProps {
  reservation: {
    id: string;
    status: ReservationStatus;
    stay_type: StayType;
    requested_arrival: string;
    requested_departure: string | null;
    assigned_slip: string | null;
    power_requirements: string | null;
    special_requests: string | null;
  };
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
  };
  owner?: {
    full_name: string | null;
  };
  viewerRole: "owner" | "marina" | "admin";
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
  onMessage?: () => void;
}

const STATUS_STYLES: Record<ReservationStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
  checked_in: { label: "Checked In", className: "bg-blue-100 text-blue-800 border-blue-200" },
  checked_out: { label: "Checked Out", className: "bg-gray-100 text-gray-700 border-gray-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

const STAY_TYPE_LABELS: Record<StayType, string> = {
  transient: "Transient",
  longterm: "Long-Term",
  day_dock: "Day Dock",
};

export function ReservationCard({
  reservation,
  boat,
  owner,
  viewerRole,
  onApprove,
  onReject,
  onViewDetails,
  onMessage,
}: ReservationCardProps) {
  const statusStyle = STATUS_STYLES[reservation.status] || STATUS_STYLES.pending;
  const stayDays = reservation.requested_departure 
    ? differenceInDays(new Date(reservation.requested_departure), new Date(reservation.requested_arrival))
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {STAY_TYPE_LABELS[reservation.stay_type]}
              </Badge>
              <Badge className={cn("text-xs", statusStyle.className)}>
                {statusStyle.label}
              </Badge>
            </div>
            {boat && (
              <CardTitle className="text-base truncate flex items-center gap-2">
                <Ship className="w-4 h-4 text-primary" />
                {boat.name}
                {boat.length_ft && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({boat.length_ft}')
                  </span>
                )}
              </CardTitle>
            )}
            {boat?.make && (
              <CardDescription className="mt-1">
                {boat.make} {boat.model}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date Range */}
        <div className="bg-muted/50 rounded-md p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium">
              {format(new Date(reservation.requested_arrival), "MMM d, yyyy")}
              {reservation.requested_departure && (
                <>
                  <span className="text-muted-foreground mx-2">→</span>
                  {format(new Date(reservation.requested_departure), "MMM d, yyyy")}
                </>
              )}
            </span>
          </div>
          {stayDays !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {stayDays} {stayDays === 1 ? "night" : "nights"}
            </div>
          )}
        </div>

        {/* Slip Assignment */}
        {reservation.assigned_slip && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">Slip {reservation.assigned_slip}</span>
          </div>
        )}

        {/* Power Requirements */}
        {reservation.power_requirements && (
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{reservation.power_requirements}</span>
          </div>
        )}

        {/* Owner info (for marina/admin view) */}
        {owner?.full_name && viewerRole !== "owner" && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{owner.full_name}</span>
          </div>
        )}

        {/* Special Requests */}
        {reservation.special_requests && (
          <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md italic">
            "{reservation.special_requests}"
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {viewerRole === "marina" && reservation.status === "pending" && (
            <>
              <Button 
                size="sm" 
                onClick={onApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onReject}
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                Reject
              </Button>
            </>
          )}
          
          {onMessage && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onMessage}
            >
              Message
            </Button>
          )}
          
          {onViewDetails && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onViewDetails}
              className="flex-1"
            >
              Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ReservationCard;