import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Briefcase, CheckCircle, Clock, AlertTriangle, QrCode, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { WorkOrderWithDetails } from "@/hooks/useAdminDashboard";

interface GlobalWorkOrderFeedProps {
  workOrders: WorkOrderWithDetails[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
  assigned: { label: "Assigned", color: "bg-blue-500/20 text-blue-700", icon: Briefcase },
  in_progress: { label: "On-Site", color: "bg-purple-500/20 text-purple-700", icon: MapPin },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

export function GlobalWorkOrderFeed({ workOrders }: GlobalWorkOrderFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Global Work Order Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {workOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No work orders in system</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workOrders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold truncate">{order.title}</p>
                          {order.is_emergency && (
                            <Badge variant="destructive" className="text-xs">
                              Emergency
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.boat_name}
                          {order.provider_name && (
                            <> • <span className="text-foreground">{order.provider_name}</span></>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {format(new Date(order.created_at), "PPp")}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>

                        {/* Check-in verification status */}
                        {order.provider_checked_in_at && (
                          <div className="flex items-center gap-1 text-xs">
                            {order.check_in_method === "qr_verified" ? (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                                <QrCode className="w-3 h-3 mr-1" />
                                QR Verified
                              </Badge>
                            ) : order.check_in_method === "manual_gps" ? (
                              <Badge variant="secondary" className="bg-orange-500/20 text-orange-700">
                                <MapPin className="w-3 h-3 mr-1" />
                                GPS Manual
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Checked In
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
