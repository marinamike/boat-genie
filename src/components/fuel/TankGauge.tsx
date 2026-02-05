import { useState } from "react";
import { cn } from "@/lib/utils";
import { Droplets, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { FuelTank } from "@/hooks/useFuelManagement";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TankGaugeProps {
  tank: FuelTank;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => Promise<boolean>;
  canEdit?: boolean;
}

export function TankGauge({ tank, onClick, onEdit, onDelete, canEdit = false }: TankGaugeProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div 
        onClick={onClick}
        className={cn(
          "relative p-4 rounded-xl border bg-card transition-all hover:shadow-lg hover:border-primary/30",
          onClick && "cursor-pointer",
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
          <div className="flex items-center gap-1">
            {isLow && (
              <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
            )}
            {canEdit && onEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canEdit && onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tank</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tank.tank_name}"? This action cannot be undone.
              Any linked pumps must be removed first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
