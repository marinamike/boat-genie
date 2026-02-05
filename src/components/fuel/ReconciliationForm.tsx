import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelTank, FuelPump, PumpTotalizerReading } from "@/hooks/useFuelManagement";
import { ClipboardCheck, AlertTriangle, CheckCircle, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tanks: FuelTank[];
  pumps: FuelPump[];
  onRecordReconciliation: (data: {
    tank_id: string;
    physical_reading_gallons: number;
    measurement_type: "gallons" | "inches";
    raw_measurement?: number;
    pump_totalizer_readings?: PumpTotalizerReading[];
    notes?: string;
  }) => Promise<unknown>;
}

interface PumpReading {
  pump_id: string;
  pump_name: string;
  expected_reading: number;
  actual_reading: string;
}

export function ReconciliationForm({ open, onOpenChange, tanks, pumps, onRecordReconciliation }: ReconciliationFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [tankId, setTankId] = useState("");
  const [measurementType, setMeasurementType] = useState<"gallons" | "inches">("gallons");
  const [physicalReading, setPhysicalReading] = useState("");
  const [pumpReadings, setPumpReadings] = useState<PumpReading[]>([]);
  const [notes, setNotes] = useState("");

  const selectedTank = tanks.find(t => t.id === tankId);
  const theoretical = selectedTank?.current_volume_gallons || 0;
  const physical = parseFloat(physicalReading || "0");
  const discrepancy = physical - theoretical;
  const discrepancyPercentage = theoretical > 0 ? (discrepancy / theoretical) * 100 : 0;

  // Get pumps matching the selected tank's fuel type
  const matchingPumps = selectedTank 
    ? pumps.filter(p => p.fuel_type === selectedTank.fuel_type && p.is_active)
    : [];

  // Update pump readings when tank selection changes
  useEffect(() => {
    if (selectedTank) {
      const newPumpReadings = matchingPumps.map(pump => ({
        pump_id: pump.id,
        pump_name: pump.pump_name,
        expected_reading: pump.lifetime_meter_gallons,
        actual_reading: "",
      }));
      setPumpReadings(newPumpReadings);
    } else {
      setPumpReadings([]);
    }
  }, [tankId, selectedTank?.fuel_type]);

  const handlePumpReadingChange = (pumpId: string, value: string) => {
    setPumpReadings(prev => 
      prev.map(pr => 
        pr.pump_id === pumpId ? { ...pr, actual_reading: value } : pr
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankId || !physicalReading) return;

    setLoading(true);
    
    // Build pump totalizer readings array (only include pumps with actual readings)
    const pumpTotalizerReadings: PumpTotalizerReading[] = pumpReadings
      .filter(pr => pr.actual_reading !== "")
      .map(pr => ({
        pump_id: pr.pump_id,
        pump_name: pr.pump_name,
        meter_reading: parseFloat(pr.actual_reading),
        expected_reading: pr.expected_reading,
      }));

    const result = await onRecordReconciliation({
      tank_id: tankId,
      physical_reading_gallons: physical,
      measurement_type: measurementType,
      raw_measurement: measurementType === "inches" ? physical : undefined,
      pump_totalizer_readings: pumpTotalizerReadings.length > 0 ? pumpTotalizerReadings : undefined,
      notes: notes || undefined,
    });

    setLoading(false);
    
    if (result) {
      // Reset form
      setTankId("");
      setPhysicalReading("");
      setPumpReadings([]);
      setNotes("");
      onOpenChange(false);
    }
  };

  const isSignificantDiscrepancy = Math.abs(discrepancyPercentage) > 2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Tank Reconciliation
          </SheetTitle>
          <SheetDescription>
            Enter physical dip/stick measurement and pump totalizers
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Tank Selection */}
          <div className="space-y-2">
            <Label htmlFor="tank">Select Tank *</Label>
            <Select value={tankId} onValueChange={setTankId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tank" />
              </SelectTrigger>
              <SelectContent>
                {tanks.filter(t => t.is_active).map(tank => (
                  <SelectItem key={tank.id} value={tank.id}>
                    {tank.tank_name} - {tank.fuel_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theoretical Volume Display */}
          {selectedTank && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Theoretical Volume</span>
                <span className="font-semibold">{theoretical.toLocaleString()} gal</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on deliveries minus sales
              </p>
            </div>
          )}

          {/* Measurement Type */}
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

          {/* Physical Reading */}
          <div className="space-y-2">
            <Label htmlFor="reading">Physical Reading ({measurementType}) *</Label>
            <Input
              id="reading"
              type="number"
              step="0.01"
              min="0"
              value={physicalReading}
              onChange={(e) => setPhysicalReading(e.target.value)}
              placeholder={measurementType === "gallons" ? "Enter gallons" : "Enter inches"}
              required
            />
            {measurementType === "inches" && (
              <p className="text-xs text-muted-foreground">
                Note: You'll need to convert inches to gallons based on your tank chart
              </p>
            )}
          </div>

          {/* Discrepancy Display */}
          {selectedTank && physicalReading && (
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
                    discrepancy > 0 ? "text-primary" : "text-destructive"
                  )}>
                    {discrepancy >= 0 ? "+" : ""}{discrepancy.toFixed(1)} gal
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Variance:</span>
                  <p className={cn(
                    "font-semibold",
                    Math.abs(discrepancyPercentage) <= 2 ? "text-primary" : "text-destructive"
                  )}>
                    {discrepancyPercentage >= 0 ? "+" : ""}{discrepancyPercentage.toFixed(2)}%
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
          {selectedTank && matchingPumps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Pump Totalizers ({selectedTank.fuel_type})
                </Label>
              </div>
              
              <div className="space-y-3">
                {pumpReadings.map(pr => {
                  const actualValue = parseFloat(pr.actual_reading || "0");
                  const pumpDiscrepancy = pr.actual_reading ? actualValue - pr.expected_reading : null;
                  
                  return (
                    <div key={pr.pump_id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{pr.pump_name}</span>
                        <span className="text-xs text-muted-foreground">
                          System: {pr.expected_reading.toLocaleString()} gal
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pr.actual_reading}
                          onChange={(e) => handlePumpReadingChange(pr.pump_id, e.target.value)}
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

          <Button type="submit" className="w-full" disabled={loading || !tankId || !physicalReading}>
            {loading ? "Recording..." : "Record Reconciliation"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
