import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ship, X, GripVertical } from "lucide-react";
import type { MarinaSlip } from "@/hooks/useMarinaSettings";

interface SlipCardProps {
  slip: MarinaSlip;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onRemoveBoat?: () => void;
  dragHandleProps?: Record<string, unknown>;
}

const slipTypeConfig: Record<string, { label: string; className: string }> = {
  staging: { label: "Staging", className: "bg-blue-100 text-blue-800" },
  dock: { label: "Dock", className: "bg-green-100 text-green-800" },
  dry_stack: { label: "Dry Stack", className: "bg-orange-100 text-orange-800" },
};

export function SlipCard({ 
  slip, 
  isDragging = false, 
  isDropTarget = false,
  onRemoveBoat,
  dragHandleProps 
}: SlipCardProps) {
  const typeConfig = slipTypeConfig[slip.slip_type] || slipTypeConfig.dock;

  return (
    <Card 
      className={`transition-all ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${
        isDropTarget ? "ring-2 ring-primary ring-offset-2" : ""
      } ${
        slip.is_occupied ? "bg-primary/5 border-primary/30" : "border-dashed"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          {slip.is_occupied && dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Slip Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm">{slip.slip_number}</span>
              <Badge className={`text-xs ${typeConfig.className}`}>
                {typeConfig.label}
              </Badge>
            </div>
            
            {slip.is_occupied && slip.boat ? (
              <div className="flex items-center gap-1.5 mt-1">
                <Ship className="w-3 h-3 text-primary" />
                <span className="text-sm font-medium truncate">{slip.boat.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({slip.current_boat_length_ft} ft)
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Available • Max {slip.max_length_ft} ft
              </p>
            )}
          </div>

          {/* Remove Button */}
          {slip.is_occupied && onRemoveBoat && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemoveBoat}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SlipCard;
