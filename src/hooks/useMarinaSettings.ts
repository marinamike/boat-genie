import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type MarinaModule = "dry_stack" | "ship_store" | "fuel_dock" | "service_yard";

interface MarinaSettings {
  id: string;
  marina_name: string;
  enabled_modules: MarinaModule[];
  staging_dock_capacity_ft: number;
  capacity_alert_threshold: number;
}

interface MarinaSlip {
  id: string;
  slip_number: string;
  slip_type: string;
  max_length_ft: number;
  is_occupied: boolean;
  current_boat_id: string | null;
  current_boat_length_ft: number | null;
  notes: string | null;
  position_order: number;
  boat?: {
    id: string;
    name: string;
    length_ft: number | null;
    owner_id: string;
  } | null;
}

export function useMarinaSettings() {
  const [settings, setSettings] = useState<MarinaSettings | null>(null);
  const [slips, setSlips] = useState<MarinaSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("marina_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching marina settings:", error);
    } else if (data) {
      setSettings(data as unknown as MarinaSettings);
    }
  }, []);

  const fetchSlips = useCallback(async () => {
    const { data, error } = await supabase
      .from("marina_slips")
      .select(`
        *,
        boat:current_boat_id (
          id,
          name,
          length_ft,
          owner_id
        )
      `)
      .order("position_order", { ascending: true });

    if (error) {
      console.error("Error fetching slips:", error);
    } else {
      setSlips(data as unknown as MarinaSlip[]);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchSlips()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSettings, fetchSlips]);

  const toggleModule = async (module: MarinaModule) => {
    if (!settings) return;

    const currentModules = settings.enabled_modules || [];
    const newModules = currentModules.includes(module)
      ? currentModules.filter((m) => m !== module)
      : [...currentModules, module];

    const { error } = await supabase
      .from("marina_settings")
      .update({ enabled_modules: newModules })
      .eq("id", settings.id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update modules",
        variant: "destructive",
      });
    } else {
      setSettings({ ...settings, enabled_modules: newModules as MarinaModule[] });
      toast({
        title: "Module updated",
        description: `${module.replace("_", " ")} ${newModules.includes(module) ? "enabled" : "disabled"}`,
      });
    }
  };

  const updateCapacity = async (capacityFt: number) => {
    if (!settings) return;

    const { error } = await supabase
      .from("marina_settings")
      .update({ staging_dock_capacity_ft: capacityFt })
      .eq("id", settings.id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update capacity",
        variant: "destructive",
      });
    } else {
      setSettings({ ...settings, staging_dock_capacity_ft: capacityFt });
    }
  };

  const moveBoatToSlip = async (boatId: string, boatLengthFt: number, targetSlipId: string, sourceSlipId?: string) => {
    // Clear source slip if exists
    if (sourceSlipId) {
      await supabase
        .from("marina_slips")
        .update({
          is_occupied: false,
          current_boat_id: null,
          current_boat_length_ft: null,
        })
        .eq("id", sourceSlipId);
    }

    // Update target slip
    const { error } = await supabase
      .from("marina_slips")
      .update({
        is_occupied: true,
        current_boat_id: boatId,
        current_boat_length_ft: boatLengthFt,
      })
      .eq("id", targetSlipId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not move boat",
        variant: "destructive",
      });
      return false;
    }

    await fetchSlips();
    toast({
      title: "Boat moved",
      description: "Slip assignment updated",
    });
    return true;
  };

  const removeBoatFromSlip = async (slipId: string) => {
    const { error } = await supabase
      .from("marina_slips")
      .update({
        is_occupied: false,
        current_boat_id: null,
        current_boat_length_ft: null,
      })
      .eq("id", slipId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not remove boat",
        variant: "destructive",
      });
      return false;
    }

    await fetchSlips();
    return true;
  };

  const isModuleEnabled = (module: MarinaModule): boolean => {
    return settings?.enabled_modules?.includes(module) ?? false;
  };

  // Calculate staging capacity usage
  const stagingSlips = slips.filter((s) => s.slip_type === "staging");
  const totalStagingFootage = stagingSlips.reduce(
    (sum, s) => sum + (s.current_boat_length_ft || 0),
    0
  );
  const capacityPercentage = settings
    ? (totalStagingFootage / settings.staging_dock_capacity_ft) * 100
    : 0;
  const isOverCapacity = capacityPercentage >= (settings?.capacity_alert_threshold || 0.9) * 100;

  return {
    settings,
    slips,
    loading,
    toggleModule,
    updateCapacity,
    moveBoatToSlip,
    removeBoatFromSlip,
    isModuleEnabled,
    refetch: () => Promise.all([fetchSettings(), fetchSlips()]),
    stagingStats: {
      totalStagingFootage,
      capacityFt: settings?.staging_dock_capacity_ft || 0,
      capacityPercentage,
      isOverCapacity,
      stagingSlips,
    },
  };
}

export type { MarinaSettings, MarinaSlip, MarinaModule };
