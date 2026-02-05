import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fuel, Users } from "lucide-react";

interface FuelPrice {
  fuel_type: string;
  retail_price: number;
  member_price: number | null;
  member_discount_enabled: boolean;
}

interface LiveFuelPricesProps {
  businessId?: string;
  showMemberPrices?: boolean;
}

export function LiveFuelPrices({ businessId, showMemberPrices = false }: LiveFuelPricesProps) {
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("fuel_prices")
        .select("fuel_type, retail_price, member_price, member_discount_enabled")
        .eq("business_id", businessId);

      if (!error && data) {
        setPrices(data.filter(p => p.retail_price > 0) as FuelPrice[]);
      }
      setLoading(false);
    };

    fetchPrices();
  }, [businessId]);

  if (loading) {
    return null;
  }

  if (prices.length === 0) {
    return null;
  }

  const fuelLabels: Record<string, string> = {
    gasoline: "Regular",
    diesel: "Diesel",
    premium: "Premium",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Fuel className="w-4 h-4" />
          Live Fuel Prices
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {prices.map((price) => (
            <div
              key={price.fuel_type}
              className="p-3 rounded-lg bg-muted/50 text-center"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {fuelLabels[price.fuel_type] || price.fuel_type}
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                ${price.retail_price.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">per gallon</p>
              
              {showMemberPrices && price.member_discount_enabled && price.member_price && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Member: ${price.member_price.toFixed(2)}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
