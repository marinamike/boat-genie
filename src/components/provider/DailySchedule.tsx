import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  MapPin, 
  Ship, 
  AlertTriangle, 
  Calendar, 
  Navigation, 
  CheckCircle2,
  Loader2,
  Clock,
  QrCode,
  Wrench,
  CalendarIcon,
  X
} from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ActiveWorkOrder } from "@/hooks/useProviderMetrics";
import { QRScanner } from "./QRScanner";
import { ManualCheckInDialog } from "./ManualCheckInDialog";
import { useQRCheckIn } from "@/hooks/useQRCheckIn";
import { WorkTimer } from "./WorkTimer";
import type { DateRange } from "react-day-picker";

interface DailyScheduleProps {
  workOrders: ActiveWorkOrder[];
  onNotifyArrival: (workOrderId: string, ownerId: string | null) => Promise<boolean>;
  onUpdateStatus: (workOrderId: string, status: string) => Promise<boolean>;
  onRefresh: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Approval", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  assigned: { label: "Assigned", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  in_progress: { label: "On-Site", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

const priorityLabels: Record<number, string> = {
  1: "Normal",
  2: "High",
  3: "Urgent",
};

export function DailySchedule({ workOrders, onNotifyArrival, onUpdateStatus, onRefresh }: DailyScheduleProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [scanningWorkOrder, setScanningWorkOrder] = useState<ActiveWorkOrder | null>(null);
  const [manualCheckInWorkOrder, setManualCheckInWorkOrder] = useState<ActiveWorkOrder | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();
  const { verifyQRCode, isProcessing } = useQRCheckIn();

  const filteredWorkOrders = useMemo(() => {
    if (!dateRange?.from) return workOrders;
    return workOrders.filter((wo) => {
      if (!wo.scheduled_date) return !dateRange.from; // show unscheduled only if no filter
      const woDate = startOfDay(parseISO(wo.scheduled_date));
      const from = startOfDay(dateRange.from!);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
      return isWithinInterval(woDate, { start: from, end: to });
    });
  }, [workOrders, dateRange]);

  const handleScanSuccess = async (code: string) => {
    if (!scanningWorkOrder) return;

    const result = await verifyQRCode(
      code,
      scanningWorkOrder.id,
      scanningWorkOrder.boat_id
    );

    setScanningWorkOrder(null);

    if (result.success) {
      toast({
        title: "Check-In Verified!",
        description: result.message,
      });
      onRefresh();
    } else {
      toast({
        title: "Verification Failed",
        description: result.message,
        variant: "destructive",
      });
      // Show manual check-in option
      setManualCheckInWorkOrder(scanningWorkOrder);
    }
  };

  const handleScanFailed = () => {
    if (scanningWorkOrder) {
      setManualCheckInWorkOrder(scanningWorkOrder);
    }
    setScanningWorkOrder(null);
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

  const dateRangeLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
      : format(dateRange.from, "MMM d, yyyy")
    : null;

  if (workOrders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Active Jobs</h3>
          <p className="text-muted-foreground text-center">
            Check the Leads tab to quote on new opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule
          </h3>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1.5", dateRangeLabel && "text-primary")}>
                  <CalendarIcon className="w-4 h-4" />
                  {dateRangeLabel || "All Dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {dateRange?.from && (
              <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            )}
            <Badge variant="secondary">{filteredWorkOrders.length} job{filteredWorkOrders.length !== 1 ? "s" : ""}</Badge>
          </div>
        </div>

        {filteredWorkOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No jobs scheduled for this date range</p>
              <Button variant="link" size="sm" onClick={() => setDateRange(undefined)}>Show all</Button>
            </CardContent>
          </Card>
        ) : null}

        {filteredWorkOrders.map((wo) => {
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

                {/* Provider Info - Only business name visible to staff. Contact info is NEVER exposed. */}
                {wo.provider_name && (
                  <div className="flex items-start gap-2 text-sm bg-muted/50 rounded-md p-2">
                    <Wrench className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{wo.provider_name}</p>
                      <p className="text-xs text-muted-foreground italic">
                        Use in-app messaging for coordination
                      </p>
                    </div>
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

                {/* Work Timer - Shows when checked in */}
                {wo.status === "in_progress" && wo.provider_checked_in_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time on job:</span>
                    <WorkTimer 
                      startTime={wo.provider_checked_in_at} 
                      isRunning={true} 
                    />
                  </div>
                )}
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

                  {wo.status === "pending" ? (
                    <Button
                      size="sm"
                      className="flex-1"
                      variant="outline"
                      disabled
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Awaiting Customer Approval
                    </Button>
                  ) : wo.status === "assigned" ? (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setScanningWorkOrder(wo)}
                      disabled={isProcessing}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan QR to Check-In
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

      {/* QR Scanner Dialog */}
      <QRScanner
        open={!!scanningWorkOrder}
        onClose={() => setScanningWorkOrder(null)}
        onScan={handleScanSuccess}
        onScanFailed={handleScanFailed}
      />

      {/* Manual Check-In Dialog */}
      <ManualCheckInDialog
        open={!!manualCheckInWorkOrder}
        onClose={() => setManualCheckInWorkOrder(null)}
        workOrderId={manualCheckInWorkOrder?.id || ""}
        boatId={manualCheckInWorkOrder?.boat_id || ""}
        marinaLat={null} // Would come from marina coordinates
        marinaLng={null}
        onSuccess={() => {
          setManualCheckInWorkOrder(null);
          onRefresh();
        }}
      />
    </>
  );
}
