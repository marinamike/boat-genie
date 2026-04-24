import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/hooks/use-toast";

export type PricingModel = "fixed" | "hourly" | "per_foot" | "percentage";

export interface BusinessFee {
  id: string;
  business_id: string;
  name: string;
  pricing_model: PricingModel;
  amount: number;
  is_active: boolean;
  created_at: string;
}

export function useBusinessFees() {
  const { business, refreshBusiness } = useBusiness();
  const { toast } = useToast();
  const [fees, setFees] = useState<BusinessFee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFees = useCallback(async () => {
    if (!business) {
      setFees([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("business_fees")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Error", description: "Failed to load fees.", variant: "destructive" });
    } else {
      setFees((data || []) as BusinessFee[]);
    }
    setLoading(false);
  }, [business, toast]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const updateEmergencyFee = async ({ enabled, amount }: { enabled: boolean; amount: number }) => {
    if (!business) return;
    const { error } = await supabase
      .from("businesses")
      .update({ emergency_fee_enabled: enabled, emergency_fee_amount: amount })
      .eq("id", business.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await refreshBusiness();
    toast({ title: "Saved", description: "Emergency fee settings updated." });
  };

  const createFee = async (input: {
    name: string;
    pricing_model: PricingModel;
    amount: number;
    is_active: boolean;
  }) => {
    if (!business) return;
    const { error } = await supabase.from("business_fees").insert({
      business_id: business.id,
      ...input,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Fee added" });
    await fetchFees();
  };

  const updateFee = async (
    id: string,
    partial: Partial<Pick<BusinessFee, "pricing_model" | "amount" | "is_active">>
  ) => {
    const { error } = await supabase.from("business_fees").update(partial).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await fetchFees();
  };

  const deleteFee = async (id: string) => {
    const { error } = await supabase.from("business_fees").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Fee deleted" });
    await fetchFees();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await updateFee(id, { is_active: !current });
  };

  return {
    fees,
    loading,
    emergencyFeeEnabled: business?.emergency_fee_enabled ?? false,
    emergencyFeeAmount: business?.emergency_fee_amount ?? 0,
    fetchFees,
    updateEmergencyFee,
    createFee,
    updateFee,
    deleteFee,
    toggleActive,
  };
}
