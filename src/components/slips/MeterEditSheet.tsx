import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Zap, Droplets, Trash2 } from "lucide-react";
import { UtilityMeter, YardAsset } from "@/hooks/useYardAssets";
import { Database } from "@/integrations/supabase/types";

type MeterType = Database["public"]["Enums"]["utility_meter_type"];

interface MeterEditSheetProps {
  meter: UtilityMeter | null;
  assets: YardAsset[];
  meters: UtilityMeter[];
  globalRates: {
    power: number | null;
    water: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<UtilityMeter>) => Promise<boolean>;
  onCreate: (meter: Partial<UtilityMeter>) => Promise<any>;
  onDelete?: (id: string) => Promise<boolean>;
}

export function MeterEditSheet({
  meter,
  assets,
  meters,
  globalRates,
  open,
  onOpenChange,
  onUpdate,
  onCreate,
  onDelete,
}: MeterEditSheetProps) {
  const isEditing = !!meter;

  const [form, setForm] = useState({
    meter_name: "",
    meter_type: "power" as MeterType,
    meter_number: "",
    yard_asset_id: "",
    rate_per_unit: "",
    current_reading: "0",
  });

  const [useCustomRate, setUseCustomRate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get the appropriate global rate based on meter type
  const currentGlobalRate = form.meter_type === "power"
    ? globalRates.power
    : globalRates.water;

  const rateUnit = form.meter_type === "power" ? "kWh" : "gal";

  // Initialize form when meter changes or sheet opens
  useEffect(() => {
    if (open) {
      if (meter) {
        const hasCustom = meter.rate_per_unit > 0;
        setForm({
          meter_name: meter.meter_name,
          meter_type: meter.meter_type,
          meter_number: meter.meter_number || "",
          yard_asset_id: meter.yard_asset_id || "",
          rate_per_unit: hasCustom ? meter.rate_per_unit.toString() : "",
          current_reading: meter.current_reading.toString(),
        });
        setUseCustomRate(hasCustom);
      } else {
        // Reset for new meter
        setForm({
          meter_name: "",
          meter_type: "power",
          meter_number: "",
          yard_asset_id: "",
          rate_per_unit: "",
          current_reading: "0",
        });
        setUseCustomRate(false);
      }
    }
  }, [meter, open]);

  const handleSubmit = async () => {
    if (!form.meter_name) return;
    setSubmitting(true);

    try {
      const payload = {
        meter_name: form.meter_name,
        meter_type: form.meter_type,
        meter_number: form.meter_number || null,
        yard_asset_id: form.yard_asset_id || null,
        rate_per_unit: useCustomRate && form.rate_per_unit
          ? parseFloat(form.rate_per_unit)
          : 0, // 0 signals "inherit global"
        current_reading: parseFloat(form.current_reading) || 0,
      };

      if (isEditing && meter) {
        await onUpdate(meter.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!meter || !onDelete) return;
    setSubmitting(true);
    try {
      await onDelete(meter.id);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>{isEditing ? "Edit Meter" : "Add Utility Meter"}</SheetTitle>
          {isEditing && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Meter</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{meter?.meter_name}"? This action cannot be undone. Any associated meter readings will remain in the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Meter Name */}
          <div className="space-y-2">
            <Label>Meter Name *</Label>
            <Input
              placeholder="e.g., Slip A-12 Power"
              value={form.meter_name}
              onChange={(e) => setForm({ ...form, meter_name: e.target.value })}
            />
          </div>

          {/* Type & Meter Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={form.meter_type}
                onValueChange={(value: MeterType) =>
                  setForm({ ...form, meter_type: value })
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
                value={form.meter_number}
                onChange={(e) => setForm({ ...form, meter_number: e.target.value })}
              />
            </div>
          </div>

          {/* Assign to Slip */}
          <div className="space-y-2">
            <Label>Assign to Slip (Optional)</Label>
            <Select
              value={form.yard_asset_id || "none"}
              onValueChange={(value) =>
                setForm({ ...form, yard_asset_id: value === "none" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a slip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {assets.map((asset) => {
                  const hasExistingMeter = meters.some(
                    (m) =>
                      m.yard_asset_id === asset.id &&
                      m.meter_type === form.meter_type &&
                      m.id !== meter?.id
                  );
                  return (
                    <SelectItem key={asset.id} value={asset.id}>
                      <span className="flex items-center gap-2">
                        {asset.asset_name}
                        {asset.dock_section && (
                          <span className="text-muted-foreground">• {asset.dock_section}</span>
                        )}
                        {hasExistingMeter && (
                          <Badge variant="secondary" className="text-xs py-0 px-1.5">
                            Has {form.meter_type === "power" ? "Power" : "Water"}
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Custom Rate Toggle Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="custom-rate-toggle" className="text-base font-medium">
                  Custom Rate
                </Label>
                <p className="text-sm text-muted-foreground">
                  Override the global {form.meter_type === "power" ? "power" : "water"} rate
                </p>
              </div>
              <Switch
                id="custom-rate-toggle"
                checked={useCustomRate}
                onCheckedChange={setUseCustomRate}
              />
            </div>

            {/* Rate Display/Input */}
            {useCustomRate ? (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
                <Label>Rate per {rateUnit}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder={(currentGlobalRate ?? 0).toFixed(3)}
                    value={form.rate_per_unit}
                    onChange={(e) => setForm({ ...form, rate_per_unit: e.target.value })}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Global rate: ${(currentGlobalRate ?? 0).toFixed(3)}/{rateUnit}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-1">
                  This meter uses the global {form.meter_type === "power" ? "power" : "water"} rate:
                </p>
                <p className="text-lg font-semibold">
                  ${(currentGlobalRate ?? 0).toFixed(3)}/{rateUnit}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Current Reading */}
          <div className="space-y-2">
            <Label>Current Reading</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0"
              value={form.current_reading}
              onChange={(e) => setForm({ ...form, current_reading: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {form.meter_type === "power" ? "kWh" : "Gallons"} on the meter display
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.meter_name || submitting}
              className="flex-1"
            >
              {submitting
                ? isEditing ? "Saving..." : "Creating..."
                : isEditing ? "Save Changes" : "Create Meter"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
