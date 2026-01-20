import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LaunchCardData {
  visual_inspection_passed: boolean;
  engine_flush_confirmed: boolean;
  battery_off_confirmed: boolean;
  damage_notes?: string;
  fuel_level?: string;
  additional_notes?: string;
}

interface LaunchCard {
  id: string;
  launch_queue_id: string;
  boat_id: string;
  operator_id: string;
  operation_type: string;
  visual_inspection_passed: boolean;
  engine_flush_confirmed: boolean;
  battery_off_confirmed: boolean;
  damage_notes: string | null;
  fuel_level: string | null;
  additional_notes: string | null;
  inspection_started_at: string;
  inspection_completed_at: string | null;
  boat_log_id: string | null;
  created_at: string;
  operator?: {
    full_name: string | null;
    email: string | null;
  };
}

export function useLaunchCard() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitLaunchCard = async (
    launchQueueId: string,
    boatId: string,
    operationType: "launch" | "haul_out",
    data: LaunchCardData
  ): Promise<LaunchCard | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get operator profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Create boat log entry first
      const logTitle = operationType === "haul_out" 
        ? "Haul-Out Completed" 
        : "Launch Completed";
      
      const logDescription = [
        `Operation: ${operationType === "haul_out" ? "Haul-Out" : "Launch"}`,
        `Visual Inspection: ${data.visual_inspection_passed ? "Passed" : "Not Completed"}`,
        `Engine Flush: ${data.engine_flush_confirmed ? "Confirmed" : "Not Confirmed"}`,
        `Battery Off: ${data.battery_off_confirmed ? "Confirmed" : "Not Confirmed"}`,
        data.damage_notes ? `Damage Notes: ${data.damage_notes}` : null,
        data.fuel_level ? `Fuel Level: ${data.fuel_level}` : null,
        data.additional_notes ? `Notes: ${data.additional_notes}` : null,
        `Operator: ${profile?.full_name || user.email}`,
      ].filter(Boolean).join("\n");

      const { data: boatLog, error: logError } = await supabase
        .from("boat_logs")
        .insert({
          boat_id: boatId,
          title: logTitle,
          description: logDescription,
          log_type: "service",
          created_by: user.id,
        })
        .select()
        .single();

      if (logError) throw logError;

      // Create launch card
      const { data: launchCard, error: cardError } = await supabase
        .from("launch_cards")
        .insert({
          launch_queue_id: launchQueueId,
          boat_id: boatId,
          operator_id: user.id,
          operation_type: operationType,
          visual_inspection_passed: data.visual_inspection_passed,
          engine_flush_confirmed: data.engine_flush_confirmed,
          battery_off_confirmed: data.battery_off_confirmed,
          damage_notes: data.damage_notes || null,
          fuel_level: data.fuel_level || null,
          additional_notes: data.additional_notes || null,
          inspection_completed_at: new Date().toISOString(),
          boat_log_id: boatLog.id,
        })
        .select()
        .single();

      if (cardError) throw cardError;

      // Update queue status
      await supabase
        .from("launch_queue")
        .update({ 
          status: operationType === "haul_out" ? "re_racked" : "splashed",
          hauled_at: operationType === "haul_out" ? new Date().toISOString() : null,
        })
        .eq("id", launchQueueId);

      toast({
        title: "Launch card submitted",
        description: "Boat log updated automatically",
      });

      return launchCard as LaunchCard;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not submit launch card";
      toast({ title: "Error", description: message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLaunchCards = async (boatId: string): Promise<LaunchCard[]> => {
    const { data, error } = await supabase
      .from("launch_cards")
      .select(`
        *,
        operator:operator_id (
          full_name,
          email
        )
      `)
      .eq("boat_id", boatId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching launch cards:", error);
      return [];
    }

    return data as unknown as LaunchCard[];
  };

  return {
    loading,
    submitLaunchCard,
    getLaunchCards,
  };
}

export type { LaunchCard, LaunchCardData };
