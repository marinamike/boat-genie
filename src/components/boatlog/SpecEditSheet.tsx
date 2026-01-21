import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { BoatSpecData } from "@/hooks/useBoatSpecs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpecEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specs: BoatSpecData;
  onSave: (specs: Partial<BoatSpecData>) => Promise<void>;
  saving: boolean;
}

const HULL_TYPES = [
  "Deep-V",
  "Modified-V",
  "Flat Bottom",
  "Catamaran",
  "Tri-hull",
  "Semi-Displacement",
  "Full Displacement",
  "Planing",
  "Pontoon",
  "Other",
];

export function SpecEditSheet({ open, onOpenChange, specs, onSave, saving }: SpecEditSheetProps) {
  const [formData, setFormData] = useState<Partial<BoatSpecData>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        loa_ft: specs.loa_ft,
        beam_ft: specs.beam_ft,
        draft_engines_up_ft: specs.draft_engines_up_ft,
        draft_engines_down_ft: specs.draft_engines_down_ft,
        bridge_clearance_ft: specs.bridge_clearance_ft,
        dry_weight_lbs: specs.dry_weight_lbs,
        fuel_capacity_gal: specs.fuel_capacity_gal,
        water_capacity_gal: specs.water_capacity_gal,
        holding_capacity_gal: specs.holding_capacity_gal,
        livewell_capacity_gal: specs.livewell_capacity_gal,
        cruise_speed_knots: specs.cruise_speed_knots,
        max_speed_knots: specs.max_speed_knots,
        hull_type: specs.hull_type,
        battery_type: specs.battery_type,
        battery_count: specs.battery_count,
        battery_locations: specs.battery_locations,
        shore_power: specs.shore_power,
        max_hp: specs.max_hp,
      });
    }
  }, [open, specs]);

  const handleChange = (field: keyof BoatSpecData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof BoatSpecData, value: string) => {
    const numVal = value === "" ? null : parseFloat(value);
    handleChange(field, numVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>Edit Vessel Specs</SheetTitle>
          <SheetDescription>
            Update your vessel's specifications. These will override any defaults.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Physical Dimensions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Physical Dimensions
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loa_ft">Length (LOA)</Label>
                  <div className="relative">
                    <Input
                      id="loa_ft"
                      type="number"
                      step="0.1"
                      placeholder="32.5"
                      value={formData.loa_ft ?? ""}
                      onChange={e => handleNumberChange("loa_ft", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beam_ft">Beam</Label>
                  <div className="relative">
                    <Input
                      id="beam_ft"
                      type="number"
                      step="0.1"
                      placeholder="10.5"
                      value={formData.beam_ft ?? ""}
                      onChange={e => handleNumberChange("beam_ft", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="draft_engines_up_ft">Draft (Engines Up)</Label>
                  <div className="relative">
                    <Input
                      id="draft_engines_up_ft"
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      value={formData.draft_engines_up_ft ?? ""}
                      onChange={e => handleNumberChange("draft_engines_up_ft", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="draft_engines_down_ft">Draft (Engines Down)</Label>
                  <div className="relative">
                    <Input
                      id="draft_engines_down_ft"
                      type="number"
                      step="0.1"
                      placeholder="3.2"
                      value={formData.draft_engines_down_ft ?? ""}
                      onChange={e => handleNumberChange("draft_engines_down_ft", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bridge_clearance_ft">Bridge Clearance</Label>
                  <div className="relative">
                    <Input
                      id="bridge_clearance_ft"
                      type="number"
                      step="0.1"
                      placeholder="8.5"
                      value={formData.bridge_clearance_ft ?? ""}
                      onChange={e => handleNumberChange("bridge_clearance_ft", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dry_weight_lbs">Dry Weight</Label>
                  <div className="relative">
                    <Input
                      id="dry_weight_lbs"
                      type="number"
                      placeholder="12500"
                      value={formData.dry_weight_lbs ?? ""}
                      onChange={e => handleNumberChange("dry_weight_lbs", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">lbs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacities */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Tank Capacities
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuel_capacity_gal">Fuel</Label>
                  <div className="relative">
                    <Input
                      id="fuel_capacity_gal"
                      type="number"
                      placeholder="300"
                      value={formData.fuel_capacity_gal ?? ""}
                      onChange={e => handleNumberChange("fuel_capacity_gal", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">gal</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="water_capacity_gal">Fresh Water</Label>
                  <div className="relative">
                    <Input
                      id="water_capacity_gal"
                      type="number"
                      placeholder="50"
                      value={formData.water_capacity_gal ?? ""}
                      onChange={e => handleNumberChange("water_capacity_gal", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">gal</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holding_capacity_gal">Holding Tank</Label>
                  <div className="relative">
                    <Input
                      id="holding_capacity_gal"
                      type="number"
                      placeholder="25"
                      value={formData.holding_capacity_gal ?? ""}
                      onChange={e => handleNumberChange("holding_capacity_gal", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">gal</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="livewell_capacity_gal">Livewell</Label>
                  <div className="relative">
                    <Input
                      id="livewell_capacity_gal"
                      type="number"
                      placeholder="30"
                      value={formData.livewell_capacity_gal ?? ""}
                      onChange={e => handleNumberChange("livewell_capacity_gal", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">gal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Performance
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cruise_speed_knots">Cruise Speed</Label>
                  <div className="relative">
                    <Input
                      id="cruise_speed_knots"
                      type="number"
                      step="0.1"
                      placeholder="28"
                      value={formData.cruise_speed_knots ?? ""}
                      onChange={e => handleNumberChange("cruise_speed_knots", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kts</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_speed_knots">Max Speed</Label>
                  <div className="relative">
                    <Input
                      id="max_speed_knots"
                      type="number"
                      step="0.1"
                      placeholder="45"
                      value={formData.max_speed_knots ?? ""}
                      onChange={e => handleNumberChange("max_speed_knots", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kts</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hull_type">Hull Type</Label>
                  <Select
                    value={formData.hull_type || ""}
                    onValueChange={val => handleChange("hull_type", val || null)}
                  >
                    <SelectTrigger id="hull_type">
                      <SelectValue placeholder="Select hull type" />
                    </SelectTrigger>
                    <SelectContent>
                      {HULL_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_hp">Max HP Rating</Label>
                  <div className="relative">
                    <Input
                      id="max_hp"
                      type="number"
                      placeholder="600"
                      value={formData.max_hp ?? ""}
                      onChange={e => handleNumberChange("max_hp", e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">HP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Electrical */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Electrical System
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="battery_type">Battery Type</Label>
                  <Input
                    id="battery_type"
                    placeholder="AGM, Lithium, etc."
                    value={formData.battery_type ?? ""}
                    onChange={e => handleChange("battery_type", e.target.value || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="battery_count">Battery Count</Label>
                  <Input
                    id="battery_count"
                    type="number"
                    placeholder="4"
                    value={formData.battery_count ?? ""}
                    onChange={e => handleNumberChange("battery_count", e.target.value)}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="battery_locations">Battery Locations</Label>
                  <Input
                    id="battery_locations"
                    placeholder="Engine room, helm console"
                    value={formData.battery_locations ?? ""}
                    onChange={e => handleChange("battery_locations", e.target.value || null)}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="shore_power">Shore Power</Label>
                  <Input
                    id="shore_power"
                    placeholder="30A, 50A, Dual 50A"
                    value={formData.shore_power ?? ""}
                    onChange={e => handleChange("shore_power", e.target.value || null)}
                  />
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button type="submit" className="w-full" disabled={saving} onClick={handleSubmit}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Specs
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
