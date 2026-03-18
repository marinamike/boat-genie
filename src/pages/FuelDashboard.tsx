import { useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useFuelManagement, FuelDelivery } from "@/hooks/useFuelManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TankGauge } from "@/components/fuel/TankGauge";
import { QuickSaleForm } from "@/components/fuel/QuickSaleForm";
import { DeliveryRequestForm } from "@/components/fuel/DeliveryRequestForm";
import { ConfirmDeliverySheet } from "@/components/fuel/ConfirmDeliverySheet";
import { ReconciliationForm } from "@/components/fuel/ReconciliationForm";
import { DiscrepancyReport } from "@/components/fuel/DiscrepancyReport";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Fuel, 
  Truck, 
  ClipboardCheck, 
  Droplets,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function FuelDashboard() {
  const { business, isOwner, hasModuleAccess } = useBusiness();
  const { 
    tanks, 
    pumps, 
    transactions, 
    deliveries, 
    reconciliations,
    loading,
    recordSale,
    createDeliveryRequest,
    confirmDelivery,
    recordReconciliation,
  } = useFuelManagement();

  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showReconciliationForm, setShowReconciliationForm] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState<FuelDelivery | null>(null);

  const canWrite = isOwner || hasModuleAccess("fuel", "write");

  // Calculate stats
  const todaysSales = transactions
    .filter(t => new Date(t.recorded_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.total_amount, 0);

  const todaysGallons = transactions
    .filter(t => new Date(t.recorded_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.gallons_sold, 0);

  const lowTanks = tanks.filter(t => t.current_volume_gallons <= t.low_level_threshold_gallons);

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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Fuel className="h-6 w-6" />
          Fuel Management
        </h1>
        <p className="text-muted-foreground">
          {business?.business_name}
        </p>
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
              Request Delivery
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
                <p className="text-muted-foreground">
                  Go to <span className="font-medium">Business Settings → Fuel Setup</span> to add tanks and pumps.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tanks.map(tank => (
                  <TankGauge 
                    key={tank.id} 
                    tank={tank} 
                    canEdit={false}
                  />
                ))}
              </div>

              {/* Pumps Section — read-only display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fuel Pumps</CardTitle>
                </CardHeader>
                <CardContent>
                  {pumps.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No pumps configured. Go to <span className="font-medium">Settings → Fuel Setup</span> to add pumps.
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
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {pump.lifetime_meter_gallons.toLocaleString()} gal
                            </p>
                            <p className="text-xs text-muted-foreground">Lifetime</p>
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

        <TabsContent value="deliveries" className="mt-4 space-y-4">
          {/* Pending Requests */}
          {deliveries.filter(d => d.status === "requested").length > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pending Delivery Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deliveries.filter(d => d.status === "requested").map(delivery => (
                    <div 
                      key={delivery.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/20"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {(delivery.gallons_requested || 0).toLocaleString()} gal to {delivery.tank?.tank_name}
                          </p>
                          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                            Requested
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {delivery.vendor_name || "Unknown vendor"}
                          {delivery.invoice_number && ` • PO: ${delivery.invoice_number}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(delivery.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      {canWrite && (
                        <Button 
                          size="sm" 
                          onClick={() => setConfirmingDelivery(delivery)}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Confirm
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Deliveries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completed Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {deliveries.filter(d => d.status === "delivered").length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No deliveries confirmed yet
                </p>
              ) : (
                <div className="space-y-3">
                  {deliveries.filter(d => d.status === "delivered").slice(0, 20).map(delivery => {
                    const variance = (delivery.gallons_delivered || 0) - (delivery.gallons_requested || 0);
                    const hasVariance = delivery.gallons_requested && Math.abs(variance) > 0.01;
                    
                    return (
                      <div 
                        key={delivery.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {(delivery.gallons_delivered || 0).toLocaleString()} gal to {delivery.tank?.tank_name}
                            </p>
                            <Badge variant="outline" className="text-green-600 border-green-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Delivered
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {delivery.vendor_name || "Unknown vendor"}
                            {delivery.invoice_number && ` • Invoice: ${delivery.invoice_number}`}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(delivery.delivery_date), "MMM d, yyyy")}
                            </p>
                            {hasVariance && (
                              <span className={`text-xs ${variance > 0 ? "text-green-600" : "text-amber-600"}`}>
                                ({variance > 0 ? "+" : ""}{variance.toFixed(1)} gal vs requested)
                              </span>
                            )}
                          </div>
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <DiscrepancyReport reconciliations={reconciliations} tanks={tanks} />
        </TabsContent>
      </Tabs>

      {/* Operational Forms */}
      <QuickSaleForm 
        open={showSaleForm} 
        onOpenChange={setShowSaleForm} 
        pumps={pumps}
        tanks={tanks}
        onRecordSale={recordSale}
      />
      
      <DeliveryRequestForm 
        open={showDeliveryForm} 
        onOpenChange={setShowDeliveryForm} 
        tanks={tanks}
        onCreateRequest={createDeliveryRequest}
      />

      <ConfirmDeliverySheet
        open={!!confirmingDelivery}
        onOpenChange={(open) => !open && setConfirmingDelivery(null)}
        delivery={confirmingDelivery}
        onConfirmDelivery={confirmDelivery}
      />
      
      <ReconciliationForm 
        open={showReconciliationForm} 
        onOpenChange={setShowReconciliationForm} 
        tanks={tanks}
        pumps={pumps}
        onRecordReconciliation={recordReconciliation}
      />
    </div>
  );
}
