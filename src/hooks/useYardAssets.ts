import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type YardAssetType = Database["public"]["Enums"]["yard_asset_type"];
type LeaseStatus = Database["public"]["Enums"]["lease_status"];
type MeterType = Database["public"]["Enums"]["utility_meter_type"];

export interface YardAsset {
  id: string;
  business_id: string;
  asset_name: string;
  asset_type: YardAssetType;
  dock_section: string | null;
  max_loa_ft: number | null;
  max_beam_ft: number | null;
  max_draft_ft: number | null;
  position_order: number;
  is_available: boolean;
  current_boat_id: string | null;
  current_reservation_id: string | null;
  daily_rate_per_ft: number | null;
  weekly_rate_per_ft: number | null;
  monthly_rate_per_ft: number | null;
  seasonal_rate_per_ft: number | null;
  annual_rate_per_ft: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
    owner_id: string;
  } | null;
  reservation?: {
    id: string;
    status: string;
    requested_arrival: string;
  } | null;
  meters?: UtilityMeter[];
  lease?: LeaseAgreement | null;
  alerts?: PowerAlert[];
}

export interface UtilityMeter {
  id: string;
  business_id: string;
  yard_asset_id: string | null;
  meter_type: MeterType;
  meter_name: string;
  meter_number: string | null;
  rate_per_unit: number;
  current_reading: number;
  last_reading_date: string | null;
  is_active: boolean;
}

export interface MeterReading {
  id: string;
  meter_id: string;
  business_id: string;
  boat_id: string | null;
  previous_reading: number;
  current_reading: number;
  usage_amount: number;
  rate_per_unit: number;
  total_charge: number;
  reading_date: string;
  recorded_by: string;
  billing_period_start: string | null;
  billing_period_end: string | null;
  is_billed: boolean;
  notes: string | null;
}

export interface LeaseAgreement {
  id: string;
  business_id: string;
  yard_asset_id: string;
  boat_id: string;
  owner_id: string;
  lease_status: LeaseStatus;
  start_date: string;
  end_date: string | null;
  monthly_rate: number;
  deposit_amount: number;
  deposit_paid: boolean;
  auto_renew: boolean;
  renewal_months: number;
  power_included: boolean;
  water_included: boolean;
  insurance_verified: boolean;
  registration_verified: boolean;
  contract_doc_url: string | null;
  terms_notes: string | null;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    owner_id: string;
  };
  asset?: YardAsset;
}

export interface PowerAlert {
  id: string;
  business_id: string;
  yard_asset_id: string;
  meter_id: string | null;
  alert_type: string;
  alert_message: string | null;
  is_resolved: boolean;
  created_at: string;
}

