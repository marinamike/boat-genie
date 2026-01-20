import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Ship, 
  Clock, 
  ArrowUp, 
  Waves, 
  AlertTriangle, 
  DollarSign,
  ClipboardCheck,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LaunchStatusBadge } from "./LaunchStatusBadge";
import type { LaunchQueueItem, LaunchStatus } from "@/hooks/useLaunchQueue";

interface QueueManagerProps {
  queue: LaunchQueueItem[];
  staleBoats: LaunchQueueItem[];
  reRackFee: number;
  onUpdateStatus: (queueId: string, status: LaunchStatus) => Promise<boolean>;
  onFlagStale: (queueId: string) => Promise<boolean>;
  onChargeReRackFee: (item: LaunchQueueItem) => Promise<boolean>;
  onOpenLaunchCard: (item: LaunchQueueItem) => void;
}

export function QueueManager({
  queue,
  staleBoats,
  reRackFee,
  onUpdateStatus,
  onFlagStale,
  onChargeReRackFee,
  onOpenLaunchCard,
}: QueueManagerProps) {
  const getTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const getNextActions = (status: LaunchStatus): { label: string; status: LaunchStatus; icon: React.ElementType }[] => {
    switch (status) {
      case "queued":
        return [{ label: "Move to Deck", status: "on_deck", icon: ArrowUp }];
      case "on_deck":
        return [{ label: "Start Splashing", status: "splashing", icon: Waves }];
      case "splashing":
        return [{ label: "Mark Splashed", status: "splashed", icon: Waves }];
      case "splashed":
        return [
          { label: "Check In", status: "in_water", icon: Ship },
          { label: "Start Haul", status: "hauling", icon: ArrowUp },
        ];
      case "hauling":
        return [{ label: "Complete Haul", status: "re_racked", icon: ClipboardCheck }];
      default:
        return [];
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="w-5 h-5 text-primary" />
          Launch Queue
        </CardTitle>
        <CardDescription>
          {queue.length} boat{queue.length !== 1 ? "s" : ""} in queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stale Boats Alert */}
        {staleBoats.length > 0 && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
            <div className="flex items-center gap-2 text-destructive font-semibold mb-2">
              <AlertTriangle className="w-4 h-4" />
              {staleBoats.length} Stale Boat{staleBoats.length !== 1 ? "s" : ""} Detected
            </div>
            {staleBoats.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-t border-destructive/20">
                <span className="text-sm">{item.boat?.name}</span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onFlagStale(item.id)}
                  >
                    Flag Stale
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => onChargeReRackFee(item)}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Charge ${reRackFee}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Queue List */}
        {queue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ship className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No boats in queue</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => {
              const actions = getNextActions(item.status);
              const isStale = item.is_stale;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    isStale 
                      ? "border-destructive bg-destructive/5" 
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Position */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {item.queue_position || "-"}
                    </div>

                    {/* Boat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">
                          {item.boat?.name}
                        </span>
                        {isStale && (
                          <Badge variant="destructive" className="text-xs">
                            Stale
                          </Badge>
                        )}
                        {item.re_rack_fee_charged && (
                          <Badge variant="secondary" className="text-xs">
                            Fee Charged
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.boat?.make} {item.boat?.model}</span>
                        {item.boat?.length_ft && (
                          <span>• {item.boat.length_ft} ft</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {getTimeSince(item.requested_at)}
                        {item.scheduled_time && (
                          <span className="ml-2">
                            Scheduled: {new Date(item.scheduled_time).toLocaleTimeString([], { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <LaunchStatusBadge status={item.status} />

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action) => (
                          <DropdownMenuItem
                            key={action.status}
                            onClick={() => onUpdateStatus(item.id, action.status)}
                          >
                            <action.icon className="w-4 h-4 mr-2" />
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                        
                        {item.status === "hauling" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onOpenLaunchCard(item)}>
                              <ClipboardCheck className="w-4 h-4 mr-2" />
                              Fill Launch Card
                            </DropdownMenuItem>
                          </>
                        )}

                        {item.status === "splashed" && !item.is_stale && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onFlagStale(item.id)}
                              className="text-destructive"
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Flag as Stale
                            </DropdownMenuItem>
                          </>
                        )}

                        {item.is_stale && !item.re_rack_fee_charged && (
                          <DropdownMenuItem 
                            onClick={() => onChargeReRackFee(item)}
                            className="text-destructive"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Charge Re-Rack Fee
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onUpdateStatus(item.id, "cancelled")}
                          className="text-destructive"
                        >
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QueueManager;
