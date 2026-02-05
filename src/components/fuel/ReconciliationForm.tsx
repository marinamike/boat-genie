import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelTank, FuelPump, PumpTotalizerReading, TankReading } from "@/hooks/useFuelManagement";
import { ClipboardCheck, AlertTriangle, CheckCircle, Fuel, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tanks: FuelTank[];
  pumps: FuelPump[];
  onRecordReconciliation: (data: {
    fuel_type: string;
    tank_readings: TankReading[];
    pump_totalizer_readings?: PumpTotalizerReading[];
    measurement_type: "gallons" | "inches";
    notes?: string;
  }) => Promise<unknown>;
}

interface TankInput {
  tank_id: string;
  tank_name: string;
  theoretical_gallons: number;
  physical_reading: string;
}

interface PumpInput {
  pump_id: string;
  pump_name: string;
  expected_reading: number;
  actual_reading: string;
}

export function ReconciliationForm({ open, onOpenChange, tanks, pumps, onRecordReconciliation }: ReconciliationFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [fuelType, setFuelType] = useState("");
  const [measurementType, setMeasurementType] = useState<"gallons" | "inches">("gallons");
  const [tankInputs, setTankInputs] = useState<TankInput[]>([]);
  const [pumpInputs, setPumpInputs] = useState<PumpInput[]>([]);
  const [notes, setNotes] = useState("");

  // Get unique fuel types that have active tanks
  const availableFuelTypes = useMemo(() => {
    const types = new Set(tanks.filter(t => t.is_active).map(t => t.fuel_type));
    return Array.from(types);
  }, [tanks]);

  // Get tanks matching selected fuel type
  const matchingTanks = useMemo(() => 
    tanks.filter(t => t.fuel_type === fuelType && t.is_active),
    [tanks, fuelType]
  );

  // Get pumps matching selected fuel type
  const matchingPumps = useMemo(() => 
    pumps.filter(p => p.fuel_type === fuelType && p.is_active),
    [pumps, fuelType]
  );

  // Calculate totals
  const totalTheoretical = tankInputs.reduce((sum, t) => sum + t.theoretical_gallons, 0);
  const totalPhysical = tankInputs.reduce((sum, t) => sum + parseFloat(t.physical_reading || "0"), 0);
  const totalDiscrepancy = totalPhysical - totalTheoretical;
  const totalDiscrepancyPercentage = totalTheoretical > 0 ? (totalDiscrepancy / totalTheoretical) * 100 : 0;
  const isSignificantDiscrepancy = Math.abs(totalDiscrepancyPercentage) > 2;

  // Update tank/pump inputs when fuel type changes
  useEffect(() => {
    if (fuelType) {
      setTankInputs(matchingTanks.map(tank => ({
        tank_id: tank.id,
        tank_name: tank.tank_name,
        theoretical_gallons: tank.current_volume_gallons,
        physical_reading: "",
      })));
      
      setPumpInputs(matchingPumps.map(pump => ({
        pump_id: pump.id,
        pump_name: pump.pump_name,
        expected_reading: pump.lifetime_meter_gallons,
        actual_reading: "",
      })));
    } else {
      setTankInputs([]);
      setPumpInputs([]);
    }
  }, [fuelType, matchingTanks.length, matchingPumps.length]);

  const handleTankReadingChange = (tankId: string, value: string) => {
    setTankInputs(prev => 
      prev.map(ti => 
        ti.tank_id === tankId ? { ...ti, physical_reading: value } : ti
      )
    );
  };

  const handlePumpReadingChange = (pumpId: string, value: string) => {
    setPumpInputs(prev => 
      prev.map(pi => 
        pi.pump_id === pumpId ? { ...pi, actual_reading: value } : pi
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelType || tankInputs.every(t => !t.physical_reading)) return;

    setLoading(true);
    
    // Build tank readings array (only include tanks with physical readings)
    const tankReadings: TankReading[] = tankInputs
      .filter(ti => ti.physical_reading !== "")
      .map(ti => {
        const physical = parseFloat(ti.physical_reading);
        return {
          tank_id: ti.tank_id,
          tank_name: ti.tank_name,
          theoretical_gallons: ti.theoretical_gallons,
          physical_gallons: physical,
          discrepancy_gallons: physical - ti.theoretical_gallons,
        };
      });

    // Build pump totalizer readings array (only include pumps with actual readings)
    const pumpTotalizerReadings: PumpTotalizerReading[] = pumpInputs
      .filter(pi => pi.actual_reading !== "")
      .map(pi => ({
        pump_id: pi.pump_id,
        pump_name: pi.pump_name,
        meter_reading: parseFloat(pi.actual_reading),
        expected_reading: pi.expected_reading,
      }));

    const result = await onRecordReconciliation({
      fuel_type: fuelType,
      tank_readings: tankReadings,
      pump_totalizer_readings: pumpTotalizerReadings.length > 0 ? pumpTotalizerReadings : undefined,
      measurement_type: measurementType,
      notes: notes || undefined,
    });

    setLoading(false);
    
    if (result) {
      // Reset form
      setFuelType("");
      setTankInputs([]);
      setPumpInputs([]);
      setNotes("");
      onOpenChange(false);
    }
  };

  const hasAnyTankReading = tankInputs.some(t => t.physical_reading !== "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Product Reconciliation
          </SheetTitle>
          <SheetDescription>
            Reconcile all tanks and pumps by fuel type
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Fuel Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="fuelType">Select Fuel Type *</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose fuel type" />
              </SelectTrigger>
              <SelectContent>
                {availableFuelTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Measurement Type */}
          {fuelType && (
            <div className="space-y-2">
              <Label>Measurement Type</Label>
              <RadioGroup 
                value={measurementType} 
                onValueChange={(v) => setMeasurementType(v as "gallons" | "inches")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gallons" id="gallons" />
                  <Label htmlFor="gallons" className="cursor-pointer">Gallons</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inches" id="inches" />
                  <Label htmlFor="inches" className="cursor-pointer">Inches</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Tank Readings Section */}
          {fuelType && tankInputs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Tank Readings ({fuelType.charAt(0).toUpperCase() + fuelType.slice(1)})
                </Label>
              </div>
              
              <div className="space-y-3">
                {tankInputs.map(ti => {
                  const physical = parseFloat(ti.physical_reading || "0");
                  const discrepancy = ti.physical_reading ? physical - ti.theoretical_gallons : null;
                  const discrepancyPct = ti.theoretical_gallons > 0 && discrepancy !== null
                    ? (discrepancy / ti.theoretical_gallons) * 100
                    : null;
                  
                  return (
                    <div key={ti.tank_id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{ti.tank_name}</span>
                        <span className="text-xs text-muted-foreground">
                          Theoretical: {ti.theoretical_gallons.toLocaleString()} gal
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ti.physical_reading}
                          onChange={(e) => handleTankReadingChange(ti.tank_id, e.target.value)}
                          placeholder={`Physical reading (${measurementType})`}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {measurementType}
                        </span>
                      </div>
                      
                      {discrepancy !== null && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Discrepancy:</span>
                          <span className={cn(
                            "font-medium",
                            discrepancyPct !== null && Math.abs(discrepancyPct) <= 2 ? "text-primary" : "text-destructive"
                          )}>
                            {discrepancy >= 0 ? "+" : ""}{discrepancy.toFixed(1)} gal
                            {discrepancyPct !== null && ` (${discrepancyPct >= 0 ? "+" : ""}${discrepancyPct.toFixed(1)}%)`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Combined Summary */}
          {fuelType && hasAnyTankReading && tankInputs.length > 1 && (
            <div className={cn(
              "p-4 rounded-lg border",
              isSignificantDiscrepancy 
                ? "bg-destructive/10 border-destructive/30" 
                : "bg-primary/10 border-primary/30"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {isSignificantDiscrepancy ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold text-sm">
                  Combined {fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} Summary
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Theoretical</span>
                  <p className="font-semibold">{totalTheoretical.toLocaleString()} gal</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Physical</span>
                  <p className="font-semibold">{totalPhysical.toLocaleString()} gal</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Discrepancy</span>
                  <p className={cn(
                    "font-semibold",
                    isSignificantDiscrepancy ? "text-destructive" : "text-primary"
                  )}>
                    {totalDiscrepancy >= 0 ? "+" : ""}{totalDiscrepancy.toFixed(1)} gal
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Single tank discrepancy display */}
          {fuelType && hasAnyTankReading && tankInputs.length === 1 && (
            <div className={cn(
              "p-4 rounded-lg border",
              isSignificantDiscrepancy 
                ? "bg-destructive/10 border-destructive/30" 
                : "bg-primary/10 border-primary/30"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {isSignificantDiscrepancy ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold">
                  {isSignificantDiscrepancy ? "Significant Discrepancy" : "Within Tolerance"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Discrepancy:</span>
                  <p className={cn(
                    "font-semibold",
                    totalDiscrepancy >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    {totalDiscrepancy >= 0 ? "+" : ""}{totalDiscrepancy.toFixed(1)} gal
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Variance:</span>
                  <p className={cn(
                    "font-semibold",
                    !isSignificantDiscrepancy ? "text-primary" : "text-destructive"
                  )}>
                    {totalDiscrepancyPercentage >= 0 ? "+" : ""}{totalDiscrepancyPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>

              {isSignificantDiscrepancy && (
                <p className="text-xs text-destructive mt-2">
                  Variance exceeds 2%. Consider investigating potential causes.
                </p>
              )}
            </div>
          )}

          {/* Pump Totalizers Section */}
          {fuelType && pumpInputs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Pump Totalizers ({fuelType.charAt(0).toUpperCase() + fuelType.slice(1)})
                </Label>
              </div>
              
              <div className="space-y-3">
                {pumpInputs.map(pi => {
                  const actualValue = parseFloat(pi.actual_reading || "0");
                  const pumpDiscrepancy = pi.actual_reading ? actualValue - pi.expected_reading : null;
                  
                  return (
                    <div key={pi.pump_id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{pi.pump_name}</span>
                        <span className="text-xs text-muted-foreground">
                          System: {pi.expected_reading.toLocaleString()} gal
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pi.actual_reading}
                          onChange={(e) => handlePumpReadingChange(pi.pump_id, e.target.value)}
                          placeholder="Actual totalizer reading"
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">gal</span>
                      </div>
                      
                      {pumpDiscrepancy !== null && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Discrepancy:</span>
                          <span className={cn(
                            "font-medium",
                            Math.abs(pumpDiscrepancy) <= 10 ? "text-primary" : "text-destructive"
                          )}>
                            {pumpDiscrepancy >= 0 ? "+" : ""}{pumpDiscrepancy.toFixed(1)} gal
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Optional: Enter the physical totalizer reading from each pump's meter
              </p>
            </div>
          )}

          {/* Notes */}
          {fuelType && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations or explanations..."
                rows={2}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !fuelType || !hasAnyTankReading}
          >
            {loading ? "Recording..." : "Record Reconciliation"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
