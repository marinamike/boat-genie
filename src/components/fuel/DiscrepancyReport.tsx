import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FuelReconciliation, FuelTank } from "@/hooks/useFuelManagement";
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscrepancyReportProps {
  reconciliations: FuelReconciliation[];
  tanks: FuelTank[];
}

export function DiscrepancyReport({ reconciliations, tanks }: DiscrepancyReportProps) {
  if (reconciliations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Discrepancy Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No reconciliation records yet. Perform a tank dip to see discrepancy data.
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Discrepancy Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedByDate).slice(0, 7).map(([date, recs]) => (
          <div key={date} className="border-b pb-4 last:border-0 last:pb-0">
            <p className="font-medium text-sm mb-2">
              {format(new Date(date), "EEEE, MMMM d, yyyy")}
            </p>
            <div className="space-y-2">
              {recs.map(rec => {
                const tank = tanks.find(t => t.id === rec.tank_id);
                const isSignificant = Math.abs(rec.discrepancy_percentage) > 2;
                const isPositive = rec.discrepancy_gallons >= 0;

                return (
                  <div 
                    key={rec.id} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      isSignificant 
                        ? "bg-destructive/10" 
                        : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {isSignificant ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {tank?.tank_name || "Unknown Tank"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(rec.recorded_at), "h:mm a")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
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
                        <p className="text-xs text-muted-foreground">
                          {rec.discrepancy_percentage >= 0 ? "+" : ""}
                          {rec.discrepancy_percentage.toFixed(2)}% variance
                        </p>
                      </div>
                      
                      <Badge 
                        variant={isSignificant ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {isSignificant ? "Review" : "OK"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
