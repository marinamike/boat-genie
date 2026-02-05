import { useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useFuelManagement } from "@/hooks/useFuelManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TankGauge } from "@/components/fuel/TankGauge";
import { QuickSaleForm } from "@/components/fuel/QuickSaleForm";
import { DeliveryLogForm } from "@/components/fuel/DeliveryLogForm";
import { ReconciliationForm } from "@/components/fuel/ReconciliationForm";
import { TankSetupForm } from "@/components/fuel/TankSetupForm";
import { PumpSetupForm } from "@/components/fuel/PumpSetupForm";
import { DiscrepancyReport } from "@/components/fuel/DiscrepancyReport";
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
import { format } from "date-fns";
import { 
  Fuel, 
  Truck, 
  ClipboardCheck, 
  Plus, 
  Settings, 
  Droplets,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Pencil,
  Trash2
} from "lucide-react";
import { FuelTank, FuelPump } from "@/hooks/useFuelManagement";

export default function FuelDashboard() {
  const { business, isOwner, hasModuleAccess } = useBusiness();
  const { 
    tanks, 
    pumps, 
    transactions, 
    deliveries, 
    reconciliations,
    loading,
    createTank,
    updateTank,
    deleteTank,
    createPump,
    updatePump,
    deletePump,
    recordSale,
    recordDelivery,
    recordReconciliation,
  } = useFuelManagement();

  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showReconciliationForm, setShowReconciliationForm] = useState(false);
  const [showTankSetup, setShowTankSetup] = useState(false);
  const [showPumpSetup, setShowPumpSetup] = useState(false);
  const [editingTank, setEditingTank] = useState<FuelTank | null>(null);
  const [deletingPump, setDeletingPump] = useState<FuelPump | null>(null);
  const [isDeletingPump, setIsDeletingPump] = useState(false);
  const [editingPump, setEditingPump] = useState<FuelPump | null>(null);

  const canWrite = isOwner || hasModuleAccess("fuel", "write");

  // Calculate stats
  const todaysSales = transactions
    .filter(t => new Date(t.recorded_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.total_amount, 0);

  const todaysGallons = transactions
    .filter(t => new Date(t.recorded_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.gallons_sold, 0);

  const lowTanks = tanks.filter(t => t.current_volume_gallons <= t.low_level_threshold_gallons);

  const handleDeletePump = async () => {
    if (!deletingPump) return;
    setIsDeletingPump(true);
    await deletePump(deletingPump.id);
    setIsDeletingPump(false);
    setDeletingPump(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fuel className="h-6 w-6" />
            Fuel Management
          </h1>
          <p className="text-muted-foreground">
            {business?.business_name}
          </p>
        </div>
        
        {canWrite && (
          <Button variant="outline" size="sm" onClick={() => setShowTankSetup(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Today's Sales</span>
            </div>
            <p className="text-2xl font-bold mt-1">${todaysSales.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Gallons Today</span>
            </div>
            <p className="text-2xl font-bold mt-1">{todaysGallons.toFixed(1)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Active Tanks</span>
            </div>
            <p className="text-2xl font-bold mt-1">{tanks.filter(t => t.is_active).length}</p>
          </CardContent>
        </Card>
        
        <Card className={lowTanks.length > 0 ? "border-destructive/50" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${lowTanks.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <span className="text-sm text-muted-foreground">Low Level Alerts</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${lowTanks.length > 0 ? "text-destructive" : ""}`}>
              {lowTanks.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowSaleForm(true)} className="flex-1 md:flex-none">
          <Fuel className="h-4 w-4 mr-2" />
          Log Fuel Sale
        </Button>
        
        {canWrite && (
          <>
            <Button variant="outline" onClick={() => setShowDeliveryForm(true)} className="flex-1 md:flex-none">
              <Truck className="h-4 w-4 mr-2" />
              Record Delivery
            </Button>
            
            <Button variant="outline" onClick={() => setShowReconciliationForm(true)} className="flex-1 md:flex-none">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Tank Reconciliation
            </Button>
          </>
        )}
      </div>

      <Tabs defaultValue="tanks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tanks">Tanks</TabsTrigger>
          <TabsTrigger value="transactions">Sales</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="tanks" className="mt-4">
          {tanks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Fuel Tanks Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Add your fuel tanks to start tracking inventory
                </p>
                {canWrite && (
                  <Button onClick={() => setShowTankSetup(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tank
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tanks.map(tank => (
                  <TankGauge 
                    key={tank.id} 
                    tank={tank} 
                    canEdit={canWrite}
                    onEdit={() => {
                      setEditingTank(tank);
                      setShowTankSetup(true);
                    }}
                    onDelete={() => deleteTank(tank.id)}
                  />
                ))}
              </div>

              {/* Pumps Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Fuel Pumps</CardTitle>
                  {canWrite && (
                    <Button variant="outline" size="sm" onClick={() => setShowPumpSetup(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pump
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {pumps.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No pumps configured yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pumps.map(pump => (
                        <div 
                          key={pump.id} 
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
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
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {pump.lifetime_meter_gallons.toLocaleString()} gal
                              </p>
                              <p className="text-xs text-muted-foreground">Lifetime</p>
                            </div>
                            {canWrite && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingPump(pump);
                                    setShowPumpSetup(true);
                                  }}
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
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Fuel Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No fuel sales recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 20).map(tx => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {tx.gallons_sold.toFixed(2)} gal {tx.tank?.fuel_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.vessel_name || "Walk-in"} • {tx.pump?.pump_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.recorded_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          ${tx.total_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${tx.price_per_gallon.toFixed(2)}/gal
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fuel Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {deliveries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No deliveries recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {deliveries.slice(0, 20).map(delivery => (
                    <div 
                      key={delivery.id} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {delivery.gallons_delivered.toLocaleString()} gal to {delivery.tank?.tank_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.vendor_name || "Unknown vendor"}
                          {delivery.invoice_number && ` • Invoice: ${delivery.invoice_number}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(delivery.delivery_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      {delivery.total_cost && (
                        <div className="text-right">
                          <p className="font-semibold">
                            ${delivery.total_cost.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${delivery.cost_per_gallon?.toFixed(2)}/gal
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <DiscrepancyReport reconciliations={reconciliations} tanks={tanks} />
        </TabsContent>
      </Tabs>

      {/* Forms - now receiving mutation handlers from single hook instance */}
      <QuickSaleForm 
        open={showSaleForm} 
        onOpenChange={setShowSaleForm} 
        pumps={pumps}
        onRecordSale={recordSale}
      />
      
      <DeliveryLogForm 
        open={showDeliveryForm} 
        onOpenChange={setShowDeliveryForm} 
        tanks={tanks}
        onRecordDelivery={recordDelivery}
      />
      
      <ReconciliationForm 
        open={showReconciliationForm} 
        onOpenChange={setShowReconciliationForm} 
        tanks={tanks}
        onRecordReconciliation={recordReconciliation}
      />
      
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
        tanks={tanks}
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
