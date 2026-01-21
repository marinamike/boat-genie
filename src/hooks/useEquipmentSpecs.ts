import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EquipmentSpec {
  id: string;
  equipment_type: "engine" | "generator" | "seakeeper";
  brand: string;
  model: string;
  manual_url: string | null;
  service_interval_hours: number | null;
  service_interval_months: number | null;
  service_description: string | null;
}

export interface MaintenanceRecommendation {
  id: string;
  boat_id: string;
  equipment_spec_id: string | null;
  equipment_type: string;
  title: string;
  description: string | null;
  due_at_hours: number | null;
  due_at_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  converted_to_wish_id: string | null;
  created_at: string;
}

export function useEquipmentSpecs() {
  const [specs, setSpecs] = useState<EquipmentSpec[]>([]);
  const [loading, setLoading] = useState(true);

  // Get unique brands for each equipment type
  const getEngineBrands = useCallback(() => {
    return [...new Set(specs.filter((s) => s.equipment_type === "engine").map((s) => s.brand))];
  }, [specs]);

  const getGeneratorBrands = useCallback(() => {
    return [...new Set(specs.filter((s) => s.equipment_type === "generator").map((s) => s.brand))];
  }, [specs]);

  const getSeakeeperModels = useCallback(() => {
    return specs.filter((s) => s.equipment_type === "seakeeper").map((s) => s.model);
  }, [specs]);

  // Get models for a specific brand
  const getModelsForBrand = useCallback(
    (equipmentType: string, brand: string) => {
      return specs
        .filter((s) => s.equipment_type === equipmentType && s.brand === brand)
        .map((s) => s.model);
    },
    [specs]
  );

  // Find a spec by type, brand, and model
  const findSpec = useCallback(
    (equipmentType: string, brand: string, model: string): EquipmentSpec | null => {
      return (
        specs.find(
          (s) =>
            s.equipment_type === equipmentType &&
            s.brand.toLowerCase() === brand.toLowerCase() &&
            s.model.toLowerCase() === model.toLowerCase()
        ) || null
      );
    },
    [specs]
  );

  const fetchSpecs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("master_equipment_specs")
        .select("*")
        .order("brand", { ascending: true })
        .order("model", { ascending: true });

      if (error) throw error;
      setSpecs((data as EquipmentSpec[]) || []);
    } catch (error) {
      console.error("Error fetching equipment specs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  return {
    specs,
    loading,
    getEngineBrands,
    getGeneratorBrands,
    getSeakeeperModels,
    getModelsForBrand,
    findSpec,
  };
}

export function useMaintenanceRecommendations(boatId: string | null) {
  const [recommendations, setRecommendations] = useState<MaintenanceRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!boatId) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("maintenance_recommendations")
        .select("*")
        .eq("boat_id", boatId)
        .eq("is_completed", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRecommendations((data as MaintenanceRecommendation[]) || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, [boatId]);

  const markCompleted = async (recommendationId: string) => {
    try {
      const { error } = await supabase
        .from("maintenance_recommendations")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", recommendationId);

      if (error) throw error;
      setRecommendations((prev) => prev.filter((r) => r.id !== recommendationId));
    } catch (error) {
      console.error("Error marking recommendation complete:", error);
    }
  };

  const convertToWish = async (recommendationId: string, wishId: string) => {
    try {
      const { error } = await supabase
        .from("maintenance_recommendations")
        .update({
          converted_to_wish_id: wishId,
        })
        .eq("id", recommendationId);

      if (error) throw error;
      setRecommendations((prev) => prev.filter((r) => r.id !== recommendationId));
    } catch (error) {
      console.error("Error converting to wish:", error);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    markCompleted,
    convertToWish,
    refetch: fetchRecommendations,
  };
}

// Helper to create maintenance recommendations when equipment is added
export async function createMaintenanceRecommendations(
  boatId: string,
  spec: EquipmentSpec,
  currentHours: number
) {
  const nextServiceHours = spec.service_interval_hours
    ? Math.ceil(currentHours / spec.service_interval_hours) * spec.service_interval_hours
    : null;

  const nextServiceDate = spec.service_interval_months
    ? new Date(Date.now() + spec.service_interval_months * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    : null;

  // Check if a similar recommendation already exists
  const { data: existing } = await supabase
    .from("maintenance_recommendations")
    .select("id")
    .eq("boat_id", boatId)
    .eq("equipment_spec_id", spec.id)
    .eq("is_completed", false)
    .maybeSingle();

  if (existing) {
    // Already have a pending recommendation for this equipment
    return;
  }

  const title = `${spec.service_interval_hours || spec.service_interval_months}-${
    spec.service_interval_hours ? "Hour" : "Month"
  } ${spec.brand} ${spec.model} Service`;

  const { error } = await supabase.from("maintenance_recommendations").insert({
    boat_id: boatId,
    equipment_spec_id: spec.id,
    equipment_type: spec.equipment_type,
    title,
    description: spec.service_description,
    due_at_hours: nextServiceHours,
    due_at_date: nextServiceDate,
  });

  if (error) {
    console.error("Error creating maintenance recommendation:", error);
  }
}

// Helper to auto-add manual to digital locker
export async function addManualToDigitalLocker(
  boatId: string,
  ownerId: string,
  spec: EquipmentSpec
) {
  if (!spec.manual_url) return;

  // Check if manual already exists
  const { data: existing } = await supabase
    .from("vessel_documents")
    .select("id")
    .eq("boat_id", boatId)
    .eq("category", "manuals")
    .ilike("title", `%${spec.brand} ${spec.model}%`)
    .maybeSingle();

  if (existing) {
    return; // Already have this manual
  }

  const { error } = await supabase.from("vessel_documents").insert({
    boat_id: boatId,
    owner_id: ownerId,
    category: "manuals",
    title: `${spec.brand} ${spec.model} ${spec.equipment_type === "engine" ? "Engine" : spec.equipment_type === "generator" ? "Generator" : "Seakeeper"} Manual`,
    description: `Official manufacturer manual for your ${spec.brand} ${spec.model}`,
    file_url: spec.manual_url,
    file_type: "link",
    metadata: {
      equipment_type: spec.equipment_type,
      brand: spec.brand,
      model: spec.model,
      is_external_link: true,
    },
  });

  if (error) {
    console.error("Error adding manual to digital locker:", error);
  }
}
