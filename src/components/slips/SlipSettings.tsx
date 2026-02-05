import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Settings, Zap, Droplets, Plus, Trash2 } from "lucide-react";
import { UtilityMeter, YardAsset } from "@/hooks/useYardAssets";
import { Database } from "@/integrations/supabase/types";

type MeterType = Database["public"]["Enums"]["utility_meter_type"];

interface SlipSettingsProps {
  assets: YardAsset[];
  meters: UtilityMeter[];
  loading: boolean;
  createMeter: (meter: Partial<UtilityMeter>) => Promise<any>;
  updateMeter: (id: string, updates: Partial<UtilityMeter>) => Promise<boolean>;
}

export function SlipSettings({
  assets,
  meters,
  loading,
  createMeter,
  updateMeter,
}: SlipSettingsProps) {
  const [showMeterForm, setShowMeterForm] = useState(false);
  const [meterForm, setMeterForm] = useState({
    meter_name: "",
    meter_type: "power" as MeterType,
    meter_number: "",
    yard_asset_id: "",
    rate_per_unit: "",
    current_reading: "0",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreateMeter = async () => {
    if (!meterForm.meter_name || !meterForm.rate_per_unit) return;
    setSubmitting(true);

    try {
      await createMeter({
        meter_name: meterForm.meter_name,
        meter_type: meterForm.meter_type,
        meter_number: meterForm.meter_number || null,
        yard_asset_id: meterForm.yard_asset_id || null,
        rate_per_unit: parseFloat(meterForm.rate_per_unit),
        current_reading: parseFloat(meterForm.current_reading) || 0,
      });
      setShowMeterForm(false);
      setMeterForm({
        meter_name: "",
        meter_type: "power",
        meter_number: "",
        yard_asset_id: "",
        rate_per_unit: "",
        current_reading: "0",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMeterActive = async (meter: UtilityMeter) => {
    await updateMeter(meter.id, { is_active: !meter.is_active });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Settings className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Utility Meters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Utility Meters</CardTitle>
          <Button size="sm" onClick={() => setShowMeterForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Meter
          </Button>
        </CardHeader>
        <CardContent>
          {meters.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Meters Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add power and water meters to track utility usage
              </p>
              <Button onClick={() => setShowMeterForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Meter
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {meters.map((meter) => {
                const asset = assets.find((a) => a.id === meter.yard_asset_id);
                return (
                  <div
                    key={meter.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {meter.meter_type === "power" ? (
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-yellow-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Droplets className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {meter.meter_name}
                          {!meter.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {asset?.asset_name || "Unassigned"}
                          {meter.meter_number && ` • #${meter.meter_number}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          ${meter.rate_per_unit}/{meter.meter_type === "power" ? "kWh" : "gal"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Current: {meter.current_reading.toLocaleString()}
                        </div>
                      </div>
                      <Switch
                        checked={meter.is_active}
                        onCheckedChange={() => toggleMeterActive(meter)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Meter Assignment:</strong> Link meters to specific slips to
            automatically associate readings with the current occupant's account.
          </p>
          <p>
            <strong>Billing:</strong> Meter readings are tracked but billing is
            handled separately. Export unbilled charges for invoicing.
          </p>
          <p>
            <strong>Rates:</strong> Set competitive rates based on your local utility
            costs plus your margin.
          </p>
        </CardContent>
      </Card>

      {/* Add Meter Sheet */}
      <Sheet open={showMeterForm} onOpenChange={setShowMeterForm}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Utility Meter</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Meter Name *</Label>
              <Input
                placeholder="e.g., Slip A-12 Power"
                value={meterForm.meter_name}
                onChange={(e) =>
                  setMeterForm({ ...meterForm, meter_name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={meterForm.meter_type}
                  onValueChange={(value: MeterType) =>
                    setMeterForm({ ...meterForm, meter_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="power">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        Power
                      </div>
                    </SelectItem>
                    <SelectItem value="water">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        Water
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Meter Number</Label>
                <Input
                  placeholder="Optional"
                  value={meterForm.meter_number}
                  onChange={(e) =>
                    setMeterForm({ ...meterForm, meter_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign to Slip (Optional)</Label>
              <Select
                value={meterForm.yard_asset_id || "none"}
                onValueChange={(value) =>
                  setMeterForm({ ...meterForm, yard_asset_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a slip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.asset_name} ({asset.dock_section || "Unassigned"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Rate per {meterForm.meter_type === "power" ? "kWh" : "Gallon"} *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={meterForm.meter_type === "power" ? "0.15" : "0.01"}
                  value={meterForm.rate_per_unit}
                  onChange={(e) =>
                    setMeterForm({ ...meterForm, rate_per_unit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Starting Reading</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={meterForm.current_reading}
                  onChange={(e) =>
                    setMeterForm({ ...meterForm, current_reading: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowMeterForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMeter}
                disabled={!meterForm.meter_name || !meterForm.rate_per_unit || submitting}
                className="flex-1"
              >
                {submitting ? "Creating..." : "Create Meter"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
