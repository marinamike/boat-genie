import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FuelReconciliation, TankReading, PumpTotalizerReading } from "@/hooks/useFuelManagement";
import { 
  AlertTriangle, 
  CheckCircle, 
  Droplets, 
  Fuel, 
  TrendingDown, 
  TrendingUp,
  FileText,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationDetailSheetProps {
  reconciliation: FuelReconciliation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReconciliationDetailSheet({ 
  reconciliation, 
  open, 
  onOpenChange 
}: ReconciliationDetailSheetProps) {
  if (!reconciliation) return null;

  const isSignificant = Math.abs(reconciliation.discrepancy_percentage) > 2;
  const isPositive = reconciliation.discrepancy_gallons >= 0;
  const fuelTypeLabel = reconciliation.fuel_type 
    ? reconciliation.fuel_type.charAt(0).toUpperCase() + reconciliation.fuel_type.slice(1)
    : "Unknown";

  const tankReadings: TankReading[] = Array.isArray(reconciliation.tank_readings) 
    ? reconciliation.tank_readings 
    : [];

  const pumpReadings: PumpTotalizerReading[] = Array.isArray(reconciliation.pump_totalizer_readings)
    ? reconciliation.pump_totalizer_readings
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {isSignificant ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-primary" />
              )}
              {fuelTypeLabel} Reconciliation
            </SheetTitle>
            <Badge variant={isSignificant ? "destructive" : "secondary"}>
              {isSignificant ? "Review Required" : "OK"}
            </Badge>
          </div>
          <SheetDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {format(new Date(reconciliation.recorded_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Section */}
          <div className={cn(
            "p-4 rounded-lg",
            isSignificant ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <h4 className="text-sm font-medium mb-3">Overall Discrepancy</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <span className={cn(
                  "text-2xl font-bold",
                  isPositive ? "text-primary" : "text-destructive"
                )}>
                  {isPositive ? "+" : ""}{reconciliation.discrepancy_gallons.toFixed(1)} gal
                </span>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {reconciliation.discrepancy_percentage >= 0 ? "+" : ""}
                {reconciliation.discrepancy_percentage.toFixed(2)}%
              </Badge>
            </div>
          </div>

          {/* Tank Readings Section */}
          {tankReadings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Tank Readings</h4>
              </div>
              <div className="space-y-3">
                {tankReadings.map((tr, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{tr.tank_name}</span>
                      <Badge 
                        variant={tr.discrepancy_gallons >= 0 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {tr.discrepancy_gallons >= 0 ? "+" : ""}{tr.discrepancy_gallons.toFixed(1)} gal
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Theoretical</p>
                        <p className="font-medium">{tr.theoretical_gallons.toLocaleString()} gal</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Physical Reading</p>
                        <p className="font-medium">{tr.physical_gallons.toLocaleString()} gal</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Pump Totalizer Readings Section */}
          {pumpReadings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Pump Totalizer Readings</h4>
              </div>
              <div className="space-y-3">
                {pumpReadings.map((ptr, idx) => {
                  const pumpDisc = ptr.meter_reading - ptr.expected_reading;
                  const isPumpOk = Math.abs(pumpDisc) <= 10;
                  return (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{ptr.pump_name}</span>
                        <Badge 
                          variant={isPumpOk ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {pumpDisc >= 0 ? "+" : ""}{pumpDisc.toFixed(1)} gal
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Expected Reading</p>
                          <p className="font-medium">{ptr.expected_reading.toLocaleString()} gal</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Actual Reading</p>
                          <p className="font-medium">{ptr.meter_reading.toLocaleString()} gal</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {reconciliation.notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Notes</h4>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {reconciliation.notes}
                </p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Recorded: {format(new Date(reconciliation.recorded_at), "PPpp")}</p>
            <p>Measurement Type: {reconciliation.measurement_type}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
