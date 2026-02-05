import { useState, useEffect } from "react";
import { useFuelPricing, FuelPrice } from "@/hooks/useFuelPricing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Settings2,
  History,
  Fuel
} from "lucide-react";
import { format, subDays } from "date-fns";

interface PriceCardProps {
  fuelType: string;
  label: string;
  price: FuelPrice | undefined;
  history: { changed_at: string; retail_price: number }[];
  onUpdate: (fuelType: string, updates: Partial<FuelPrice>) => Promise<boolean>;
  isOwner: boolean;
}

function PriceCard({ fuelType, label, price, history, onUpdate, isOwner }: PriceCardProps) {
  const [retailPrice, setRetailPrice] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [memberDiscount, setMemberDiscount] = useState("");
  const [autoMargin, setAutoMargin] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (price) {
      setRetailPrice(price.retail_price.toString());
      setCostBasis(price.cost_basis.toString());
      setMemberDiscount(price.member_discount_amount?.toString() || "0.10");
      setAutoMargin(price.auto_margin_amount?.toString() || "1.50");
    }
  }, [price]);

  const handleQuickUpdate = async () => {
    setSaving(true);
    await onUpdate(fuelType, { retail_price: parseFloat(retailPrice) || 0 });
    setSaving(false);
  };

  const handleSettingsSave = async () => {
    setSaving(true);
    await onUpdate(fuelType, {
      cost_basis: parseFloat(costBasis) || 0,
      retail_price: parseFloat(retailPrice) || 0,
      auto_margin_amount: parseFloat(autoMargin) || 1.50,
      member_discount_amount: parseFloat(memberDiscount) || 0.10,
    });
    setSaving(false);
    setShowSettings(false);
  };

  // Calculate price trend from history
  const getTrend = () => {
    if (history.length < 2) return null;
    const current = history[0]?.retail_price || 0;
    const previous = history[1]?.retail_price || 0;
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "same";
  };

  const trend = getTrend();

  // Mini sparkline data (simplified visual)
  const sparklineData = history.slice(0, 7).reverse();
  const maxPrice = Math.max(...sparklineData.map(h => h.retail_price), 1);
  const minPrice = Math.min(...sparklineData.map(h => h.retail_price), 0);
  const range = maxPrice - minPrice || 1;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{label}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {price?.member_discount_enabled && (
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Member
              </Badge>
            )}
            {price?.auto_margin_enabled && (
              <Badge variant="outline" className="text-xs">
                Auto-Margin
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price Display */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Retail Price</Label>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.001"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  className="pl-10 text-lg font-bold h-12"
                  disabled={!isOwner}
                />
              </div>
              {trend === "up" && <TrendingUp className="h-5 w-5 text-green-500 shrink-0" />}
              {trend === "down" && <TrendingDown className="h-5 w-5 text-red-500 shrink-0" />}
              {trend === "same" && <Minus className="h-5 w-5 text-muted-foreground shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">per gallon</p>
          </div>
          {isOwner && (
            <Button onClick={handleQuickUpdate} disabled={saving} className="h-12 shrink-0">
              {saving ? "Saving..." : "Update"}
            </Button>
          )}
        </div>

        {/* Sparkline / Price History Preview */}
        {sparklineData.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <History className="h-3 w-3" />
              <span>Last 7 changes</span>
            </div>
            <div className="h-10 flex items-end gap-1">
              {sparklineData.map((point, i) => {
                const height = ((point.retail_price - minPrice) / range) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 rounded-t transition-all hover:bg-primary/30"
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`$${point.retail_price.toFixed(3)} - ${format(new Date(point.changed_at), "MMM d")}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Member Price Display */}
        {price?.member_discount_enabled && price.member_price && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm">Member Price</span>
            </div>
            <span className="font-semibold">${price.member_price.toFixed(3)}/gal</span>
          </div>
        )}

        {/* Cost Basis Display */}
        {price?.cost_basis !== undefined && price.cost_basis > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Cost Basis</span>
            <span>${price.cost_basis.toFixed(3)}/gal</span>
          </div>
        )}

        {/* Margin Display */}
        {price?.cost_basis !== undefined && price.cost_basis > 0 && price.retail_price > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Margin</span>
            <span className="font-medium text-primary">
              ${(price.retail_price - price.cost_basis).toFixed(3)}/gal
            </span>
          </div>
        )}

        {isOwner && (
          <>
            <Separator />
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {showSettings ? "Hide" : "Show"} Advanced Settings
            </Button>

            {showSettings && (
              <div className="space-y-4 pt-2">
                {/* Cost Basis */}
                <div className="space-y-2">
                  <Label htmlFor={`cost-${fuelType}`}>Cost Basis (per gallon)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`cost-${fuelType}`}
                      type="number"
                      step="0.001"
                      value={costBasis}
                      onChange={(e) => setCostBasis(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Auto-Margin Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Margin</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically set retail price above cost
                    </p>
                  </div>
                  <Switch
                    checked={price?.auto_margin_enabled || false}
                    onCheckedChange={(checked) => 
                      onUpdate(fuelType, { auto_margin_enabled: checked })
                    }
                  />
                </div>

                {price?.auto_margin_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor={`margin-${fuelType}`}>Margin Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`margin-${fuelType}`}
                        type="number"
                        step="0.001"
                        value={autoMargin}
                        onChange={(e) => setAutoMargin(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Member Discount Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Member Discount</Label>
                    <p className="text-xs text-muted-foreground">
                      Offer discounted price for long-term tenants
                    </p>
                  </div>
                  <Switch
                    checked={price?.member_discount_enabled || false}
                    onCheckedChange={(checked) => 
                      onUpdate(fuelType, { member_discount_enabled: checked })
                    }
                  />
                </div>

                {price?.member_discount_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor={`discount-${fuelType}`}>Discount per Gallon</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`discount-${fuelType}`}
                        type="number"
                        step="0.001"
                        value={memberDiscount}
                        onChange={(e) => setMemberDiscount(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                )}

                <Button onClick={handleSettingsSave} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface PriceControllerProps {
  isOwner: boolean;
}

export function PriceController({ isOwner }: PriceControllerProps) {
  const { prices, priceHistory, loading, updatePrice, getPriceHistoryForType } = useFuelPricing();

  const fuelTypes = [
    { type: "gasoline", label: "Regular Gas" },
    { type: "diesel", label: "Diesel" },
    { type: "premium", label: "Premium Gas" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price Controller
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage fuel pricing for your marina
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fuelTypes.map(({ type, label }) => (
          <PriceCard
            key={type}
            fuelType={type}
            label={label}
            price={prices.find(p => p.fuel_type === type)}
            history={getPriceHistoryForType(type)}
            onUpdate={updatePrice}
            isOwner={isOwner}
          />
        ))}
      </div>

      {/* Recent Price History */}
      {priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Price History (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {priceHistory.slice(0, 20).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {entry.fuel_type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {format(new Date(entry.changed_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Cost: ${entry.cost_basis.toFixed(3)}
                    </span>
                    <span className="font-medium">
                      Retail: ${entry.retail_price.toFixed(3)}
                    </span>
                    {entry.member_price && (
                      <span className="text-primary">
                        Member: ${entry.member_price.toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
