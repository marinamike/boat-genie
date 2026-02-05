import { cn } from "@/lib/utils";
import { Droplets, AlertTriangle } from "lucide-react";
import { FuelTank } from "@/hooks/useFuelManagement";

interface TankGaugeProps {
  tank: FuelTank;
  onClick?: () => void;
}

export function TankGauge({ tank, onClick }: TankGaugeProps) {
  const fillPercentage = tank.total_capacity_gallons > 0
    ? (tank.current_volume_gallons / tank.total_capacity_gallons) * 100
    : 0;
  
  const isLow = tank.current_volume_gallons <= tank.low_level_threshold_gallons;
  
  const fuelColors: Record<string, string> = {
    diesel: "from-amber-500 to-amber-600",
    gasoline: "from-emerald-500 to-emerald-600",
    premium: "from-blue-500 to-blue-600",
  };

  const fuelBgColors: Record<string, string> = {
    diesel: "bg-amber-100",
    gasoline: "bg-emerald-100",
    premium: "bg-blue-100",
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border bg-card cursor-pointer transition-all hover:shadow-lg hover:border-primary/30",
        isLow && "border-destructive/50 bg-destructive/5"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className={cn(
            "h-5 w-5",
            tank.fuel_type === "diesel" && "text-amber-500",
            tank.fuel_type === "gasoline" && "text-emerald-500",
            tank.fuel_type === "premium" && "text-blue-500",
          )} />
          <div>
            <h3 className="font-semibold text-sm">{tank.tank_name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{tank.fuel_type}</p>
          </div>
        </div>
        {isLow && (
          <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
        )}
      </div>

      {/* Vertical Tank Gauge */}
      <div className="flex gap-4">
        <div className={cn(
          "relative w-12 h-32 rounded-lg overflow-hidden border-2 border-muted",
          fuelBgColors[tank.fuel_type]
        )}>
          {/* Fill level */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t transition-all duration-500",
              fuelColors[tank.fuel_type]
            )}
            style={{ height: `${Math.min(fillPercentage, 100)}%` }}
          />
          
          {/* Level markers */}
          <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
            {[100, 75, 50, 25, 0].map((level) => (
              <div key={level} className="flex items-center">
                <div className="w-2 h-px bg-muted-foreground/50" />
                <span className="text-[8px] text-muted-foreground ml-0.5">{level}</span>
              </div>
            ))}
          </div>

          {/* Low level line */}
          {tank.total_capacity_gallons > 0 && (
            <div 
              className="absolute left-0 right-0 border-t-2 border-dashed border-destructive"
              style={{ 
                bottom: `${(tank.low_level_threshold_gallons / tank.total_capacity_gallons) * 100}%` 
              }}
            />
          )}
        </div>

        {/* Stats */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <p className="text-2xl font-bold">{fillPercentage.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Tank Level</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-medium">{tank.current_volume_gallons.toLocaleString()} gal</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Capacity:</span>
              <span className="font-medium">{tank.total_capacity_gallons.toLocaleString()} gal</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium">
                {(tank.total_capacity_gallons - tank.current_volume_gallons).toLocaleString()} gal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Last delivery */}
      {tank.last_delivery_date && (
        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
          Last delivery: {new Date(tank.last_delivery_date).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
