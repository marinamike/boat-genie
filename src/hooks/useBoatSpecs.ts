import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVesselSpecs } from "./useVesselSpecs";

export interface BoatSpecData {
  // Physical dimensions
  loa_ft: number | null;
  beam_ft: number | null;
  draft_engines_up_ft: number | null;
  draft_engines_down_ft: number | null;
  bridge_clearance_ft: number | null;
  dry_weight_lbs: number | null;
  
  // Capacities
  fuel_capacity_gal: number | null;
  water_capacity_gal: number | null;
  holding_capacity_gal: number | null;
  livewell_capacity_gal: number | null;
  
  // Performance
  cruise_speed_knots: number | null;
  max_speed_knots: number | null;
  hull_type: string | null;
  
  // Electrical
  battery_type: string | null;
  battery_count: number | null;
  battery_locations: string | null;
  shore_power: string | null;
  
  // Engine
  max_hp: number | null;
  engine_options: string[] | null;
}

export interface BoatSpecRecord extends BoatSpecData {
  id: string;
  boat_id: string;
  is_custom_override: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useBoatSpecs(boatId: string | null, boatMake?: string | null, boatModel?: string | null) {
  const [boatSpecs, setBoatSpecs] = useState<BoatSpecRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Get master specs from vessel_specs table
  const { specs: masterSpecs, loading: masterLoading } = useVesselSpecs(boatMake, boatModel);

  // Fetch owner's custom boat specs
  const fetchBoatSpecs = useCallback(async () => {
    if (!boatId) {
      setBoatSpecs(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("boat_specs")
      .select("*")
      .eq("boat_id", boatId)
      .maybeSingle();

    if (!error && data) {
      setBoatSpecs(data as BoatSpecRecord);
    } else {
      setBoatSpecs(null);
    }
    setLoading(false);
  }, [boatId]);

  useEffect(() => {
    fetchBoatSpecs();
  }, [fetchBoatSpecs]);

  // Merge master specs with custom overrides
  const getMergedSpecs = useCallback((): BoatSpecData => {
    const base: BoatSpecData = {
      loa_ft: masterSpecs?.length_ft ?? null,
      beam_ft: masterSpecs?.beam_ft ?? null,
      draft_engines_up_ft: masterSpecs?.draft_engines_up_ft ?? masterSpecs?.draft_ft ?? null,
      draft_engines_down_ft: masterSpecs?.draft_engines_down_ft ?? null,
      bridge_clearance_ft: masterSpecs?.bridge_clearance_ft ?? null,
      dry_weight_lbs: masterSpecs?.dry_weight_lbs ?? null,
      fuel_capacity_gal: masterSpecs?.fuel_capacity_gal ?? null,
      water_capacity_gal: masterSpecs?.water_capacity_gal ?? null,
      holding_capacity_gal: masterSpecs?.holding_capacity_gal ?? null,
      livewell_capacity_gal: masterSpecs?.livewell_capacity_gal ?? null,
      cruise_speed_knots: masterSpecs?.cruise_speed_knots ?? null,
      max_speed_knots: masterSpecs?.max_speed_knots ?? null,
      hull_type: masterSpecs?.hull_type ?? null,
      battery_type: masterSpecs?.battery_type ?? null,
      battery_count: masterSpecs?.battery_count ?? null,
      battery_locations: masterSpecs?.battery_locations ?? null,
      shore_power: masterSpecs?.shore_power ?? null,
      max_hp: masterSpecs?.max_hp ?? null,
      engine_options: masterSpecs?.engine_options ?? null,
    };

    // If custom boat specs exist, merge them (custom takes precedence)
    if (boatSpecs) {
      return {
        loa_ft: boatSpecs.loa_ft ?? base.loa_ft,
        beam_ft: boatSpecs.beam_ft ?? base.beam_ft,
        draft_engines_up_ft: boatSpecs.draft_engines_up_ft ?? base.draft_engines_up_ft,
        draft_engines_down_ft: boatSpecs.draft_engines_down_ft ?? base.draft_engines_down_ft,
        bridge_clearance_ft: boatSpecs.bridge_clearance_ft ?? base.bridge_clearance_ft,
        dry_weight_lbs: boatSpecs.dry_weight_lbs ?? base.dry_weight_lbs,
        fuel_capacity_gal: boatSpecs.fuel_capacity_gal ?? base.fuel_capacity_gal,
        water_capacity_gal: boatSpecs.water_capacity_gal ?? base.water_capacity_gal,
        holding_capacity_gal: boatSpecs.holding_capacity_gal ?? base.holding_capacity_gal,
        livewell_capacity_gal: boatSpecs.livewell_capacity_gal ?? base.livewell_capacity_gal,
        cruise_speed_knots: boatSpecs.cruise_speed_knots ?? base.cruise_speed_knots,
        max_speed_knots: boatSpecs.max_speed_knots ?? base.max_speed_knots,
        hull_type: boatSpecs.hull_type ?? base.hull_type,
        battery_type: boatSpecs.battery_type ?? base.battery_type,
        battery_count: boatSpecs.battery_count ?? base.battery_count,
        battery_locations: boatSpecs.battery_locations ?? base.battery_locations,
        shore_power: boatSpecs.shore_power ?? base.shore_power,
        max_hp: boatSpecs.max_hp ?? base.max_hp,
        engine_options: boatSpecs.engine_options ?? base.engine_options,
      };
    }

    return base;
  }, [masterSpecs, boatSpecs]);

  // Auto-populate from master specs
  const autoPopulateFromMaster = async () => {
    if (!boatId || !masterSpecs) return false;

    setSaving(true);
    const specsToInsert = {
      boat_id: boatId,
      loa_ft: masterSpecs.length_ft,
      beam_ft: masterSpecs.beam_ft,
      draft_engines_up_ft: masterSpecs.draft_engines_up_ft ?? masterSpecs.draft_ft,
      draft_engines_down_ft: masterSpecs.draft_engines_down_ft,
      bridge_clearance_ft: masterSpecs.bridge_clearance_ft,
      dry_weight_lbs: masterSpecs.dry_weight_lbs,
      fuel_capacity_gal: masterSpecs.fuel_capacity_gal,
      water_capacity_gal: masterSpecs.water_capacity_gal,
      holding_capacity_gal: masterSpecs.holding_capacity_gal,
      livewell_capacity_gal: masterSpecs.livewell_capacity_gal,
      cruise_speed_knots: masterSpecs.cruise_speed_knots,
      max_speed_knots: masterSpecs.max_speed_knots,
      hull_type: masterSpecs.hull_type,
      battery_type: masterSpecs.battery_type,
      battery_count: masterSpecs.battery_count,
      battery_locations: masterSpecs.battery_locations,
      shore_power: masterSpecs.shore_power,
      max_hp: masterSpecs.max_hp,
      engine_options: masterSpecs.engine_options,
      is_custom_override: false,
    };

    const { error } = await supabase
      .from("boat_specs")
      .upsert(specsToInsert, { onConflict: "boat_id" });

    setSaving(false);
    if (!error) {
      await fetchBoatSpecs();
      return true;
    }
    return false;
  };

  // Save custom specs
  const saveSpecs = async (specs: Partial<BoatSpecData>) => {
    if (!boatId) return false;

    setSaving(true);
    const dataToSave = {
      boat_id: boatId,
      ...specs,
      is_custom_override: true,
    };

    const { error } = await supabase
      .from("boat_specs")
      .upsert(dataToSave, { onConflict: "boat_id" });

    setSaving(false);
    if (!error) {
      await fetchBoatSpecs();
      return true;
    }
    return false;
  };

  return {
    boatSpecs,
    masterSpecs,
    mergedSpecs: getMergedSpecs(),
    loading: loading || masterLoading,
    saving,
    hasCustomSpecs: !!boatSpecs,
    hasMasterSpecs: !!masterSpecs,
    autoPopulateFromMaster,
    saveSpecs,
    refetch: fetchBoatSpecs,
  };
}
