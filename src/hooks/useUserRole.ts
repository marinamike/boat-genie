import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "boat_owner" | "provider" | "admin";

interface Marina {
  id: string;
  marina_name: string;
  address: string | null;
  total_slips: number;
  staging_dock_linear_footage: number;
  amenities: string[];
}

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [marina, setMarina] = useState<Marina | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role as AppRole);
      } else {
        setRole("boat_owner"); // Default role
      }

      // Fetch marina if admin (marina manager)
      if (roleData?.role === "admin") {
        const { data: marinaData } = await supabase
          .from("marinas")
          .select("*")
          .eq("manager_id", session.user.id)
          .maybeSingle();

        if (marinaData) {
          setMarina(marinaData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const updateRole = async (newRole: AppRole) => {
    if (!userId) return false;

    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      setRole(newRole);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
      return false;
    }
  };

  const registerMarina = async (marinaData: {
    marina_name: string;
    address: string;
    total_slips: number;
    staging_dock_linear_footage: number;
    amenities: string[];
  }) => {
    if (!userId) return false;

    try {
      // First update role to admin
      await updateRole("admin");

      // Insert marina
      const { data, error } = await supabase
        .from("marinas")
        .insert({
          manager_id: userId,
          ...marinaData,
        })
        .select()
        .single();

      if (error) throw error;

      // Create marina_settings with the enabled modules
      const enabledModules = marinaData.amenities.filter((a) =>
        ["dry_stack", "ship_store", "fuel_dock", "service_yard"].includes(a)
      ) as ("dry_stack" | "ship_store" | "fuel_dock" | "service_yard")[];

      const { error: settingsError } = await supabase
        .from("marina_settings")
        .insert({
          marina_name: marinaData.marina_name,
          staging_dock_capacity_ft: marinaData.staging_dock_linear_footage,
          enabled_modules: enabledModules,
        });

      if (settingsError) throw settingsError;

      setMarina(data);
      toast({
        title: "Marina Registered",
        description: `${marinaData.marina_name} has been set up successfully!`,
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register marina",
        variant: "destructive",
      });
      return false;
    }
  };

  const isAdmin = role === "admin";
  const isProvider = role === "provider";
  const isBoatOwner = role === "boat_owner";
  const hasMarina = !!marina;

  return {
    role,
    marina,
    loading,
    userId,
    isAdmin,
    isProvider,
    isBoatOwner,
    hasMarina,
    updateRole,
    registerMarina,
    refetch: fetchUserData,
  };
}
