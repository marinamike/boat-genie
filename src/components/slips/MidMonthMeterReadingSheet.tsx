import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, Droplets, Loader2, Gauge, Calendar, Ship } from "lucide-react";
import { format } from "date-fns";
import { UtilityMeter, YardAsset } from "@/hooks/useYardAssets";
import { useRecurringBilling } from "@/hooks/useRecurringBilling";
import { formatCurrency } from "@/lib/stayBilling";

interface LeaseWithDetails {
  id: string;
  yard_asset_id: string;
  boat_id: string;
  owner_id: string;
  monthly_rate: number;
  start_date: string;
  end_date: string | null;
  lease_status: string;
  boat?: {
    id: string;
    name: string;
    make?: string;
    model?: string;
  } | null;
  asset?: {
    id: string;
    asset_name: string;
    asset_type: string;
  } | null;
}

interface MidMonthMeterReadingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: LeaseWithDetails | null;
  meters: UtilityMeter[];
  onComplete?: () => void;
}

export function MidMonthMeterReadingSheet({
  open,
  onOpenChange,
  lease,
  meters,
  onComplete,
}: MidMonthMeterReadingSheetProps) {
  const { recordMidStayReading, loading } = useRecurringBilling();
  const [powerReading, setPowerReading] = useState("");
  const [waterReading, setWaterReading] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Get meters for this asset
  const powerMeter = meters.find(
    (m) => m.yard_asset_id === lease?.yard_asset_id && m.meter_type === "power" && m.is_active
  );
  const waterMeter = meters.find(
    (m) => m.yard_asset_id === lease?.yard_asset_id && m.meter_type === "water" && m.is_active
  );

  const handleSubmit = async () => {
    if (!lease) return;

    setProcessing(true);
    try {
      const promises: Promise<any>[] = [];

      // Record power reading if provided
      if (powerMeter && powerReading) {
        const currentReading = powerMeter.current_reading || 0;
        const newReading = parseFloat(powerReading);
        const usage = Math.max(0, newReading - currentReading);
        
        promises.push(
          recordMidStayReading({
            leaseId: lease.id,
            yardAssetId: lease.yard_asset_id,
            meterId: powerMeter.id,
            readingValue: usage,
            notes: notes || undefined,
          })
        );
      }

      // Record water reading if provided
      if (waterMeter && waterReading) {
        const currentReading = waterMeter.current_reading || 0;
        const newReading = parseFloat(waterReading);
        const usage = Math.max(0, newReading - currentReading);
        
        promises.push(
          recordMidStayReading({
            leaseId: lease.id,
            yardAssetId: lease.yard_asset_id,
            meterId: waterMeter.id,
            readingValue: usage,
            notes: notes || undefined,
          })
        );
      }

      await Promise.all(promises);

      // Reset form
      setPowerReading("");
      setWaterReading("");
      setNotes("");
      onOpenChange(false);
      onComplete?.();
    } finally {
      setProcessing(false);
    }
  };

  if (!lease) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Record Mid-Month Meter Reading
          </SheetTitle>
          <SheetDescription>
            Enter current meter readings for this long-term tenant. Usage will be added to their next monthly invoice.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Lease Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Ship className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {lease.boat?.name || "Unknown Vessel"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {lease.boat?.make} {lease.boat?.model}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{lease.asset?.asset_name}</Badge>
                    <Badge variant="secondary">
                      {formatCurrency(lease.monthly_rate)}/month
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Period */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              Billing Period: <strong>{format(new Date(), "MMMM yyyy")}</strong>
            </span>
          </div>

          <Separator />

          {/* Meter Readings */}
          <div className="space-y-4">
            <h4 className="font-medium">Meter Readings</h4>

            {!powerMeter && !waterMeter ? (
              <p className="text-sm text-muted-foreground italic">
                No meters are assigned to this slip.
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
                      <div className="flex-1">
                        <p className="font-medium">{powerMeter.meter_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Rate: {formatCurrency(powerMeter.rate_per_unit)}/kWh
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Previous Reading</Label>
                        <Input
                          value={powerMeter.current_reading || 0}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Current Reading *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={powerReading}
                          onChange={(e) => setPowerReading(e.target.value)}
                          placeholder="Enter reading"
                        />
                      </div>
                    </div>
                    {powerReading && (
                      <div className="text-sm text-muted-foreground">
                        Usage: {Math.max(0, parseFloat(powerReading) - (powerMeter.current_reading || 0)).toFixed(2)} kWh = {" "}
                        <span className="font-medium">
                          {formatCurrency(
                            Math.max(0, parseFloat(powerReading) - (powerMeter.current_reading || 0)) *
                              powerMeter.rate_per_unit
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
                      <div className="flex-1">
                        <p className="font-medium">{waterMeter.meter_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Rate: {formatCurrency(waterMeter.rate_per_unit)}/gal
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Previous Reading</Label>
                        <Input
                          value={waterMeter.current_reading || 0}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Current Reading *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={waterReading}
                          onChange={(e) => setWaterReading(e.target.value)}
                          placeholder="Enter reading"
                        />
                      </div>
                    </div>
                    {waterReading && (
                      <div className="text-sm text-muted-foreground">
                        Usage: {Math.max(0, parseFloat(waterReading) - (waterMeter.current_reading || 0)).toFixed(2)} gal = {" "}
                        <span className="font-medium">
                          {formatCurrency(
                            Math.max(0, parseFloat(waterReading) - (waterMeter.current_reading || 0)) *
                              waterMeter.rate_per_unit
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

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this meter reading..."
              rows={3}
            />
          </div>

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
              onClick={handleSubmit}
              disabled={processing || (!powerReading && !waterReading)}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Gauge className="w-4 h-4 mr-2" />
                  Record Reading
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
