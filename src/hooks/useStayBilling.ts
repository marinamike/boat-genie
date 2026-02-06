import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";
import { BillingBreakdown } from "@/lib/stayBilling";
import { format } from "date-fns";

export interface StayMeterReading {
  id: string;
  dock_status_id: string;
  meter_id: string;
  reading_type: "check_in" | "check_out" | "mid_stay";
  reading_value: number;
  recorded_at: string;
  recorded_by: string | null;
}

export interface StayInvoice {
  id: string;
  reservation_id: string | null;
  dock_status_id: string;
  business_id: string;
  boat_id: string | null;
  check_in_at: string;
  check_out_at: string;
  stay_days: number;
  rate_tier: string;
  rate_per_day: number;
  vessel_length_ft: number;
  stay_subtotal: number;
  power_start_reading: number;
  power_end_reading: number;
  power_usage: number;
  power_rate: number;
  power_total: number;
  water_start_reading: number;
  water_end_reading: number;
  water_usage: number;
  water_rate: number;
  water_total: number;
  grand_total: number;
  status: "draft" | "finalized" | "paid" | "void";
  notes: string | null;
  created_at: string;
  finalized_at: string | null;
}

export function useStayBilling() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);

  /**
   * Record a meter reading for a stay
   */
  const recordMeterReading = async (
    dockStatusId: string,
    meterId: string,
    readingType: "check_in" | "check_out" | "mid_stay",
    readingValue: number
  ): Promise<StayMeterReading | null> => {
    if (!user) {
      toast.error("You must be logged in");
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stay_meter_readings")
        .insert({
          dock_status_id: dockStatusId,
          meter_id: meterId,
          reading_type: readingType,
          reading_value: readingValue,
          recorded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as StayMeterReading;
    } catch (error: any) {
      console.error("Error recording meter reading:", error);
      toast.error("Failed to record meter reading");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get meter readings for a dock status
   */
  const getMeterReadings = async (
    dockStatusId: string
  ): Promise<StayMeterReading[]> => {
    try {
      const { data, error } = await supabase
        .from("stay_meter_readings")
        .select("*")
        .eq("dock_status_id", dockStatusId)
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return (data || []) as StayMeterReading[];
    } catch (error: any) {
      console.error("Error fetching meter readings:", error);
      return [];
    }
  };

  /**
   * Create a finalized invoice for a stay and sync meter readings
   */
  const createInvoice = async (params: {
    reservationId: string | null;
    dockStatusId: string;
    boatId: string | null;
    ownerId?: string;
    checkInAt: Date;
    checkOutAt: Date;
    billing: BillingBreakdown;
    powerMeterId?: string;
    waterMeterId?: string;
    notes?: string;
  }): Promise<StayInvoice | null> => {
    if (!user || !business?.id) {
      toast.error("Business context required");
      return null;
    }

    setLoading(true);
    try {
      const powerUtil = params.billing.utilities.find((u) => u.meterType === "power");
      const waterUtil = params.billing.utilities.find((u) => u.meterType === "water");

      const { data, error } = await supabase
        .from("stay_invoices")
        .insert({
          reservation_id: params.reservationId,
          dock_status_id: params.dockStatusId,
          business_id: business.id,
          boat_id: params.boatId,
          owner_id: params.ownerId || null,
          check_in_at: params.checkInAt.toISOString(),
          check_out_at: params.checkOutAt.toISOString(),
          stay_days: params.billing.stayCalculation.totalDays,
          rate_tier: params.billing.stayCalculation.tier,
          rate_per_day: params.billing.stayCalculation.ratePerDayPerFt,
          vessel_length_ft: params.billing.stayCalculation.vesselLengthFt,
          stay_subtotal: params.billing.stayCalculation.staySubtotal,
          power_start_reading: powerUtil?.startReading || 0,
          power_end_reading: powerUtil?.endReading || 0,
          power_usage: powerUtil?.usage || 0,
          power_rate: powerUtil?.ratePerUnit || 0,
          power_total: powerUtil?.total || 0,
          water_start_reading: waterUtil?.startReading || 0,
          water_end_reading: waterUtil?.endReading || 0,
          water_usage: waterUtil?.usage || 0,
          water_rate: waterUtil?.ratePerUnit || 0,
          water_total: waterUtil?.total || 0,
          grand_total: params.billing.grandTotal,
          status: "finalized",
          notes: params.notes || null,
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create unified customer invoice entry if owner is known
      if (params.ownerId) {
        const sourceRef = `Slip Stay - ${format(params.checkInAt, "MMM d")} to ${format(params.checkOutAt, "MMM d, yyyy")}`;
        await supabase
          .from("customer_invoices")
          .insert({
            customer_id: params.ownerId,
            business_id: business.id,
            source_type: "slip_transient",
            source_id: data.id,
            source_reference: sourceRef,
            amount: params.billing.grandTotal,
            status: "pending",
          });
      }

      // Sync meter readings: update utility_meters with the checkout end readings
      const now = new Date().toISOString();
      
      if (params.powerMeterId && powerUtil && powerUtil.endReading > 0) {
        await supabase
          .from("utility_meters")
          .update({
            current_reading: powerUtil.endReading,
            last_reading_date: now,
          })
          .eq("id", params.powerMeterId);
      }

      if (params.waterMeterId && waterUtil && waterUtil.endReading > 0) {
        await supabase
          .from("utility_meters")
          .update({
            current_reading: waterUtil.endReading,
            last_reading_date: now,
          })
          .eq("id", params.waterMeterId);
      }

      toast.success("Invoice created successfully");
      return data as StayInvoice;
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get invoices for the business
   */
  const getInvoices = async (): Promise<StayInvoice[]> => {
    if (!business?.id) return [];

    try {
      const { data, error } = await supabase
        .from("stay_invoices")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as StayInvoice[];
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      return [];
    }
  };

  return {
    loading,
    recordMeterReading,
    getMeterReadings,
    createInvoice,
    getInvoices,
  };
}
