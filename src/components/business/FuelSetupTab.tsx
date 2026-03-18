import { useState } from "react";
import { useFuelManagement, FuelTank, FuelPump } from "@/hooks/useFuelManagement";
import { useBusiness } from "@/contexts/BusinessContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TankSetupForm } from "@/components/fuel/TankSetupForm";
import { PumpSetupForm } from "@/components/fuel/PumpSetupForm";
import { PriceController } from "@/components/fuel/PriceController";
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
import { Plus, Droplets, Fuel, Pencil, Trash2 } from "lucide-react";

export function FuelSetupTab() {
  const { isOwner } = useBusiness();
  const {
    tanks,
    pumps,
    loading,
    createTank,
    updateTank,
    deleteTank,
    createPump,
    updatePump,
    deletePump,
  } = useFuelManagement();

  const [showTankSetup, setShowTankSetup] = useState(false);
  const [editingTank, setEditingTank] = useState<FuelTank | null>(null);
  const [showPumpSetup, setShowPumpSetup] = useState(false);
  const [editingPump, setEditingPump] = useState<FuelPump | null>(null);
  const [deletingPump, setDeletingPump] = useState<FuelPump | null>(null);
  const [isDeletingPump, setIsDeletingPump] = useState(false);

  const handleDeletePump = async () => {
    if (!deletingPump) return;
    setIsDeletingPump(true);
    await deletePump(deletingPump.id);
    setIsDeletingPump(false);
    setDeletingPump(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tanks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Tanks
          </CardTitle>
          <Button size="sm" onClick={() => { setEditingTank(null); setShowTankSetup(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tank
          </Button>
        </CardHeader>
        <CardContent>
          {tanks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No tanks configured yet. Add your first tank to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {tanks.map(tank => (
                <div
                  key={tank.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">{tank.tank_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tank.fuel_type} • {tank.total_capacity_gallons.toLocaleString()} gal capacity
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Low alert at {tank.low_level_threshold_gallons.toLocaleString()} gal
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingTank(tank); setShowTankSetup(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteTank(tank.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pumps Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Pumps
          </CardTitle>
          <Button size="sm" onClick={() => { setEditingPump(null); setShowPumpSetup(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Pump
          </Button>
        </CardHeader>
        <CardContent>
          {pumps.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No pumps configured yet. Add tanks first, then add pumps.
            </p>
          ) : (
            <div className="space-y-3">
              {pumps.map(pump => (
                <div
                  key={pump.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Fuel className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{pump.pump_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pump.tank?.tank_name} • {pump.tank?.fuel_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="text-sm font-medium">
                        {pump.lifetime_meter_gallons.toLocaleString()} gal
                      </p>
                      <p className="text-xs text-muted-foreground">Lifetime</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingPump(pump); setShowPumpSetup(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletingPump(pump)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Section */}
      <PriceController isOwner={isOwner} />

      {/* Setup Forms */}
      <TankSetupForm
        open={showTankSetup}
        onOpenChange={(open) => {
          setShowTankSetup(open);
          if (!open) setEditingTank(null);
        }}
        editTank={editingTank}
        onCreateTank={createTank}
        onUpdateTank={updateTank}
      />

      <PumpSetupForm
        open={showPumpSetup}
        onOpenChange={(open) => {
          setShowPumpSetup(open);
          if (!open) setEditingPump(null);
        }}
        editPump={editingPump}
        onCreatePump={createPump}
        onUpdatePump={updatePump}
      />

      {/* Delete Pump Confirmation */}
      <AlertDialog open={!!deletingPump} onOpenChange={(open) => !open && setDeletingPump(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pump</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPump?.pump_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPump}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePump}
              disabled={isDeletingPump}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingPump ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
