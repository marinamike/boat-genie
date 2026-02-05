import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FuelReconciliation, FuelTank, TankReading } from "@/hooks/useFuelManagement";
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Droplets, Fuel, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReconciliationDetailSheet } from "./ReconciliationDetailSheet";

interface DiscrepancyReportProps {
  reconciliations: FuelReconciliation[];
  tanks: FuelTank[];
}

export function DiscrepancyReport({ reconciliations }: DiscrepancyReportProps) {
  const [selectedReconciliation, setSelectedReconciliation] = useState<FuelReconciliation | null>(null);

  if (reconciliations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Discrepancy Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No reconciliation records yet. Perform a reconciliation to see discrepancy data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const groupedByDate = reconciliations.reduce((acc, rec) => {
    const date = format(new Date(rec.recorded_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(rec);
    return acc;
  }, {} as Record<string, FuelReconciliation[]>);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Discrepancy Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupedByDate).slice(0, 7).map(([date, recs]) => (
            <div key={date} className="border-b pb-4 last:border-0 last:pb-0">
              <p className="font-medium text-sm mb-3">
                {format(new Date(date), "EEEE, MMMM d, yyyy")}
              </p>
              <div className="space-y-3">
                {recs.map(rec => {
                  const isSignificant = Math.abs(rec.discrepancy_percentage) > 2;
                  const isPositive = rec.discrepancy_gallons >= 0;
                  const fuelTypeLabel = rec.fuel_type 
                    ? rec.fuel_type.charAt(0).toUpperCase() + rec.fuel_type.slice(1)
                    : "Unknown";

                  // Parse tank readings if available
                  const tankReadings: TankReading[] = Array.isArray(rec.tank_readings) 
                    ? rec.tank_readings 
                    : [];

                  return (
                    <div 
                      key={rec.id} 
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors hover:ring-2 hover:ring-primary/20",
                        isSignificant 
                          ? "bg-destructive/10 hover:bg-destructive/15" 
                          : "bg-muted/50 hover:bg-muted"
                      )}
                      onClick={() => setSelectedReconciliation(rec)}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isSignificant ? (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-medium text-sm">{fuelTypeLabel}</span>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(rec.recorded_at), "h:mm a")}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={isSignificant ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {isSignificant ? "Review" : "OK"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Tank Details (if multiple tanks) */}
                      {tankReadings.length > 1 && (
                        <div className="mb-2 space-y-1">
                          {tankReadings.map((tr, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs pl-6">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Droplets className="h-3 w-3" />
                                {tr.tank_name}
                              </span>
                              <span className={cn(
                                tr.discrepancy_gallons >= 0 ? "text-primary" : "text-destructive"
                              )}>
                                {tr.discrepancy_gallons >= 0 ? "+" : ""}{tr.discrepancy_gallons.toFixed(1)} gal
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Summary */}
                      <div className="flex items-center justify-between pl-6">
                        <span className="text-xs text-muted-foreground">
                          {tankReadings.length > 1 ? "Combined:" : "Discrepancy:"}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3 text-primary" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-destructive" />
                            )}
                            <span className={cn(
                              "font-semibold text-sm",
                              isPositive ? "text-primary" : "text-destructive"
                            )}>
                              {isPositive ? "+" : ""}{rec.discrepancy_gallons.toFixed(1)} gal
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({rec.discrepancy_percentage >= 0 ? "+" : ""}
                            {rec.discrepancy_percentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>

                      {/* Pump Totalizers Summary */}
                      {rec.pump_totalizer_readings && rec.pump_totalizer_readings.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-muted">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Fuel className="h-3 w-3" />
                            Pump Totalizers
                          </div>
                          <div className="space-y-1">
                            {rec.pump_totalizer_readings.map((ptr, idx) => {
                              const pumpDisc = ptr.meter_reading - ptr.expected_reading;
                              return (
                                <div key={idx} className="flex items-center justify-between text-xs pl-4">
                                  <span className="text-muted-foreground">{ptr.pump_name}</span>
                                  <span className={cn(
                                    Math.abs(pumpDisc) <= 10 ? "text-primary" : "text-destructive"
                                  )}>
                                    {pumpDisc >= 0 ? "+" : ""}{pumpDisc.toFixed(1)} gal
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ReconciliationDetailSheet
        reconciliation={selectedReconciliation}
        open={!!selectedReconciliation}
        onOpenChange={(open) => !open && setSelectedReconciliation(null)}
      />
    </>
  );
}
