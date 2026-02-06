import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Ship,
  Zap,
  Droplets,
  Clock,
  DollarSign,
  Loader2,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { DockStatusWithDetails } from "@/hooks/useLiveDockStatus";
import { UtilityMeter, YardAsset } from "@/hooks/useYardAssets";
import { useStayBilling } from "@/hooks/useStayBilling";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  calculateBestRate,
  calculateStayDuration,
  calculateUtilityCharge,
  formatCurrency,
  formatStayDuration,
  getMeterUnit,
  StayRates,
  BillingBreakdown,
} from "@/lib/stayBilling";

interface CheckoutBillingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dockStatus: DockStatusWithDetails | null;
  reservationId?: string | null;
  slipAsset?: YardAsset | null;
  meters: UtilityMeter[];
  onCheckoutComplete: () => void;
}

export function CheckoutBillingSheet({
  open,
  onOpenChange,
  dockStatus,
  reservationId,
  slipAsset,
  meters,
  onCheckoutComplete,
}: CheckoutBillingSheetProps) {
  const { createInvoice, loading } = useStayBilling();
  const { business } = useBusiness();
  const [processing, setProcessing] = useState(false);

  // Meter reading inputs
  const [powerEndReading, setPowerEndReading] = useState("");
  const [waterEndReading, setWaterEndReading] = useState("");

  // Get meters assigned to this slip
  const powerMeter = useMemo(() => {
    if (!slipAsset) return null;
    return meters.find(
      (m) => m.yard_asset_id === slipAsset.id && m.meter_type === "power" && m.is_active
    );
  }, [meters, slipAsset]);

  const waterMeter = useMemo(() => {
    if (!slipAsset) return null;
    return meters.find(
      (m) => m.yard_asset_id === slipAsset.id && m.meter_type === "water" && m.is_active
    );
  }, [meters, slipAsset]);

  // Reset inputs when sheet opens
  useEffect(() => {
    if (open) {
      setPowerEndReading(powerMeter?.current_reading?.toString() || "0");
      setWaterEndReading(waterMeter?.current_reading?.toString() || "0");
    }
  }, [open, powerMeter, waterMeter]);

  // Calculate billing
  const billing = useMemo((): BillingBreakdown | null => {
    if (!dockStatus || !slipAsset) return null;

    const checkInAt = new Date(dockStatus.checked_in_at);
    const checkOutAt = new Date();
    const vesselLengthFt = dockStatus.boat?.length_ft || 0;

    // Rate inheritance: slip-specific rates first, then business defaults
    const rates: StayRates = {
      daily_rate_per_ft: slipAsset.daily_rate_per_ft ?? business?.default_daily_rate_per_ft ?? 0,
      weekly_rate_per_ft: slipAsset.weekly_rate_per_ft ?? business?.default_weekly_rate_per_ft ?? 0,
      monthly_rate_per_ft: slipAsset.monthly_rate_per_ft ?? business?.default_monthly_rate_per_ft ?? 0,
      seasonal_rate_per_ft: slipAsset.seasonal_rate_per_ft ?? business?.default_seasonal_rate_per_ft ?? 0,
      annual_rate_per_ft: slipAsset.annual_rate_per_ft ?? business?.default_annual_rate_per_ft ?? 0,
    };

    const durationDays = calculateStayDuration(checkInAt, checkOutAt);
    const stayCalculation = calculateBestRate(durationDays, vesselLengthFt, rates);

    const utilities = [];

    // Power calculation
    if (powerMeter) {
      const powerStart = powerMeter.current_reading || 0;
      const powerEnd = parseFloat(powerEndReading) || powerStart;
      utilities.push(
        calculateUtilityCharge("power", powerStart, powerEnd, powerMeter.rate_per_unit)
      );
    }

    // Water calculation
    if (waterMeter) {
      const waterStart = waterMeter.current_reading || 0;
      const waterEnd = parseFloat(waterEndReading) || waterStart;
      utilities.push(
        calculateUtilityCharge("water", waterStart, waterEnd, waterMeter.rate_per_unit)
      );
    }

    const utilityTotal = utilities.reduce((sum, u) => sum + u.total, 0);

    return {
      stayCalculation,
      utilities,
      grandTotal: Math.round((stayCalculation.staySubtotal + utilityTotal) * 100) / 100,
    };
  }, [dockStatus, slipAsset, powerMeter, waterMeter, powerEndReading, waterEndReading, business]);

  const handleFinalizeBilling = async () => {
    if (!dockStatus || !billing) return;

    setProcessing(true);
    try {
      const invoice = await createInvoice({
        reservationId: reservationId || null,
        dockStatusId: dockStatus.id,
        boatId: dockStatus.boat?.id || null,
        checkInAt: new Date(dockStatus.checked_in_at),
        checkOutAt: new Date(),
        billing,
        powerMeterId: powerMeter?.id,
        waterMeterId: waterMeter?.id,
      });

      if (invoice) {
        onCheckoutComplete();
        onOpenChange(false);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!dockStatus) return null;

  const checkInAt = new Date(dockStatus.checked_in_at);
  const checkOutAt = new Date();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Finalize Billing
          </SheetTitle>
          <SheetDescription>
            Review charges and record final meter readings before checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Vessel Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Ship className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {dockStatus.boat?.name || "Unknown Vessel"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dockStatus.boat?.make} {dockStatus.boat?.model}
                    {dockStatus.boat?.length_ft && ` • ${dockStatus.boat.length_ft}ft`}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {dockStatus.slip_number && (
                      <Badge variant="outline">Slip {dockStatus.slip_number}</Badge>
                    )}
                    <Badge variant="secondary">{dockStatus.stay_type || "Transient"}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stay Duration */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Stay Duration
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Check In</p>
                <p className="font-medium">{format(checkInAt, "MMM d, yyyy h:mm a")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Check Out</p>
                <p className="font-medium">{format(checkOutAt, "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="font-semibold text-primary">
                {formatStayDuration(checkInAt, checkOutAt)}
              </p>
              {billing && (
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated as {billing.stayCalculation.totalDays} billable day(s) using{" "}
                  <span className="font-medium">{billing.stayCalculation.tierLabel}</span>
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Stay Charges */}
          {billing && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Stay Charges
              </h4>
              <div className="p-4 rounded-lg border bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate Tier</span>
                  <Badge variant="outline">{billing.stayCalculation.tierLabel}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate per Day (per ft)</span>
                  <span>{formatCurrency(billing.stayCalculation.ratePerDayPerFt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vessel Length</span>
                  <span>{billing.stayCalculation.vesselLengthFt} ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days</span>
                  <span>{billing.stayCalculation.totalDays}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Stay Subtotal</span>
                  <span>{formatCurrency(billing.stayCalculation.staySubtotal)}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Utility Meters */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Utility Readings
            </h4>

            {!powerMeter && !waterMeter ? (
              <p className="text-sm text-muted-foreground italic">
                No meters assigned to this slip.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Power Meter */}
                {powerMeter && (
                  <div className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium">{powerMeter.meter_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Rate: {formatCurrency(powerMeter.rate_per_unit)}/kWh
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Reading</Label>
                        <Input
                          value={powerMeter.current_reading || 0}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Reading *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={powerEndReading}
                          onChange={(e) => setPowerEndReading(e.target.value)}
                          placeholder="Enter reading"
                        />
                      </div>
                    </div>
                    {billing?.utilities.find((u) => u.meterType === "power") && (
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">
                          Usage:{" "}
                          {billing.utilities.find((u) => u.meterType === "power")?.usage.toFixed(2)}{" "}
                          kWh
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            billing.utilities.find((u) => u.meterType === "power")?.total || 0
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Water Meter */}
                {waterMeter && (
                  <div className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Droplets className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{waterMeter.meter_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Rate: {formatCurrency(waterMeter.rate_per_unit)}/gal
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Reading</Label>
                        <Input
                          value={waterMeter.current_reading || 0}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Reading *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={waterEndReading}
                          onChange={(e) => setWaterEndReading(e.target.value)}
                          placeholder="Enter reading"
                        />
                      </div>
                    </div>
                    {billing?.utilities.find((u) => u.meterType === "water") && (
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">
                          Usage:{" "}
                          {billing.utilities.find((u) => u.meterType === "water")?.usage.toFixed(2)}{" "}
                          gal
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            billing.utilities.find((u) => u.meterType === "water")?.total || 0
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Grand Total */}
          {billing && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Grand Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(billing.grandTotal)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleFinalizeBilling}
              disabled={processing || !billing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Finalize & Check Out
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
