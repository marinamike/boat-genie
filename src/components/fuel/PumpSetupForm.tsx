import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelPump } from "@/hooks/useFuelManagement";
import { Fuel } from "lucide-react";

const FUEL_TYPES = [
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "premium", label: "Premium" },
];

interface PumpSetupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPump?: FuelPump | null;
  onCreatePump: (data: Omit<FuelPump, "id" | "created_at" | "updated_at" | "business_id" | "tank">) => Promise<FuelPump | null>;
  onUpdatePump: (id: string, data: Partial<FuelPump>) => Promise<boolean>;
}

export function PumpSetupForm({ open, onOpenChange, editPump, onCreatePump, onUpdatePump }: PumpSetupFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [pumpName, setPumpName] = useState("");
  const [pumpNumber, setPumpNumber] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [lifetimeMeter, setLifetimeMeter] = useState("0");

  // Reset form when opening or when editPump changes
  useEffect(() => {
    if (open) {
      if (editPump) {
        setPumpName(editPump.pump_name || "");
        setPumpNumber(editPump.pump_number || "");
        setFuelType(editPump.fuel_type || "");
        setLifetimeMeter(editPump.lifetime_meter_gallons?.toString() || "0");
      } else {
        // Reset to defaults for new pump
        setPumpName("");
        setPumpNumber("");
        setFuelType("");
        setLifetimeMeter("0");
      }
    }
  }, [open, editPump]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pumpName || !fuelType) return;

    setLoading(true);
    
    const pumpData = {
      pump_name: pumpName,
      pump_number: pumpNumber || null,
      tank_id: null,
      fuel_type: fuelType,
      lifetime_meter_gallons: parseFloat(lifetimeMeter || "0"),
      is_active: true,
    };

    let success = false;
    if (editPump) {
      success = await onUpdatePump(editPump.id, pumpData);
    } else {
      const result = await onCreatePump(pumpData);
      success = !!result;
    }

    setLoading(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            {editPump ? "Edit Pump" : "Add Fuel Pump"}
          </SheetTitle>
          <SheetDescription>
            {editPump ? "Update pump configuration" : "Configure a new fuel pump"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Pump Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Pump Name *</Label>
            <Input
              id="name"
              type="text"
              value={pumpName}
              onChange={(e) => setPumpName(e.target.value)}
              placeholder="e.g., Dock A Pump"
              required
            />
          </div>

          {/* Pump Number */}
          <div className="space-y-2">
            <Label htmlFor="number">Pump Number</Label>
            <Input
              id="number"
              type="text"
              value={pumpNumber}
              onChange={(e) => setPumpNumber(e.target.value)}
              placeholder="e.g., 1, 2, A"
            />
          </div>

          {/* Fuel Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type *</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose fuel type" />
              </SelectTrigger>
              <SelectContent
                className="z-[200]"
                position="popper"
                sideOffset={4}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {FUEL_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pump will draw from all active tanks of this fuel type
            </p>
          </div>

          {/* Lifetime Meter Reading */}
          <div className="space-y-2">
            <Label htmlFor="meter">Lifetime Meter Reading (gallons)</Label>
            <Input
              id="meter"
              type="number"
              step="0.01"
              min="0"
              value={lifetimeMeter}
              onChange={(e) => setLifetimeMeter(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Current meter reading on the pump
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !pumpName || !fuelType}>
            {loading ? "Saving..." : editPump ? "Update Pump" : "Add Pump"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
