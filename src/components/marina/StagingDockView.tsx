import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Ship, Anchor, Settings2 } from "lucide-react";
import type { MarinaSlip } from "@/hooks/useMarinaSettings";

interface StagingDockViewProps {
  stagingSlips: MarinaSlip[];
  totalCapacityFt: number;
  currentFootage: number;
  capacityPercentage: number;
  isOverCapacity: boolean;
  onUpdateCapacity: (capacity: number) => void;
}

export function StagingDockView({
  stagingSlips,
  totalCapacityFt,
  currentFootage,
  capacityPercentage,
  isOverCapacity,
  onUpdateCapacity,
}: StagingDockViewProps) {
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState(totalCapacityFt.toString());

  const handleSaveCapacity = () => {
    const capacity = parseFloat(newCapacity);
    if (!isNaN(capacity) && capacity > 0) {
      onUpdateCapacity(capacity);
      setEditingCapacity(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Anchor className="w-5 h-5 text-primary" />
              Staging Dock
            </CardTitle>
            <CardDescription>Monitor in-water boat capacity</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingCapacity(!editingCapacity)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity Alert */}
        {isOverCapacity && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Capacity Warning!</span>
              <p className="text-xs">Dock usage exceeds 90% threshold</p>
            </div>
          </div>
        )}

        {/* Capacity Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Usage</span>
            <span className="font-semibold">
              {currentFootage.toFixed(0)} / {totalCapacityFt} ft
            </span>
          </div>
          <Progress 
            value={Math.min(capacityPercentage, 100)} 
            className={`h-3 ${isOverCapacity ? "[&>div]:bg-destructive" : ""}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className={capacityPercentage > 90 ? "text-destructive font-medium" : ""}>
              {capacityPercentage.toFixed(1)}%
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Edit Capacity */}
        {editingCapacity && (
          <div className="flex gap-2 p-3 bg-muted rounded-lg">
            <Input
              type="number"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              placeholder="Total linear footage"
              className="flex-1"
            />
            <Button size="sm" onClick={handleSaveCapacity}>
              Save
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setEditingCapacity(false);
                setNewCapacity(totalCapacityFt.toString());
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Staging Slips List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">In-Water Boats</h4>
          {stagingSlips.filter(s => s.is_occupied).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No boats currently staged
            </p>
          ) : (
            stagingSlips
              .filter((s) => s.is_occupied)
              .map((slip) => (
                <div
                  key={slip.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{slip.boat?.name || "Unknown"}</span>
                    <Badge variant="secondary" className="text-xs">
                      {slip.slip_number}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {slip.current_boat_length_ft || 0} ft
                  </span>
                </div>
              ))
          )}
        </div>

        {/* Available Slots */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available Staging Slots</span>
            <Badge variant="outline">
              {stagingSlips.filter((s) => !s.is_occupied).length} / {stagingSlips.length}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StagingDockView;
