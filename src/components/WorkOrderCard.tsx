import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/pricing";
import { EscrowStatusBadge } from "@/components/EscrowStatusBadge";
import StatusBadge from "@/components/StatusBadge";
import { 
  Ship, 
  AlertTriangle, 
  MapPin, 
  Eye, 
  EyeOff,
  Camera,
  DollarSign,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type EscrowStatus = Database["public"]["Enums"]["escrow_status"];
type WorkOrderStatus = Database["public"]["Enums"]["work_order_status"];

interface WorkOrderCardProps {
  workOrder: {
    id: string;
    title: string;
    description: string | null;
    status: WorkOrderStatus;
    escrow_status: EscrowStatus;
    is_emergency: boolean;
    retail_price: number | null;
    wholesale_price: number | null;
    escrow_amount: number | null;
    scheduled_date: string | null;
  };
  boat?: {
    name: string;
    make: string | null;
    model: string | null;
  };
  boatProfile?: {
    slip_number: string | null;
    gate_code: string | null;
    marina_name: string | null;
  };
  showSensitiveInfo?: boolean;
  isProvider?: boolean;
  membershipTier?: "standard" | "genie";
  onViewDetails?: () => void;
  onStartWork?: () => void;
  onUploadPhotos?: () => void;
  onReleaseFunds?: () => void;
}

export function WorkOrderCard({
  workOrder,
  boat,
  boatProfile,
  showSensitiveInfo = false,
  isProvider = false,
  membershipTier = "standard",
  onViewDetails,
  onStartWork,
  onUploadPhotos,
  onReleaseFunds,
}: WorkOrderCardProps) {
  const [showMasked, setShowMasked] = useState(false);

  const canSeeBoatDetails = 
    showSensitiveInfo || 
    ["approved", "work_started", "pending_photos", "pending_release", "released"].includes(workOrder.escrow_status);

  const displayPrice = membershipTier === "genie" 
    ? workOrder.wholesale_price 
    : workOrder.retail_price;

  const getActionButton = () => {
    if (isProvider) {
      switch (workOrder.escrow_status) {
        case "approved":
          return (
            <Button size="sm" onClick={onStartWork} className="flex-1">
              Start Work
            </Button>
          );
        case "work_started":
          return (
            <Button size="sm" onClick={onUploadPhotos} className="flex-1">
              <Camera className="w-4 h-4 mr-1" />
              Upload Photos
            </Button>
          );
        default:
          return null;
      }
    } else {
      switch (workOrder.escrow_status) {
        case "pending_photos":
        case "pending_release":
          return (
            <Button size="sm" onClick={onReleaseFunds} className="flex-1 bg-green-600 hover:bg-green-700">
              <DollarSign className="w-4 h-4 mr-1" />
              Release Funds
            </Button>
          );
        default:
          return null;
      }
    }
  };

  return (
    <Card className={`overflow-hidden ${workOrder.is_emergency ? "border-destructive" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {workOrder.is_emergency && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                  Emergency
                </Badge>
              )}
              <StatusBadge status={workOrder.status as "pending" | "in_progress" | "completed"} />
            </div>
            <CardTitle className="text-base truncate">{workOrder.title}</CardTitle>
            {boat && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <Ship className="w-3 h-3" />
                {boat.name} {boat.make && `• ${boat.make}`} {boat.model && boat.model}
              </CardDescription>
            )}
          </div>
          <EscrowStatusBadge status={workOrder.escrow_status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {workOrder.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workOrder.description}
          </p>
        )}

        {/* Boat Location - Masked for providers until approved */}
        {boatProfile && (
          <div className="bg-muted/50 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </span>
              {canSeeBoatDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowMasked(!showMasked)}
                >
                  {showMasked ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Marina</span>
                <p className="font-medium truncate">{boatProfile.marina_name || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Slip #</span>
                <p className="font-mono">
                  {canSeeBoatDetails && showMasked 
                    ? boatProfile.slip_number || "—"
                    : "••••••"}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Gate Code</span>
                <p className="font-mono">
                  {canSeeBoatDetails && showMasked 
                    ? boatProfile.gate_code || "—"
                    : "••••••"}
                </p>
              </div>
            </div>
            {!canSeeBoatDetails && (
              <p className="text-xs text-muted-foreground italic">
                Location details visible after quote is accepted
              </p>
            )}
          </div>
        )}

        {/* Price */}
        {displayPrice && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {membershipTier === "genie" ? "Wholesale" : "Retail"} Price
            </span>
            <span className="font-semibold text-primary">
              {formatPrice(displayPrice)}
            </span>
          </div>
        )}

        {/* Scheduled Date */}
        {workOrder.scheduled_date && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Scheduled</span>
            <span>{new Date(workOrder.scheduled_date).toLocaleDateString()}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {getActionButton()}
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewDetails}
              className={getActionButton() ? "" : "flex-1"}
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

export default WorkOrderCard;
