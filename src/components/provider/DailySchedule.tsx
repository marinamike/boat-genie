import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Ship, 
  AlertTriangle, 
  Calendar, 
  Navigation, 
  CheckCircle2,
  Loader2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ActiveWorkOrder } from "@/hooks/useProviderMetrics";

interface DailyScheduleProps {
  workOrders: ActiveWorkOrder[];
  onNotifyArrival: (workOrderId: string, ownerId: string | null) => Promise<boolean>;
  onUpdateStatus: (workOrderId: string, status: string) => Promise<boolean>;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  assigned: { label: "Assigned", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

const priorityLabels: Record<number, string> = {
  1: "Normal",
  2: "High",
  3: "Urgent",
};

export function DailySchedule({ workOrders, onNotifyArrival, onUpdateStatus }: DailyScheduleProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleArrival = async (wo: ActiveWorkOrder) => {
    setLoadingId(wo.id);
    await onNotifyArrival(wo.id, wo.owner_id);
    setLoadingId(null);
  };

  const handleComplete = async (workOrderId: string) => {
    setLoadingId(workOrderId);
    await onUpdateStatus(workOrderId, "completed");
    setLoadingId(null);
  };

  const getDirectionsUrl = (address: string | null, marinaName: string | null) => {
    const query = address || marinaName || "";
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  };

  if (workOrders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Active Jobs Today</h3>
          <p className="text-muted-foreground text-center">
            Check the Leads tab to quote on new opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Daily Schedule
        </h3>
        <Badge variant="secondary">{workOrders.length} job{workOrders.length !== 1 ? "s" : ""}</Badge>
      </div>

      {workOrders.map((wo) => {
        const status = statusConfig[wo.status] || statusConfig.assigned;
        const isLoading = loadingId === wo.id;

        return (
          <Card key={wo.id} className={wo.is_emergency ? "border-destructive" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {wo.title}
                    {wo.is_emergency && (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ship className="w-4 h-4" />
                    <span>{wo.boat_name}</span>
                    {wo.boat_length_ft && <span>• {wo.boat_length_ft}ft</span>}
                  </div>
                </div>
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Location Info */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{wo.marina_name || "Marina not specified"}</p>
                  {wo.slip_number && (
                    <p className="text-muted-foreground">Slip #{wo.slip_number}</p>
                  )}
                </div>
              </div>

              {/* Scheduled Date */}
              {wo.scheduled_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(wo.scheduled_date), "EEEE, MMMM d, yyyy")}</span>
                </div>
              )}

              {/* Priority */}
              {wo.priority && wo.priority > 1 && (
                <Badge 
                  variant="secondary" 
                  className={wo.priority === 3 ? "bg-destructive/10 text-destructive" : "bg-orange-500/10 text-orange-600"}
                >
                  {priorityLabels[wo.priority]} Priority
                </Badge>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(getDirectionsUrl(wo.marina_address, wo.marina_name), "_blank")}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>

                {wo.status === "assigned" ? (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleArrival(wo)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-2" />
                    )}
                    I'm On-Site
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1"
                    variant="default"
                    onClick={() => handleComplete(wo.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Mark Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
