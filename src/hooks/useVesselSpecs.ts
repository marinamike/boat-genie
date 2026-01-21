import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VesselSpec {
  id: string;
  make: string;
  model: string;
  year_start: number | null;
  year_end: number | null;
  length_ft: number | null;
  beam_ft: number | null;
  draft_ft: number | null;
  bridge_clearance_ft: number | null;
  dry_weight_lbs: number | null;
  fuel_capacity_gal: number | null;
  water_capacity_gal: number | null;
  holding_capacity_gal: number | null;
  battery_type: string | null;
  battery_count: number | null;
  battery_locations: string | null;
  shore_power: string | null;
  max_hp: number | null;
  engine_options: string[] | null;
}

export interface WarrantyDefault {
  id: string;
  brand: string;
  product_type: string;
  warranty_name: string;
  warranty_months: number;
  warranty_description: string | null;
  warranty_pdf_url: string | null;
}

export interface BoatWarranty {
  id: string;
  boat_id: string;
  boat_equipment_id: string | null;
  warranty_type: string;
  warranty_name: string;
  start_date: string;
  end_date: string;
  is_manual_override: boolean;
  document_url: string | null;
  notes: string | null;
  warranty_default_id: string | null;
}

export function useVesselSpecs(boatMake?: string | null, boatModel?: string | null) {
  const [specs, setSpecs] = useState<VesselSpec | null>(null);
  const [allSpecs, setAllSpecs] = useState<VesselSpec[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllSpecs();
  }, []);

  useEffect(() => {
    if (boatMake && boatModel) {
      fetchSpecsForBoat(boatMake, boatModel);
    } else {
      setSpecs(null);
    }
  }, [boatMake, boatModel]);

  async function fetchAllSpecs() {
    const { data, error } = await supabase
      .from("vessel_specs")
      .select("*")
      .order("make", { ascending: true });

    if (!error && data) {
      setAllSpecs(data as VesselSpec[]);
    }
  }

  async function fetchSpecsForBoat(make: string, model: string) {
    setLoading(true);
    
    // Try exact match first
    let { data, error } = await supabase
      .from("vessel_specs")
      .select("*")
      .ilike("make", make)
      .ilike("model", model)
      .maybeSingle();

    if (!error && data) {
      setSpecs(data as VesselSpec);
    } else {
      // Try partial match on model
      const { data: partialData } = await supabase
        .from("vessel_specs")
        .select("*")
        .ilike("make", `%${make}%`)
        .ilike("model", `%${model}%`)
        .maybeSingle();

      if (partialData) {
        setSpecs(partialData as VesselSpec);
      } else {
        setSpecs(null);
      }
    }
    
    setLoading(false);
  }

  return { specs, allSpecs, loading, refetch: fetchAllSpecs };
}

export function useWarrantyDefaults() {
  const [defaults, setDefaults] = useState<WarrantyDefault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDefaults();
  }, []);

  async function fetchDefaults() {
    setLoading(true);
    const { data, error } = await supabase
      .from("warranty_defaults")
      .select("*")
      .order("brand", { ascending: true });

    if (!error && data) {
      setDefaults(data as WarrantyDefault[]);
    }
    setLoading(false);
  }

  function getWarrantyForBrand(brand: string, productType: string): WarrantyDefault | null {
    // Try exact match
    const exact = defaults.find(
      (d) => d.brand.toLowerCase() === brand.toLowerCase() && d.product_type === productType
    );
    if (exact) return exact;

    // Try partial match
    return defaults.find(
      (d) => brand.toLowerCase().includes(d.brand.toLowerCase()) && d.product_type === productType
    ) || null;
  }

  return { defaults, loading, getWarrantyForBrand };
}

export function useBoatWarranties(boatId: string | null) {
  const [warranties, setWarranties] = useState<BoatWarranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (boatId) {
      fetchWarranties();
    } else {
      setWarranties([]);
      setLoading(false);
    }
  }, [boatId]);

  async function fetchWarranties() {
    if (!boatId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("boat_warranties")
      .select("*")
      .eq("boat_id", boatId)
      .order("end_date", { ascending: true });

    if (!error && data) {
      setWarranties(data as BoatWarranty[]);
    }
    setLoading(false);
  }

  async function createWarranty(warranty: Omit<BoatWarranty, "id">) {
    const { data, error } = await supabase
      .from("boat_warranties")
      .insert(warranty)
      .select()
      .single();

    if (error) throw error;
    await fetchWarranties();
    return data;
  }

  async function updateWarranty(id: string, updates: Partial<BoatWarranty>) {
    const { error } = await supabase
      .from("boat_warranties")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    await fetchWarranties();
  }

  async function deleteWarranty(id: string) {
    const { error } = await supabase
      .from("boat_warranties")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchWarranties();
  }

  return {
    warranties,
    loading,
    createWarranty,
    updateWarranty,
    deleteWarranty,
    refetch: fetchWarranties,
  };
}
