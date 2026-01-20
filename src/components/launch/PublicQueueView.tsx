import { Card, CardContent } from "@/components/ui/card";
import { LaunchStatusBadge } from "./LaunchStatusBadge";
import { Ship, Clock, User } from "lucide-react";
import type { PublicQueueItem } from "@/hooks/useLaunchQueue";

interface PublicQueueViewProps {
  queue: PublicQueueItem[];
}

export function PublicQueueView({ queue }: PublicQueueViewProps) {
  if (queue.length === 0) {
    return (
      <div className="text-center py-12">
        <Ship className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No boats in queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {queue.map((item, index) => (
        <Card 
          key={item.id} 
          className={`transition-all ${item.is_own_boat ? "ring-2 ring-primary bg-primary/5" : ""}`}
        >
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              {/* Position */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                item.status === "queued" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {item.queue_position || index + 1}
              </div>

              {/* Boat Info - Masked */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.is_own_boat ? (
                    <span className="font-semibold text-sm flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.boat_name}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      {item.boat_type || "Boat"} #{item.queue_position || index + 1}
                    </span>
                  )}
                </div>
                {item.scheduled_time && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(item.scheduled_time).toLocaleTimeString([], { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </div>
                )}
              </div>

              {/* Status */}
              <LaunchStatusBadge status={item.status} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default PublicQueueView;
