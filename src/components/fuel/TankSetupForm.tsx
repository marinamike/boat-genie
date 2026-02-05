import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useFuelManagement, FuelTank } from "@/hooks/useFuelManagement";
import { Droplets } from "lucide-react";

interface TankSetupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTank?: FuelTank | null;
}

export function TankSetupForm({ open, onOpenChange, editTank }: TankSetupFormProps) {
  const { createTank, updateTank } = useFuelManagement();
  const [loading, setLoading] = useState(false);
  
  const [tankName, setTankName] = useState(editTank?.tank_name || "");
  const [fuelType, setFuelType] = useState<"diesel" | "gasoline" | "premium">(
    (editTank?.fuel_type as "diesel" | "gasoline" | "premium") || "diesel"
  );
  const [totalCapacity, setTotalCapacity] = useState(editTank?.total_capacity_gallons?.toString() || "");
  const [currentVolume, setCurrentVolume] = useState(editTank?.current_volume_gallons?.toString() || "");
  const [lowLevelThreshold, setLowLevelThreshold] = useState(editTank?.low_level_threshold_gallons?.toString() || "500");
  const [notes, setNotes] = useState(editTank?.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankName || !totalCapacity) return;

    setLoading(true);
    
    const tankData = {
      tank_name: tankName,
      fuel_type: fuelType,
      total_capacity_gallons: parseFloat(totalCapacity),
      current_volume_gallons: parseFloat(currentVolume || "0"),
      low_level_threshold_gallons: parseFloat(lowLevelThreshold || "500"),
      notes: notes || null,
      is_active: true,
      last_delivery_date: null,
    };

    let success = false;
    if (editTank) {
      success = await updateTank(editTank.id, tankData);
    } else {
      const result = await createTank(tankData);
      success = !!result;
    }

    setLoading(false);
    
    if (success) {
      // Reset form
      setTankName("");
      setFuelType("diesel");
      setTotalCapacity("");
      setCurrentVolume("");
      setLowLevelThreshold("500");
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            {editTank ? "Edit Tank" : "Add Fuel Tank"}
          </SheetTitle>
          <SheetDescription>
            {editTank ? "Update tank configuration" : "Configure a new fuel storage tank"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Tank Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tank Name *</Label>
            <Input
              id="name"
              type="text"
              value={tankName}
              onChange={(e) => setTankName(e.target.value)}
              placeholder="e.g., Main Diesel Tank"
              required
            />
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type *</Label>
            <Select value={fuelType} onValueChange={(v) => setFuelType(v as typeof fuelType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]" position="popper" sideOffset={4}>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="gasoline">Gasoline (Regular)</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Total Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Total Capacity (gallons) *</Label>
            <Input
              id="capacity"
              type="number"
              step="1"
              min="0"
              value={totalCapacity}
              onChange={(e) => setTotalCapacity(e.target.value)}
              placeholder="10000"
              required
            />
          </div>

          {/* Current Volume */}
          <div className="space-y-2">
            <Label htmlFor="current">Current Volume (gallons)</Label>
            <Input
              id="current"
              type="number"
              step="0.01"
              min="0"
              value={currentVolume}
              onChange={(e) => setCurrentVolume(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Set the starting volume for this tank
            </p>
          </div>

          {/* Low Level Threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold">Low Level Alert Threshold (gallons)</Label>
            <Input
              id="threshold"
              type="number"
              step="1"
              min="0"
              value={lowLevelThreshold}
              onChange={(e) => setLowLevelThreshold(e.target.value)}
              placeholder="500"
            />
            <p className="text-xs text-muted-foreground">
              Alert when tank falls below this level
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Location, maintenance notes, etc."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !tankName || !totalCapacity}>
            {loading ? "Saving..." : editTank ? "Update Tank" : "Add Tank"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
