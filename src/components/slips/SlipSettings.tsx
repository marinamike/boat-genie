import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, Zap, Droplets, Plus, Pencil, DollarSign, Save, Loader2 } from "lucide-react";
import { UtilityMeter, YardAsset } from "@/hooks/useYardAssets";
import { Database } from "@/integrations/supabase/types";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SlipEditSheet } from "@/components/slips/SlipEditSheet";

type MeterType = Database["public"]["Enums"]["utility_meter_type"];

interface SlipSettingsProps {
  assets: YardAsset[];
  meters: UtilityMeter[];
  loading: boolean;
  createMeter: (meter: Partial<UtilityMeter>) => Promise<any>;
  updateMeter: (id: string, updates: Partial<UtilityMeter>) => Promise<boolean>;
  updateAsset?: (id: string, updates: Partial<YardAsset>) => Promise<boolean>;
}

export function SlipSettings({
  assets,
  meters,
  loading,
  createMeter,
  updateMeter,
  updateAsset,
}: SlipSettingsProps) {
  const { business, refreshBusiness } = useBusiness();
  
  const [showMeterForm, setShowMeterForm] = useState(false);
  const [editingMeter, setEditingMeter] = useState<UtilityMeter | null>(null);
  const [editingSlip, setEditingSlip] = useState<YardAsset | null>(null);
  const [meterForm, setMeterForm] = useState({
    meter_name: "",
    meter_type: "power" as MeterType,
    meter_number: "",
    yard_asset_id: "",
    rate_per_unit: "",
    current_reading: "0",
  });
  const [submitting, setSubmitting] = useState(false);
  const [savingSlipRates, setSavingSlipRates] = useState(false);
  const [savingUtilityRates, setSavingUtilityRates] = useState(false);
  
  const [slipRates, setSlipRates] = useState({
    daily: "",
    weekly: "",
    monthly: "",
    seasonal: "",
    annual: "",
  });
  
  const [utilityRates, setUtilityRates] = useState({
    power: "",
    water: "",
  });

  // Load current rates from business
  useEffect(() => {
    if (business) {
      setSlipRates({
        daily: business.default_daily_rate_per_ft?.toString() || "",
        weekly: business.default_weekly_rate_per_ft?.toString() || "",
        monthly: business.default_monthly_rate_per_ft?.toString() || "",
        seasonal: business.default_seasonal_rate_per_ft?.toString() || "",
        annual: business.default_annual_rate_per_ft?.toString() || "",
      });
      setUtilityRates({
        power: business.power_rate_per_kwh?.toString() || "",
        water: business.water_rate_per_gallon?.toString() || "",
      });
    }
  }, [business]);

  const handleSaveSlipRates = async () => {
    if (!business?.id) return;
    setSavingSlipRates(true);
    
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          default_daily_rate_per_ft: slipRates.daily ? parseFloat(slipRates.daily) : null,
          default_weekly_rate_per_ft: slipRates.weekly ? parseFloat(slipRates.weekly) : null,
          default_monthly_rate_per_ft: slipRates.monthly ? parseFloat(slipRates.monthly) : null,
          default_seasonal_rate_per_ft: slipRates.seasonal ? parseFloat(slipRates.seasonal) : null,
          default_annual_rate_per_ft: slipRates.annual ? parseFloat(slipRates.annual) : null,
        })
        .eq("id", business.id);
      
      if (error) throw error;
      toast.success("Global slip rates saved");
      refreshBusiness?.();
    } catch (error: any) {
      toast.error("Failed to save rates: " + error.message);
    } finally {
      setSavingSlipRates(false);
    }
  };

  const handleSaveUtilityRates = async () => {
    if (!business?.id) return;
    setSavingUtilityRates(true);
    
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          power_rate_per_kwh: utilityRates.power ? parseFloat(utilityRates.power) : null,
          water_rate_per_gallon: utilityRates.water ? parseFloat(utilityRates.water) : null,
        })
        .eq("id", business.id);
      
      if (error) throw error;
      toast.success("Utility rates saved");
      refreshBusiness?.();
    } catch (error: any) {
      toast.error("Failed to save rates: " + error.message);
    } finally {
      setSavingUtilityRates(false);
    }
  };

  const hasCustomRates = (asset: YardAsset) => {
    return (
      asset.daily_rate_per_ft !== null ||
      asset.weekly_rate_per_ft !== null ||
      asset.monthly_rate_per_ft !== null ||
      asset.seasonal_rate_per_ft !== null ||
      asset.annual_rate_per_ft !== null
    );
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case "wet_slip":
        return "Wet Slip";
      case "dry_rack":
        return "Dry Rack";
      case "yard_block":
        return "Yard Block";
      case "mooring":
        return "Mooring";
      default:
        return type;
    }
  };

  const resetForm = () => {
    setMeterForm({
      meter_name: "",
      meter_type: "power",
      meter_number: "",
      yard_asset_id: "",
      rate_per_unit: "",
      current_reading: "0",
    });
  };

  const closeForm = () => {
    setShowMeterForm(false);
    setEditingMeter(null);
    resetForm();
  };

  const openEditForm = (meter: UtilityMeter) => {
    setMeterForm({
      meter_name: meter.meter_name,
      meter_type: meter.meter_type,
      meter_number: meter.meter_number || "",
      yard_asset_id: meter.yard_asset_id || "",
      rate_per_unit: meter.rate_per_unit.toString(),
      current_reading: meter.current_reading.toString(),
    });
    setEditingMeter(meter);
    setShowMeterForm(true);
  };

  const openCreateForm = () => {
    resetForm();
    setEditingMeter(null);
    setShowMeterForm(true);
  };

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
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMeter = async () => {
    if (!editingMeter || !meterForm.meter_name || !meterForm.rate_per_unit) return;
    setSubmitting(true);

    try {
      await updateMeter(editingMeter.id, {
        meter_name: meterForm.meter_name,
        meter_type: meterForm.meter_type,
        meter_number: meterForm.meter_number || null,
        yard_asset_id: meterForm.yard_asset_id || null,
        rate_per_unit: parseFloat(meterForm.rate_per_unit),
        current_reading: parseFloat(meterForm.current_reading) || 0,
      });
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (editingMeter) {
      handleUpdateMeter();
    } else {
      handleCreateMeter();
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
      {/* Section 1: Global Slip Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Global Slip Rates
          </CardTitle>
          <CardDescription>
            Default pricing per foot that applies to all new slips. Individual slips can override these rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_rate" className="text-sm">Daily</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="daily_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2.50"
                  value={slipRates.daily}
                  onChange={(e) => setSlipRates({ ...slipRates, daily: e.target.value })}
                  className="pl-7"
                />
              </div>
              <span className="text-xs text-muted-foreground">/ft/day</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly_rate" className="text-sm">Weekly</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="weekly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15.00"
                  value={slipRates.weekly}
                  onChange={(e) => setSlipRates({ ...slipRates, weekly: e.target.value })}
                  className="pl-7"
                />
              </div>
              <span className="text-xs text-muted-foreground">/ft/week</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_rate" className="text-sm">Monthly</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="monthly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="45.00"
                  value={slipRates.monthly}
                  onChange={(e) => setSlipRates({ ...slipRates, monthly: e.target.value })}
                  className="pl-7"
                />
              </div>
              <span className="text-xs text-muted-foreground">/ft/month</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seasonal_rate" className="text-sm">Seasonal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="seasonal_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="200.00"
                  value={slipRates.seasonal}
                  onChange={(e) => setSlipRates({ ...slipRates, seasonal: e.target.value })}
                  className="pl-7"
                />
              </div>
              <span className="text-xs text-muted-foreground">/ft/season</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual_rate" className="text-sm">Annual</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="annual_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="350.00"
                  value={slipRates.annual}
                  onChange={(e) => setSlipRates({ ...slipRates, annual: e.target.value })}
                  className="pl-7"
                />
              </div>
              <span className="text-xs text-muted-foreground">/ft/year</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveSlipRates} disabled={savingSlipRates}>
              {savingSlipRates ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Slip Rates
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Utility Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Utility Pricing
          </CardTitle>
          <CardDescription>
            Default rates for power and water billing used during checkout calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="power_rate" className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Electric Rate
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="power_rate"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.15"
                  value={utilityRates.power}
                  onChange={(e) => setUtilityRates({ ...utilityRates, power: e.target.value })}
                  className="pl-7"
                />
              </div>
              <span className="text-xs text-muted-foreground">per kWh</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="water_rate" className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-500" />
                Water Rate
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="water_rate"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.01"
                  value={utilityRates.water}
                  onChange={(e) => setUtilityRates({ ...utilityRates, water: e.target.value })}
                  className="pl-7"
                />
              </div>
              <span className="text-xs text-muted-foreground">per gallon</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveUtilityRates} disabled={savingUtilityRates}>
              {savingUtilityRates ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Utility Rates
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 3: Slip Inventory Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Slip Inventory</CardTitle>
          <CardDescription>
            Manage your slips and yard spaces. Edit names, dimensions, and rate overrides.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No slips configured yet. Add slips from the Dock Grid tab.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slip Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Max LOA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rate Profile</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        {asset.asset_name}
                        {asset.dock_section && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({asset.dock_section})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getAssetTypeLabel(asset.asset_type)}</TableCell>
                      <TableCell className="text-right">
                        {asset.max_loa_ft ? `${asset.max_loa_ft} ft` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={asset.is_available ? "default" : "secondary"}>
                          {asset.is_available ? "Available" : "Occupied"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasCustomRates(asset) ? (
                          <Badge variant="outline" className="text-primary border-primary">
                            Custom
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSlip(asset)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section 4: Utility Meters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Utility Meters</CardTitle>
          <Button size="sm" onClick={openCreateForm}>
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
              <Button onClick={openCreateForm}>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(meter)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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

      {/* Slip Edit Sheet */}
      {updateAsset && (
        <SlipEditSheet
          asset={editingSlip}
          globalRates={{
            daily: slipRates.daily ? parseFloat(slipRates.daily) : null,
            weekly: slipRates.weekly ? parseFloat(slipRates.weekly) : null,
            monthly: slipRates.monthly ? parseFloat(slipRates.monthly) : null,
            seasonal: slipRates.seasonal ? parseFloat(slipRates.seasonal) : null,
            annual: slipRates.annual ? parseFloat(slipRates.annual) : null,
          }}
          open={!!editingSlip}
          onOpenChange={(open) => !open && setEditingSlip(null)}
          onUpdate={updateAsset}
        />
      )}

      {/* Add Meter Sheet */}
      <Sheet open={showMeterForm} onOpenChange={(open) => !open && closeForm()}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingMeter ? "Edit Meter" : "Add Utility Meter"}</SheetTitle>
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
                  {assets.map((asset) => {
                    const hasExistingMeter = meters.some(
                      (m) => m.yard_asset_id === asset.id && m.meter_type === meterForm.meter_type
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
                              Has {meterForm.meter_type === "power" ? "Power" : "Water"}
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
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
                onClick={closeForm}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!meterForm.meter_name || !meterForm.rate_per_unit || submitting}
                className="flex-1"
              >
                {submitting
                  ? editingMeter ? "Saving..." : "Creating..."
                  : editingMeter ? "Save Changes" : "Create Meter"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