export function useYardAssets() {
  const { business } = useBusiness();
  const [assets, setAssets] = useState<YardAsset[]>([]);
  const [meters, setMeters] = useState<UtilityMeter[]>([]);
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [alerts, setAlerts] = useState<PowerAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    if (!business?.id) return;

    try {
      const { data, error } = await supabase
        .from("yard_assets")
        .select(`
          *,
          boat:boats(id, name, make, model, length_ft, owner_id),
          reservation:marina_reservations(id, status, requested_arrival)
        `)
        .eq("business_id", business.id)
        .order("dock_section", { ascending: true })
        .order("position_order", { ascending: true });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching yard assets:", error);
    }
  }, [business?.id]);

  const fetchMeters = useCallback(async () => {
    if (!business?.id) return;

    try {
      const { data, error } = await supabase
        .from("utility_meters")
        .select("*")
        .eq("business_id", business.id)
        .order("meter_name");

      if (error) throw error;
      setMeters(data || []);
    } catch (error) {
      console.error("Error fetching meters:", error);
    }
  }, [business?.id]);

  const fetchLeases = useCallback(async () => {
    if (!business?.id) return;

    try {
      const { data, error } = await supabase
        .from("lease_agreements")
        .select(`
          *,
          boat:boats(id, name, make, model, owner_id),
          asset:yard_assets(id, asset_name, asset_type, dock_section)
        `)
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeases((data as unknown as LeaseAgreement[]) || []);
    } catch (error) {
      console.error("Error fetching leases:", error);
    }
  }, [business?.id]);

  const fetchMeterReadings = useCallback(async () => {
    if (!business?.id) return;

    try {
      const { data, error } = await supabase
        .from("meter_readings")
        .select("*")
        .eq("business_id", business.id)
        .order("reading_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      setMeterReadings(data || []);
    } catch (error) {
      console.error("Error fetching meter readings:", error);
    }
  }, [business?.id]);

  const fetchAlerts = useCallback(async () => {
    if (!business?.id) return;

    try {
      const { data, error } = await supabase
        .from("power_alerts")
        .select("*")
        .eq("business_id", business.id)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }, [business?.id]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAssets(),
      fetchMeters(),
      fetchLeases(),
      fetchMeterReadings(),
      fetchAlerts(),
    ]);
    setLoading(false);
  }, [fetchAssets, fetchMeters, fetchLeases, fetchMeterReadings, fetchAlerts]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Asset CRUD
  const createAsset = async (asset: Partial<YardAsset>) => {
    if (!business?.id) return null;

    try {
      const { data, error } = await supabase
        .from("yard_assets")
        .insert({
          ...asset,
          business_id: business.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      toast.success("Slip/space created successfully");
      await fetchAssets();
      return data;
    } catch (error: any) {
      toast.error("Failed to create slip/space: " + error.message);
      return null;
    }
  };

  const updateAsset = async (id: string, updates: Partial<YardAsset>) => {
    try {
      const { error } = await supabase
        .from("yard_assets")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      toast.success("Slip/space updated");
      await fetchAssets();
      return true;
    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
      return false;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from("yard_assets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Slip/space deleted");
      await fetchAssets();
      return true;
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
      return false;
    }
  };

  // Assign boat to slip
  const assignBoatToSlip = async (assetId: string, boatId: string | null, reservationId?: string) => {
    try {
      const { error } = await supabase
        .from("yard_assets")
        .update({
          current_boat_id: boatId,
          current_reservation_id: reservationId || null,
          is_available: !boatId,
        })
        .eq("id", assetId);

      if (error) throw error;
      toast.success(boatId ? "Boat assigned to slip" : "Slip cleared");
      await fetchAssets();
      return true;
    } catch (error: any) {
      toast.error("Failed to assign boat: " + error.message);
      return false;
    }
  };

  // Meter CRUD
  const createMeter = async (meter: Partial<UtilityMeter>) => {
    if (!business?.id) return null;

    try {
      const { data, error } = await supabase
        .from("utility_meters")
        .insert({
          ...meter,
          business_id: business.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      toast.success("Meter created successfully");
      await fetchMeters();
      return data;
    } catch (error: any) {
      toast.error("Failed to create meter: " + error.message);
      return null;
    }
  };

  const updateMeter = async (id: string, updates: Partial<UtilityMeter>) => {
    try {
      const { error } = await supabase
        .from("utility_meters")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      toast.success("Meter updated");
      await fetchMeters();
      return true;
    } catch (error: any) {
      toast.error("Failed to update meter: " + error.message);
      return false;
    }
  };

  const deleteMeter = async (id: string) => {
    try {
      const { error } = await supabase
        .from("utility_meters")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Meter deleted");
      await fetchMeters();
      return true;
    } catch (error: any) {
      toast.error("Failed to delete meter: " + error.message);
      return false;
    }
  };

  // Record meter reading
  const recordMeterReading = async (
    meterId: string,
    currentReading: number,
    boatId?: string,
    notes?: string
  ) => {
    if (!business?.id) return null;

    const meter = meters.find((m) => m.id === meterId);
    if (!meter) {
      toast.error("Meter not found");
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      // Create reading
      const { data, error } = await supabase
        .from("meter_readings")
        .insert({
          meter_id: meterId,
          business_id: business.id,
          boat_id: boatId || null,
          previous_reading: meter.current_reading,
          current_reading: currentReading,
          rate_per_unit: meter.rate_per_unit,
          recorded_by: user.id,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Update meter's current reading
      await supabase
        .from("utility_meters")
        .update({
          current_reading: currentReading,
          last_reading_date: new Date().toISOString(),
        })
        .eq("id", meterId);

      toast.success(`Reading recorded: ${(currentReading - meter.current_reading).toFixed(2)} units used`);
      await Promise.all([fetchMeters(), fetchMeterReadings()]);
      return data;
    } catch (error: any) {
      toast.error("Failed to record reading: " + error.message);
      return null;
    }
  };

  // Lease CRUD
  const createLease = async (lease: Partial<LeaseAgreement>) => {
    if (!business?.id) return null;

    try {
      const { data, error } = await supabase
        .from("lease_agreements")
        .insert({
          ...lease,
          business_id: business.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Assign boat to the asset
      if (lease.yard_asset_id && lease.boat_id) {
        await assignBoatToSlip(lease.yard_asset_id, lease.boat_id);
      }

      toast.success("Lease agreement created");
      await fetchLeases();
      return data;
    } catch (error: any) {
      toast.error("Failed to create lease: " + error.message);
      return null;
    }
  };

  const updateLease = async (id: string, updates: Partial<LeaseAgreement>) => {
    try {
      const { error } = await supabase
        .from("lease_agreements")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      toast.success("Lease updated");
      await fetchLeases();
      return true;
    } catch (error: any) {
      toast.error("Failed to update lease: " + error.message);
      return false;
    }
  };

  const terminateLease = async (id: string) => {
    const lease = leases.find((l) => l.id === id);
    if (!lease) return false;

    try {
      const { error } = await supabase
        .from("lease_agreements")
        .update({ lease_status: "terminated" as LeaseStatus })
        .eq("id", id);

      if (error) throw error;

      // Clear the boat from the slip
      if (lease.yard_asset_id) {
        await assignBoatToSlip(lease.yard_asset_id, null);
      }

      toast.success("Lease terminated");
      await fetchLeases();
      return true;
    } catch (error: any) {
      toast.error("Failed to terminate lease: " + error.message);
      return false;
    }
  };

  // Power alerts
  const createAlert = async (
    assetId: string,
    alertType: string,
    message?: string,
    meterId?: string
  ) => {
    if (!business?.id) return null;

    try {
      const { data, error } = await supabase
        .from("power_alerts")
        .insert({
          business_id: business.id,
          yard_asset_id: assetId,
          meter_id: meterId || null,
          alert_type: alertType,
          alert_message: message,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchAlerts();
      return data;
    } catch (error: any) {
      console.error("Failed to create alert:", error);
      return null;
    }
  };

  const resolveAlert = async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("power_alerts")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alert resolved");
      await fetchAlerts();
      return true;
    } catch (error: any) {
      toast.error("Failed to resolve alert: " + error.message);
      return false;
    }
  };

  // Get grouped assets by section
  const assetsBySection = assets.reduce((acc, asset) => {
    const section = asset.dock_section || "Unassigned";
    if (!acc[section]) acc[section] = [];
    acc[section].push(asset);
    return acc;
  }, {} as Record<string, YardAsset[]>);

  // Get assets with enriched data
  const enrichedAssets = assets.map((asset) => ({
    ...asset,
    meters: meters.filter((m) => m.yard_asset_id === asset.id),
    lease: leases.find(
      (l) => l.yard_asset_id === asset.id && l.lease_status === "active"
    ),
    alerts: alerts.filter((a) => a.yard_asset_id === asset.id),
  }));

  return {
    assets: enrichedAssets,
    assetsBySection,
    meters,
    leases,
    meterReadings,
    alerts,
    loading,
    refreshAll,
    createAsset,
    updateAsset,
    deleteAsset,
    assignBoatToSlip,
    createMeter,
    updateMeter,
    deleteMeter,
    recordMeterReading,
    createLease,
    updateLease,
    terminateLease,
    createAlert,
    resolveAlert,
  };
}
