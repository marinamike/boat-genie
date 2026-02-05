import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Fuel as FuelIcon } from "lucide-react";
import { StoreItem } from "@/hooks/useStoreInventory";

interface LowStockAlertsProps {
  lowStockItems: StoreItem[];
  lowFuelTanks?: Array<{
    id: string;
    tank_name: string;
    fuel_type: string;
    current_volume_gallons: number;
    low_level_threshold_gallons: number;
  }>;
}

export function LowStockAlerts({ lowStockItems, lowFuelTanks = [] }: LowStockAlertsProps) {
  const totalAlerts = lowStockItems.length + lowFuelTanks.length;

  if (totalAlerts === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Restock Needed
          <Badge variant="destructive" className="ml-auto">
            {totalAlerts}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Low Fuel Tanks */}
        {lowFuelTanks.map(tank => (
          <div 
            key={tank.id}
            className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20"
          >
            <div className="flex items-center gap-2">
              <FuelIcon className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">{tank.tank_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{tank.fuel_type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-destructive">
                {tank.current_volume_gallons.toLocaleString()} gal
              </p>
              <p className="text-xs text-muted-foreground">
                Min: {tank.low_level_threshold_gallons.toLocaleString()}
              </p>
            </div>
          </div>
        ))}

        {/* Low Stock Items */}
        {lowStockItems.slice(0, 5).map(item => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20"
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.sku || "No SKU"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-destructive">
                {item.current_quantity} left
              </p>
              <p className="text-xs text-muted-foreground">
                Min: {item.reorder_point}
              </p>
            </div>
          </div>
        ))}

        {lowStockItems.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{lowStockItems.length - 5} more items need restocking
          </p>
        )}
      </CardContent>
    </Card>
  );
}
