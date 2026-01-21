import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ClipboardCheck, 
  Ship, 
  Clock, 
  DollarSign, 
  ChevronRight,
  AlertTriangle,
  MapPin,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { QCQueueItem } from "@/hooks/useQCQueue";

interface QCQueueListProps {
  items: QCQueueItem[];
  loading: boolean;
  onSelectItem: (item: QCQueueItem) => void;
}

export function QCQueueList({ items, loading, onSelectItem }: QCQueueListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading QC queue...</div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-semibold text-lg mb-1">No Pending QC Reviews</h3>
          <p className="text-sm text-muted-foreground">
            All jobs are either in progress or have been verified
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Pending QC Reviews ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)] min-h-[400px]">
          <div className="divide-y">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Ship className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{item.boat_name}</span>
                    {item.is_emergency && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {item.title}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.marina_name && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {item.marina_name}
                      </span>
                    )}
                    {item.provider_name && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="w-3 h-3" />
                        {item.provider_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {item.qc_requested_at && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.qc_requested_at), { addSuffix: true })}
                      </span>
                    )}
                    {item.escrow_amount && item.escrow_amount > 0 && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="w-3 h-3" />
                        ${item.escrow_amount.toFixed(2)}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {item.verified_count}/{item.checklist_count} verified
                    </Badge>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 self-center" />
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
