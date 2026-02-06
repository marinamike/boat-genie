import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, addMonths, format } from "date-fns";

export interface RecurringInvoice {
  id: string;
  business_id: string;
  lease_id: string | null;
  yard_asset_id: string | null;
  boat_id: string | null;
  owner_id: string;
  invoice_type: "monthly" | "seasonal" | "annual";
  billing_period_start: string;
  billing_period_end: string;
  base_rent: number;
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
  additional_charges: any[];
  grand_total: number;
  status: "draft" | "pending" | "sent" | "paid" | "overdue" | "void";
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MidStayMeterReading {
  id: string;
  business_id: string;
  lease_id: string | null;
  yard_asset_id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  billing_period: string | null;
  added_to_invoice_id: string | null;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export function useRecurringBilling() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);

  /**
   * Generate a monthly invoice for a lease
   */
  const generateMonthlyInvoice = async (params: {
    leaseId: string;
    yardAssetId: string;
    boatId: string;
    ownerId: string;
    monthlyRate: number;
    billingMonth?: Date;
  }): Promise<RecurringInvoice | null> => {
    if (!user || !business?.id) {
      toast.error("Business context required");
      return null;
    }

    setLoading(true);
    try {
      const billingMonth = params.billingMonth || new Date();
      const periodStart = startOfMonth(billingMonth);
      const periodEnd = endOfMonth(billingMonth);
      const dueDate = addMonths(periodStart, 1); // Due on 1st of next month

      // Get any mid-stay meter readings for this period
      const { data: meterReadings } = await supabase
        .from("mid_stay_meter_readings")
        .select("*")
        .eq("lease_id", params.leaseId)
        .gte("reading_date", format(periodStart, "yyyy-MM-dd"))
        .lte("reading_date", format(periodEnd, "yyyy-MM-dd"))
        .is("added_to_invoice_id", null);

      // Calculate utility charges from meter readings
      let powerTotal = 0;
      let waterTotal = 0;
      let powerUsage = 0;
      let waterUsage = 0;

      // Process readings if available (simplified - would need more logic for start/end)
      if (meterReadings && meterReadings.length > 0) {
        // Get meter details to determine rates
        const meterIds = [...new Set(meterReadings.map(r => r.meter_id))];
        const { data: meters } = await supabase
          .from("utility_meters")
          .select("*")
          .in("id", meterIds);

      if (meters) {
          // Get global rates for inheritance fallback
          const powerGlobalRate = business?.power_rate_per_kwh ?? 0;
          const waterGlobalRate = business?.water_rate_per_gallon ?? 0;

          for (const reading of meterReadings) {
            const meter = meters.find(m => m.id === reading.meter_id);
            if (meter) {
              const usage = reading.reading_value;
              // Apply rate inheritance: meter rate > 0 ? meter rate : global rate
              const effectiveRate = meter.rate_per_unit > 0 
                ? meter.rate_per_unit 
                : (meter.meter_type === "power" ? powerGlobalRate : waterGlobalRate);
              const total = usage * effectiveRate;
              if (meter.meter_type === "power") {
                powerUsage += usage;
                powerTotal += total;
              } else if (meter.meter_type === "water") {
                waterUsage += usage;
                waterTotal += total;
              }
            }
          }
        }
      }

      const grandTotal = params.monthlyRate + powerTotal + waterTotal;

      const { data, error } = await supabase
        .from("recurring_invoices")
        .insert({
          business_id: business.id,
          lease_id: params.leaseId,
          yard_asset_id: params.yardAssetId,
          boat_id: params.boatId,
          owner_id: params.ownerId,
          invoice_type: "monthly",
          billing_period_start: format(periodStart, "yyyy-MM-dd"),
          billing_period_end: format(periodEnd, "yyyy-MM-dd"),
          base_rent: params.monthlyRate,
          power_usage: powerUsage,
          power_total: powerTotal,
          water_usage: waterUsage,
          water_total: waterTotal,
          grand_total: grandTotal,
          status: "draft",
          due_date: format(dueDate, "yyyy-MM-dd"),
        })
        .select()
        .single();

      if (error) throw error;

      // Link meter readings to this invoice
      if (meterReadings && meterReadings.length > 0) {
        await supabase
          .from("mid_stay_meter_readings")
          .update({ added_to_invoice_id: data.id })
          .in("id", meterReadings.map(r => r.id));
      }

      toast.success("Monthly invoice generated");
      return data as RecurringInvoice;
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Record a mid-stay meter reading
   */
  const recordMidStayReading = async (params: {
    leaseId: string;
    yardAssetId: string;
    meterId: string;
    readingValue: number;
    readingDate?: Date;
    notes?: string;
  }): Promise<MidStayMeterReading | null> => {
    if (!user || !business?.id) {
      toast.error("Business context required");
      return null;
    }

    setLoading(true);
    try {
      const readingDate = params.readingDate || new Date();
      const billingPeriod = format(readingDate, "yyyy-MM");

      const { data, error } = await supabase
        .from("mid_stay_meter_readings")
        .insert({
          business_id: business.id,
          lease_id: params.leaseId,
          yard_asset_id: params.yardAssetId,
          meter_id: params.meterId,
          reading_value: params.readingValue,
          reading_date: format(readingDate, "yyyy-MM-dd"),
          billing_period: billingPeriod,
          recorded_by: user.id,
          notes: params.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the meter's current reading
      await supabase
        .from("utility_meters")
        .update({
          current_reading: params.readingValue,
          last_reading_date: format(readingDate, "yyyy-MM-dd"),
        })
        .eq("id", params.meterId);

      toast.success("Meter reading recorded");
      return data as MidStayMeterReading;
    } catch (error: any) {
      console.error("Error recording meter reading:", error);
      toast.error("Failed to record meter reading");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get recurring invoices for a lease
   */
  const getLeaseInvoices = async (leaseId: string): Promise<RecurringInvoice[]> => {
    try {
      const { data, error } = await supabase
        .from("recurring_invoices")
        .select("*")
        .eq("lease_id", leaseId)
        .order("billing_period_start", { ascending: false });

      if (error) throw error;
      return (data || []) as RecurringInvoice[];
    } catch (error: any) {
      console.error("Error fetching lease invoices:", error);
      return [];
    }
  };

  /**
   * Get all recurring invoices for the business
   */
  const getBusinessInvoices = async (): Promise<RecurringInvoice[]> => {
    if (!business?.id) return [];

    try {
      const { data, error } = await supabase
        .from("recurring_invoices")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as RecurringInvoice[];
    } catch (error: any) {
      console.error("Error fetching business invoices:", error);
      return [];
    }
  };

  /**
   * Get mid-stay meter readings for a lease
   */
  const getMidStayReadings = async (leaseId: string): Promise<MidStayMeterReading[]> => {
    try {
      const { data, error } = await supabase
        .from("mid_stay_meter_readings")
        .select("*")
        .eq("lease_id", leaseId)
        .order("reading_date", { ascending: false });

      if (error) throw error;
      return (data || []) as MidStayMeterReading[];
    } catch (error: any) {
      console.error("Error fetching mid-stay readings:", error);
      return [];
    }
  };

  /**
   * Update invoice status
   */
  const updateInvoiceStatus = async (
    invoiceId: string,
    status: RecurringInvoice["status"]
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const updateData: any = { status };
      if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("recurring_invoices")
        .update(updateData)
        .eq("id", invoiceId);

      if (error) throw error;
      toast.success(`Invoice marked as ${status}`);
      return true;
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate monthly invoices for all active leases (batch billing)
   */
  const runMonthlyBillingBatch = async (): Promise<{
    leaseId: string;
    boatName: string;
    assetName: string;
    baseRent: number;
    powerTotal: number;
    waterTotal: number;
    grandTotal: number;
  }[]> => {
    if (!user || !business?.id) {
      toast.error("Business context required");
      return [];
    }

    setLoading(true);
    try {
      // Fetch all active leases for this business
      const { data: leases, error: leaseError } = await supabase
        .from("lease_agreements")
        .select(`
          id,
          yard_asset_id,
          boat_id,
          owner_id,
          monthly_rate,
          boat:boats(id, name, make, model),
          asset:yard_assets(id, asset_name)
        `)
        .eq("business_id", business.id)
        .eq("lease_status", "active");

      if (leaseError) throw leaseError;
      if (!leases || leases.length === 0) {
        toast.info("No active leases found");
        return [];
      }

      const results: {
        leaseId: string;
        boatName: string;
        assetName: string;
        baseRent: number;
        powerTotal: number;
        waterTotal: number;
        grandTotal: number;
      }[] = [];

      const billingMonth = new Date();
      const periodStart = startOfMonth(billingMonth);
      const periodEnd = endOfMonth(billingMonth);
      const dueDate = addMonths(periodStart, 1);

      // Get global rates for inheritance
      const powerGlobalRate = business?.power_rate_per_kwh ?? 0;
      const waterGlobalRate = business?.water_rate_per_gallon ?? 0;

      for (const lease of leases) {
        try {
          // Get any mid-stay meter readings for this period that haven't been invoiced
          const { data: meterReadings } = await supabase
            .from("mid_stay_meter_readings")
            .select("*")
            .eq("lease_id", lease.id)
            .gte("reading_date", format(periodStart, "yyyy-MM-dd"))
            .lte("reading_date", format(periodEnd, "yyyy-MM-dd"))
            .is("added_to_invoice_id", null);

          let powerTotal = 0;
          let waterTotal = 0;
          let powerUsage = 0;
          let waterUsage = 0;

          if (meterReadings && meterReadings.length > 0) {
            const meterIds = [...new Set(meterReadings.map(r => r.meter_id))];
            const { data: meters } = await supabase
              .from("utility_meters")
              .select("*")
              .in("id", meterIds);

            if (meters) {
              for (const reading of meterReadings) {
                const meter = meters.find(m => m.id === reading.meter_id);
                if (meter) {
                  const usage = reading.reading_value;
                  // Apply rate inheritance
                  const effectiveRate = meter.rate_per_unit > 0
                    ? meter.rate_per_unit
                    : (meter.meter_type === "power" ? powerGlobalRate : waterGlobalRate);
                  const total = usage * effectiveRate;
                  if (meter.meter_type === "power") {
                    powerUsage += usage;
                    powerTotal += total;
                  } else if (meter.meter_type === "water") {
                    waterUsage += usage;
                    waterTotal += total;
                  }
                }
              }
            }
          }

          const grandTotal = lease.monthly_rate + powerTotal + waterTotal;

          // Create the invoice
          const { data: invoice, error: invoiceError } = await supabase
            .from("recurring_invoices")
            .insert({
              business_id: business.id,
              lease_id: lease.id,
              yard_asset_id: lease.yard_asset_id,
              boat_id: lease.boat_id,
              owner_id: lease.owner_id,
              invoice_type: "monthly",
              billing_period_start: format(periodStart, "yyyy-MM-dd"),
              billing_period_end: format(periodEnd, "yyyy-MM-dd"),
              base_rent: lease.monthly_rate,
              power_usage: powerUsage,
              power_total: powerTotal,
              water_usage: waterUsage,
              water_total: waterTotal,
              grand_total: grandTotal,
              status: "draft",
              due_date: format(dueDate, "yyyy-MM-dd"),
            })
            .select()
            .single();

          if (invoiceError) {
            console.error(`Error creating invoice for lease ${lease.id}:`, invoiceError);
            continue;
          }

          // Link meter readings to this invoice
          if (meterReadings && meterReadings.length > 0) {
            await supabase
              .from("mid_stay_meter_readings")
              .update({ added_to_invoice_id: invoice.id })
              .in("id", meterReadings.map(r => r.id));
          }

          const boatData = lease.boat as { id: string; name: string; make?: string; model?: string } | null;
          const assetData = lease.asset as { id: string; asset_name: string } | null;

          results.push({
            leaseId: lease.id,
            boatName: boatData?.name || "Unknown Vessel",
            assetName: assetData?.asset_name || "Unknown Slip",
            baseRent: lease.monthly_rate,
            powerTotal,
            waterTotal,
            grandTotal,
          });
        } catch (err) {
          console.error(`Error processing lease ${lease.id}:`, err);
        }
      }

      if (results.length > 0) {
        toast.success(`Generated ${results.length} monthly invoice${results.length !== 1 ? "s" : ""}`);
      }

      return results;
    } catch (error: any) {
      console.error("Error running batch billing:", error);
      toast.error("Failed to run monthly billing");
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    generateMonthlyInvoice,
    recordMidStayReading,
    getLeaseInvoices,
    getBusinessInvoices,
    getMidStayReadings,
    updateInvoiceStatus,
    runMonthlyBillingBatch,
  };
}
