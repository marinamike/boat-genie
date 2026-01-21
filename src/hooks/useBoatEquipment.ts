import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEquipmentSpecs, EquipmentSpec, createMaintenanceRecommendations, addManualToDigitalLocker } from "./useEquipmentSpecs";

export interface BoatEquipment {
  id: string;
  boat_id: string;
  equipment_type: "engine" | "generator" | "seakeeper";
  brand: string;
  model: string;
  serial_number: string | null;
  current_hours: number;
  position_label: string | null;
  position_order: number;
  equipment_spec_id: string | null;
  manual_url: string | null;
  created_at: string;
  updated_at: string;
}

export type NewEquipment = Omit<BoatEquipment, "id" | "created_at" | "updated_at">;

const ENGINE_POSITION_LABELS = ["Center Engine", "Port Engine", "Starboard Engine", "Port Outboard", "Starboard Outboard"];
const GENERATOR_POSITION_LABELS = ["Primary Generator", "Secondary Generator", "Backup Generator"];
const SEAKEEPER_POSITION_LABELS = ["Primary Seakeeper", "Secondary Seakeeper"];

export function getPositionLabel(type: "engine" | "generator" | "seakeeper", index: number): string {
  const labels = type === "engine" 
    ? ENGINE_POSITION_LABELS 
    : type === "generator" 
      ? GENERATOR_POSITION_LABELS 
      : SEAKEEPER_POSITION_LABELS;
  
  return labels[index] || `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`;
}

export function useBoatEquipment(boatId: string | null) {
  const [equipment, setEquipment] = useState<BoatEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const { findSpec } = useEquipmentSpecs();

  const fetchEquipment = useCallback(async () => {
    if (!boatId) {
      setEquipment([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("boat_equipment")
        .select("*")
        .eq("boat_id", boatId)
        .order("equipment_type")
        .order("position_order");

      if (error) throw error;
      setEquipment((data as BoatEquipment[]) || []);
    } catch (error) {
      console.error("Error fetching boat equipment:", error);
    } finally {
      setLoading(false);
    }
  }, [boatId]);

  const addEquipment = async (newEquipment: Omit<NewEquipment, "boat_id" | "position_order" | "position_label">, ownerId: string) => {
    if (!boatId) return null;

    // Get current count of this equipment type to determine position
    const existingOfType = equipment.filter(e => e.equipment_type === newEquipment.equipment_type);
    const positionOrder = existingOfType.length + 1;
    const positionLabel = getPositionLabel(newEquipment.equipment_type, existingOfType.length);

    // Find matching spec
    const spec = findSpec(newEquipment.equipment_type, newEquipment.brand, newEquipment.model);

    const equipmentData = {
      boat_id: boatId,
      ...newEquipment,
      position_order: positionOrder,
      position_label: positionLabel,
      equipment_spec_id: spec?.id || null,
      manual_url: spec?.manual_url || null,
    };

    try {
      const { data, error } = await supabase
        .from("boat_equipment")
        .insert(equipmentData)
        .select()
        .single();

      if (error) throw error;

      // Auto-add manual and create maintenance recommendations if spec found
      if (spec) {
        await addManualToDigitalLocker(boatId, ownerId, spec);
        await createMaintenanceRecommendationsForEquipment(boatId, data.id, spec, newEquipment.current_hours);
      }

      setEquipment(prev => [...prev, data as BoatEquipment]);
      return data as BoatEquipment;
    } catch (error) {
      console.error("Error adding equipment:", error);
      throw error;
    }
  };

  const updateEquipment = async (equipmentId: string, updates: Partial<NewEquipment>) => {
    try {
      // If brand or model changed, check for new spec match
      let specUpdates: { equipment_spec_id?: string | null; manual_url?: string | null } = {};
      
      if (updates.brand || updates.model) {
        const current = equipment.find(e => e.id === equipmentId);
        if (current) {
          const newBrand = updates.brand || current.brand;
          const newModel = updates.model || current.model;
          const spec = findSpec(current.equipment_type, newBrand, newModel);
          specUpdates = {
            equipment_spec_id: spec?.id || null,
            manual_url: spec?.manual_url || null,
          };
        }
      }

      const { data, error } = await supabase
        .from("boat_equipment")
        .update({ ...updates, ...specUpdates })
        .eq("id", equipmentId)
        .select()
        .single();

      if (error) throw error;

      setEquipment(prev => prev.map(e => e.id === equipmentId ? (data as BoatEquipment) : e));
      return data as BoatEquipment;
    } catch (error) {
      console.error("Error updating equipment:", error);
      throw error;
    }
  };

  const deleteEquipment = async (equipmentId: string) => {
    try {
      const toDelete = equipment.find(e => e.id === equipmentId);
      
      const { error } = await supabase
        .from("boat_equipment")
        .delete()
        .eq("id", equipmentId);

      if (error) throw error;

      // Reorder remaining equipment of same type
      if (toDelete) {
        const sameType = equipment
          .filter(e => e.equipment_type === toDelete.equipment_type && e.id !== equipmentId)
          .sort((a, b) => a.position_order - b.position_order);
        
        for (let i = 0; i < sameType.length; i++) {
          const newLabel = getPositionLabel(toDelete.equipment_type, i);
          await supabase
            .from("boat_equipment")
            .update({ position_order: i + 1, position_label: newLabel })
            .eq("id", sameType[i].id);
        }
      }

      setEquipment(prev => prev.filter(e => e.id !== equipmentId));
    } catch (error) {
      console.error("Error deleting equipment:", error);
      throw error;
    }
  };

  const getEquipmentByType = (type: "engine" | "generator" | "seakeeper") => {
    return equipment.filter(e => e.equipment_type === type).sort((a, b) => a.position_order - b.position_order);
  };

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  return {
    equipment,
    loading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipmentByType,
    refetch: fetchEquipment,
    engines: getEquipmentByType("engine"),
    generators: getEquipmentByType("generator"),
    seakeepers: getEquipmentByType("seakeeper"),
  };
}

// Helper to create maintenance recommendations linked to specific equipment
async function createMaintenanceRecommendationsForEquipment(
  boatId: string,
  equipmentId: string,
  spec: EquipmentSpec,
  currentHours: number
) {
  const nextServiceHours = spec.service_interval_hours
    ? Math.ceil((currentHours + 1) / spec.service_interval_hours) * spec.service_interval_hours
    : null;

  const nextServiceDate = spec.service_interval_months
    ? new Date(Date.now() + spec.service_interval_months * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    : null;

  const title = `${spec.service_interval_hours || spec.service_interval_months}-${
    spec.service_interval_hours ? "Hour" : "Month"
  } ${spec.brand} ${spec.model} Service`;

  const { error } = await supabase.from("maintenance_recommendations").insert({
    boat_id: boatId,
    boat_equipment_id: equipmentId,
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
