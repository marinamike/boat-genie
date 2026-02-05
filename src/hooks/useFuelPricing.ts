import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/hooks/use-toast";

export interface FuelPrice {
  id: string;
  business_id: string;
  fuel_type: "gasoline" | "diesel";
  cost_basis: number;
  retail_price: number;
  member_price: number | null;
  auto_margin_enabled: boolean;
  auto_margin_amount: number;
  member_discount_enabled: boolean;
  member_discount_amount: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FuelPriceHistory {
  id: string;
  business_id: string;
  fuel_type: string;
  cost_basis: number;
  retail_price: number;
  member_price: number | null;
  changed_by: string | null;
  changed_at: string;
}

export function useFuelPricing() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [priceHistory, setPriceHistory] = useState<FuelPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    if (!business?.id) return;

    const { data, error } = await supabase
      .from("fuel_prices")
      .select("*")
      .eq("business_id", business.id)
      .order("fuel_type");

    if (error) {
      console.error("Error fetching fuel prices:", error);
      return;
    }

    setPrices(data as FuelPrice[]);
  }, [business?.id]);

  const fetchPriceHistory = useCallback(async (fuelType?: string) => {
    if (!business?.id) return;

    let query = supabase
      .from("fuel_price_history")
      .select("*")
      .eq("business_id", business.id)
      .order("changed_at", { ascending: false })
      .limit(90); // 30 days * 3 fuel types

    if (fuelType) {
      query = query.eq("fuel_type", fuelType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching price history:", error);
      return;
    }

    setPriceHistory(data as FuelPriceHistory[]);
  }, [business?.id]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPrices(), fetchPriceHistory()]);
    setLoading(false);
  }, [fetchPrices, fetchPriceHistory]);

  useEffect(() => {
    if (business?.id) {
      refresh();
    }
  }, [business?.id, refresh]);

  // Get or create price record for a fuel type
  const ensurePriceRecord = async (fuelType: string): Promise<FuelPrice | null> => {
    if (!business?.id) return null;

    const existing = prices.find(p => p.fuel_type === fuelType);
    if (existing) return existing;

    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("fuel_prices")
      .insert({
        business_id: business.id,
        fuel_type: fuelType,
        cost_basis: 0,
        retail_price: 0,
        updated_by: user.user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating price record:", error);
      return null;
    }

    await fetchPrices();
    return data as FuelPrice;
  };

  const updatePrice = async (
    fuelType: string,
    updates: Partial<Pick<FuelPrice, 
      "cost_basis" | "retail_price" | "member_price" | 
      "auto_margin_enabled" | "auto_margin_amount" |
      "member_discount_enabled" | "member_discount_amount"
    >>
  ) => {
    if (!business?.id) return false;

    await ensurePriceRecord(fuelType);

    const { data: user } = await supabase.auth.getUser();

    // Calculate auto-margin if enabled and cost_basis is being updated
    let finalUpdates = { ...updates, updated_by: user.user?.id };
    
    const currentPrice = prices.find(p => p.fuel_type === fuelType);
    if (currentPrice?.auto_margin_enabled || updates.auto_margin_enabled) {
      const costBasis = updates.cost_basis ?? currentPrice?.cost_basis ?? 0;
      const marginAmount = updates.auto_margin_amount ?? currentPrice?.auto_margin_amount ?? 1.50;
      if (updates.cost_basis !== undefined && !updates.retail_price) {
        finalUpdates.retail_price = costBasis + marginAmount;
      }
    }

    // Calculate member price if discount is enabled
    if (currentPrice?.member_discount_enabled || updates.member_discount_enabled) {
      const retailPrice = finalUpdates.retail_price ?? currentPrice?.retail_price ?? 0;
      const discountAmount = updates.member_discount_amount ?? currentPrice?.member_discount_amount ?? 0.10;
      finalUpdates.member_price = retailPrice - discountAmount;
    }

    const { error } = await supabase
      .from("fuel_prices")
      .update(finalUpdates)
      .eq("business_id", business.id)
      .eq("fuel_type", fuelType);

    if (error) {
      toast({ title: "Error updating price", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Price updated", description: `${fuelType} pricing has been updated.` });
    await refresh();
    return true;
  };

  // Get current retail price for a fuel type (for sales forms)
  const getRetailPrice = (fuelType: string): number => {
    const price = prices.find(p => p.fuel_type.toLowerCase() === fuelType.toLowerCase());
    return price?.retail_price ?? 0;
  };

  // Get member price for a fuel type
  const getMemberPrice = (fuelType: string): number | null => {
    const price = prices.find(p => p.fuel_type.toLowerCase() === fuelType.toLowerCase());
    if (!price?.member_discount_enabled) return null;
    return price.member_price;
  };

  // Get price history for sparkline (last 30 days for a fuel type)
  const getPriceHistoryForType = (fuelType: string): FuelPriceHistory[] => {
    return priceHistory
      .filter(h => h.fuel_type === fuelType)
      .slice(0, 30);
  };

  return {
    prices,
    priceHistory,
    loading,
    refresh,
    updatePrice,
    getRetailPrice,
    getMemberPrice,
    getPriceHistoryForType,
    ensurePriceRecord,
  };
}
