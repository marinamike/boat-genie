import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelTank, FuelReconciliation } from "@/hooks/useFuelManagement";
import { ClipboardCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tanks: FuelTank[];
  onRecordReconciliation: (data: {
    tank_id: string;
    physical_reading_gallons: number;
    measurement_type: "gallons" | "inches";
    raw_measurement?: number;
    notes?: string;
  }) => Promise<unknown>;
}

export function ReconciliationForm({ open, onOpenChange, tanks, onRecordReconciliation }: ReconciliationFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [tankId, setTankId] = useState("");
  const [measurementType, setMeasurementType] = useState<"gallons" | "inches">("gallons");
  const [physicalReading, setPhysicalReading] = useState("");
  const [notes, setNotes] = useState("");

  const selectedTank = tanks.find(t => t.id === tankId);
  const theoretical = selectedTank?.current_volume_gallons || 0;
  const physical = parseFloat(physicalReading || "0");
  const discrepancy = physical - theoretical;
  const discrepancyPercentage = theoretical > 0 ? (discrepancy / theoretical) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankId || !physicalReading) return;

    setLoading(true);
    const result = await onRecordReconciliation({
      tank_id: tankId,
      physical_reading_gallons: physical,
      measurement_type: measurementType,
      raw_measurement: measurementType === "inches" ? physical : undefined,
      notes: notes || undefined,
    });

    setLoading(false);
    
    if (result) {
      // Reset form
      setTankId("");
      setPhysicalReading("");
      setNotes("");
      onOpenChange(false);
    }
  };

  const isSignificantDiscrepancy = Math.abs(discrepancyPercentage) > 2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Tank Reconciliation
          </SheetTitle>
          <SheetDescription>
            Enter physical dip/stick measurement
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
