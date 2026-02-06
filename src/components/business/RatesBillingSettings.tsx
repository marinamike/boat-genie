import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Zap, Droplets, Pencil, Save, Loader2 } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useYardAssets, YardAsset } from "@/hooks/useYardAssets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SlipEditSheet } from "@/components/slips/SlipEditSheet";

interface GlobalRates {
  default_daily_rate_per_ft: number | null;
  default_weekly_rate_per_ft: number | null;
  default_monthly_rate_per_ft: number | null;
  default_seasonal_rate_per_ft: number | null;
  default_annual_rate_per_ft: number | null;
  power_rate_per_kwh: number | null;
  water_rate_per_gallon: number | null;
}

export function RatesBillingSettings() {
  const { business, refreshBusiness } = useBusiness();
  const { assets, updateAsset, loading: assetsLoading } = useYardAssets();
  
  const [savingSlipRates, setSavingSlipRates] = useState(false);
  const [savingUtilityRates, setSavingUtilityRates] = useState(false);
  const [editingSlip, setEditingSlip] = useState<YardAsset | null>(null);
  
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
          {assetsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No slips configured yet. Add slips from the Slips Dashboard.
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

      {/* Slip Edit Sheet */}
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
    </div>
  );
}
