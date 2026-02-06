import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { YardAsset } from "@/hooks/useYardAssets";

interface GlobalRates {
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
  seasonal: number | null;
  annual: number | null;
}

interface SlipEditSheetProps {
  asset: YardAsset | null;
  globalRates: GlobalRates;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<YardAsset>) => Promise<boolean>;
}

export function SlipEditSheet({
  asset,
  globalRates,
  open,
  onOpenChange,
  onUpdate,
}: SlipEditSheetProps) {
  const [saving, setSaving] = useState(false);
  const [useCustomRates, setUseCustomRates] = useState(false);
  
  const [form, setForm] = useState({
    asset_name: "",
    dock_section: "",
    max_loa_ft: "",
    max_beam_ft: "",
    max_draft_ft: "",
    daily_rate_per_ft: "",
    weekly_rate_per_ft: "",
    monthly_rate_per_ft: "",
    seasonal_rate_per_ft: "",
    annual_rate_per_ft: "",
  });

  // Initialize form when asset changes
  useEffect(() => {
    if (asset) {
      const hasCustom = (
        asset.daily_rate_per_ft !== null ||
        asset.weekly_rate_per_ft !== null ||
        asset.monthly_rate_per_ft !== null ||
        asset.seasonal_rate_per_ft !== null ||
        asset.annual_rate_per_ft !== null
      );
      
      setUseCustomRates(hasCustom);
      setForm({
        asset_name: asset.asset_name || "",
        dock_section: asset.dock_section || "",
        max_loa_ft: asset.max_loa_ft?.toString() || "",
        max_beam_ft: asset.max_beam_ft?.toString() || "",
        max_draft_ft: asset.max_draft_ft?.toString() || "",
        daily_rate_per_ft: asset.daily_rate_per_ft?.toString() || "",
        weekly_rate_per_ft: asset.weekly_rate_per_ft?.toString() || "",
        monthly_rate_per_ft: asset.monthly_rate_per_ft?.toString() || "",
        seasonal_rate_per_ft: asset.seasonal_rate_per_ft?.toString() || "",
        annual_rate_per_ft: asset.annual_rate_per_ft?.toString() || "",
      });
    }
  }, [asset]);

  const handleSave = async () => {
    if (!asset) return;
    setSaving(true);
    
    try {
      const updates: Partial<YardAsset> = {
        asset_name: form.asset_name,
        dock_section: form.dock_section || null,
        max_loa_ft: form.max_loa_ft ? parseFloat(form.max_loa_ft) : null,
        max_beam_ft: form.max_beam_ft ? parseFloat(form.max_beam_ft) : null,
        max_draft_ft: form.max_draft_ft ? parseFloat(form.max_draft_ft) : null,
      };
      
      // Only set custom rates if toggle is on, otherwise clear them
      if (useCustomRates) {
        updates.daily_rate_per_ft = form.daily_rate_per_ft ? parseFloat(form.daily_rate_per_ft) : null;
        updates.weekly_rate_per_ft = form.weekly_rate_per_ft ? parseFloat(form.weekly_rate_per_ft) : null;
        updates.monthly_rate_per_ft = form.monthly_rate_per_ft ? parseFloat(form.monthly_rate_per_ft) : null;
        updates.seasonal_rate_per_ft = form.seasonal_rate_per_ft ? parseFloat(form.seasonal_rate_per_ft) : null;
        updates.annual_rate_per_ft = form.annual_rate_per_ft ? parseFloat(form.annual_rate_per_ft) : null;
      } else {
        // Clear custom rates to use global defaults
        updates.daily_rate_per_ft = null;
        updates.weekly_rate_per_ft = null;
        updates.monthly_rate_per_ft = null;
        updates.seasonal_rate_per_ft = null;
        updates.annual_rate_per_ft = null;
      }
      
      const success = await onUpdate(asset.id, updates);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!asset) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Slip</SheetTitle>
          <SheetDescription>
            Update slip details and rate overrides
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset_name">Slip Name *</Label>
              <Input
                id="asset_name"
                value={form.asset_name}
                onChange={(e) => setForm({ ...form, asset_name: e.target.value })}
                placeholder="e.g., D20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dock_section">Dock Section</Label>
              <Input
                id="dock_section"
                value={form.dock_section}
                onChange={(e) => setForm({ ...form, dock_section: e.target.value })}
                placeholder="e.g., Dock A"
              />
            </div>
          </div>

          <Separator />

          {/* Dimensions */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Dimensions</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="max_loa_ft" className="text-sm text-muted-foreground">Max LOA (ft)</Label>
                <Input
                  id="max_loa_ft"
                  type="number"
                  step="0.1"
                  value={form.max_loa_ft}
                  onChange={(e) => setForm({ ...form, max_loa_ft: e.target.value })}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_beam_ft" className="text-sm text-muted-foreground">Max Beam (ft)</Label>
                <Input
                  id="max_beam_ft"
                  type="number"
                  step="0.1"
                  value={form.max_beam_ft}
                  onChange={(e) => setForm({ ...form, max_beam_ft: e.target.value })}
                  placeholder="18"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_draft_ft" className="text-sm text-muted-foreground">Max Draft (ft)</Label>
                <Input
                  id="max_draft_ft"
                  type="number"
                  step="0.1"
                  value={form.max_draft_ft}
                  onChange={(e) => setForm({ ...form, max_draft_ft: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Rate Override */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Custom Rates</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Override global rates for this slip
                </p>
              </div>
              <Switch
                checked={useCustomRates}
                onCheckedChange={setUseCustomRates}
              />
            </div>
            
            {useCustomRates ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="daily_rate" className="text-xs text-muted-foreground">Daily</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="daily_rate"
                      type="number"
                      step="0.01"
                      value={form.daily_rate_per_ft}
                      onChange={(e) => setForm({ ...form, daily_rate_per_ft: e.target.value })}
                      placeholder={globalRates.daily?.toString() || "2.50"}
                      className="pl-6"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weekly_rate" className="text-xs text-muted-foreground">Weekly</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="weekly_rate"
                      type="number"
                      step="0.01"
                      value={form.weekly_rate_per_ft}
                      onChange={(e) => setForm({ ...form, weekly_rate_per_ft: e.target.value })}
                      placeholder={globalRates.weekly?.toString() || "15.00"}
                      className="pl-6"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="monthly_rate" className="text-xs text-muted-foreground">Monthly</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="monthly_rate"
                      type="number"
                      step="0.01"
                      value={form.monthly_rate_per_ft}
                      onChange={(e) => setForm({ ...form, monthly_rate_per_ft: e.target.value })}
                      placeholder={globalRates.monthly?.toString() || "45.00"}
                      className="pl-6"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="seasonal_rate" className="text-xs text-muted-foreground">Seasonal</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="seasonal_rate"
                      type="number"
                      step="0.01"
                      value={form.seasonal_rate_per_ft}
                      onChange={(e) => setForm({ ...form, seasonal_rate_per_ft: e.target.value })}
                      placeholder={globalRates.seasonal?.toString() || "200.00"}
                      className="pl-6"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="annual_rate" className="text-xs text-muted-foreground">Annual</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="annual_rate"
                      type="number"
                      step="0.01"
                      value={form.annual_rate_per_ft}
                      onChange={(e) => setForm({ ...form, annual_rate_per_ft: e.target.value })}
                      placeholder={globalRates.annual?.toString() || "350.00"}
                      className="pl-6"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This slip will use the global rates defined in your business settings.
                </p>
                {(globalRates.daily || globalRates.monthly) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {globalRates.daily && (
                      <Badge variant="outline">${globalRates.daily}/ft/day</Badge>
                    )}
                    {globalRates.weekly && (
                      <Badge variant="outline">${globalRates.weekly}/ft/week</Badge>
                    )}
                    {globalRates.monthly && (
                      <Badge variant="outline">${globalRates.monthly}/ft/month</Badge>
                    )}
                  </div>
                )}
              </div>
            )}
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
              onClick={handleSave}
              disabled={saving || !form.asset_name}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
