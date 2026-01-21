import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CalendarClock,
  Wrench,
  Fuel,
  Gauge,
  FileText,
} from "lucide-react";
import { WorkOrderWithDetails, ManualLogEntry } from "@/hooks/useBoatLog";
import { formatPrice } from "@/lib/pricing";

interface ServiceTimelineProps {
  scheduledWorkOrders: WorkOrderWithDetails[];
  activeWorkOrders: WorkOrderWithDetails[];
  completedWorkOrders: WorkOrderWithDetails[];
  manualEntries: ManualLogEntry[];
  onViewWorkOrder: (wo: WorkOrderWithDetails) => void;
}

const LOG_TYPE_ICONS: Record<string, React.ReactNode> = {
  fuel: <Fuel className="w-4 h-4" />,
  engine_hours: <Gauge className="w-4 h-4" />,
  maintenance: <Wrench className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
};

const LOG_TYPE_LABELS: Record<string, string> = {
  fuel: "Fuel",
  engine_hours: "Engine Hours",
  maintenance: "Maintenance",
  note: "Note",
};

export function ServiceTimeline({
  scheduledWorkOrders,
  activeWorkOrders,
  completedWorkOrders,
  manualEntries,
  onViewWorkOrder,
}: ServiceTimelineProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }
    > = {
      pending: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Pending" },
      approved: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" />, label: "Approved" },
      in_progress: { variant: "default", icon: <Clock className="w-3 h-3" />, label: "In Progress" },
      qc_requested: { variant: "outline", icon: <Clock className="w-3 h-3" />, label: "QC Review" },
      completed: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" />, label: "Completed" },
      cancelled: { variant: "destructive", icon: <AlertTriangle className="w-3 h-3" />, label: "Cancelled" },
    };

    const config = statusConfig[status] || { variant: "secondary" as const, icon: null, label: status };

    return (
      <Badge variant={config.variant} className={status === "completed" ? "bg-green-500" : ""}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const hasAnyContent =
    scheduledWorkOrders.length > 0 ||
    activeWorkOrders.length > 0 ||
    completedWorkOrders.length > 0 ||
    manualEntries.length > 0;

  if (!hasAnyContent) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Service History
      </h2>

      {/* Upcoming / Scheduled */}
      {scheduledWorkOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Upcoming
          </h3>
          <div className="space-y-2">
            {scheduledWorkOrders.map((wo) => (
              <Card
                key={wo.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                onClick={() => onViewWorkOrder(wo)}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{wo.title}</h4>
                        {wo.is_emergency && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Emergency
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {wo.provider?.business_name || "Awaiting provider"}
                      </p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(wo.status)}
                        {wo.scheduled_date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(wo.scheduled_date), "MMM d")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active */}
      {activeWorkOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-500" />
            Active
          </h3>
          <div className="space-y-2">
            {activeWorkOrders.map((wo) => (
              <Card
                key={wo.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
                onClick={() => onViewWorkOrder(wo)}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{wo.title}</h4>
                        {wo.is_emergency && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Emergency
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {wo.provider?.business_name || "Awaiting provider"}
                      </p>
                      {getStatusBadge(wo.status)}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedWorkOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Completed
          </h3>
          <div className="space-y-2">
            {completedWorkOrders.map((wo) => (
              <Card
                key={wo.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewWorkOrder(wo)}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{wo.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {wo.provider?.business_name || "Unknown provider"}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {wo.completed_at
                            ? format(new Date(wo.completed_at), "MMM d, yyyy")
                            : format(new Date(wo.created_at), "MMM d, yyyy")}
                        </span>
                        {wo.retail_price && (
                          <span className="font-medium text-foreground">
                            {formatPrice(wo.retail_price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {wo.qc_verified_at && (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          QC'd
                        </Badge>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Owner Entries */}
      {manualEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Owner Entries
          </h3>
          <div className="space-y-2">
            {manualEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600">
                      {LOG_TYPE_ICONS[entry.log_type] || <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{entry.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {LOG_TYPE_LABELS[entry.log_type] || entry.log_type}
                        </Badge>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground mb-1">{entry.description}</p>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
