import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Three-profile architecture: Customer (boat_owner), Business (admin), Staff (marina_staff)
export type AppRole = "boat_owner" | "provider" | "admin" | "marina_staff";

interface Business {
  id: string;
  business_name: string;
  marina_name: string; // Alias for backward compatibility
  address: string | null;
  total_slips: number | null;
  staging_dock_linear_footage: number | null;
  enabled_modules: string[];
}

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUserId(null);
        setRole(null);
        setBusiness(null);
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

      // Fetch business if admin (business manager) - using unified businesses table
      if (roleData?.role === "admin") {
        const { data: businessData } = await supabase
          .from("businesses")
          .select("id, business_name, address, total_slips, staging_dock_linear_footage, enabled_modules")
          .eq("owner_id", session.user.id)
          .maybeSingle();

        if (businessData) {
          setBusiness({
            ...businessData,
            marina_name: businessData.business_name, // Alias for backward compatibility
            enabled_modules: businessData.enabled_modules || [],
          });
        } else {
          setBusiness(null);
        }
      } else {
        setBusiness(null);
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

  useEffect(() => {
    const onRoleChanged = () => fetchUserData();
    window.addEventListener("app:role-changed", onRoleChanged);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });

    return () => {
      window.removeEventListener("app:role-changed", onRoleChanged);
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const updateRole = async (newRole: AppRole) => {
    if (!userId) return false;

    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
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

  const registerBusiness = async (businessData: {
    business_name: string;
    address: string;
    total_slips: number;
    staging_dock_linear_footage: number;
    enabled_modules: string[];
  }) => {
    if (!userId) return false;

    try {
      // First update role to admin
      await updateRole("admin");

      // Insert business into unified businesses table
      const insertData = {
        owner_id: userId,
        business_name: businessData.business_name,
        address: businessData.address,
        total_slips: businessData.total_slips,
        staging_dock_linear_footage: businessData.staging_dock_linear_footage,
        enabled_modules: businessData.enabled_modules as any,
      };
      
      const { data, error } = await supabase
        .from("businesses")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setBusiness({
        id: data.id,
        business_name: data.business_name,
        marina_name: data.business_name, // Alias for backward compatibility
        address: data.address,
        total_slips: data.total_slips,
        staging_dock_linear_footage: data.staging_dock_linear_footage,
        enabled_modules: data.enabled_modules || [],
      });

      toast({
        title: "Business Registered",
        description: `${businessData.business_name} has been set up successfully!`,
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register business",
        variant: "destructive",
      });
      return false;
    }
  };

  // Legacy adapter for marina_name -> business_name
  const registerMarina = async (marinaData: {
    marina_name: string;
    address: string;
    total_slips: number;
    staging_dock_linear_footage: number;
    amenities: string[];
  }) => {
    return registerBusiness({
      business_name: marinaData.marina_name,
      address: marinaData.address,
      total_slips: marinaData.total_slips,
      staging_dock_linear_footage: marinaData.staging_dock_linear_footage,
      enabled_modules: marinaData.amenities.filter((a) =>
        ["dry_stack", "ship_store", "fuel_dock", "service_yard", "slips_storage", "service_dept", "fuel_management"].includes(a)
      ),
    });
  };

  const isAdmin = role === "admin";
  const isBoatOwner = role === "boat_owner";
  const isMarinaStaff = role === "marina_staff";
  const hasBusiness = !!business;

  // Legacy compatibility
  const marina = business;
  const hasMarina = hasBusiness;

  return {
    role,
    marina,
    business,
    loading,
    userId,
    isAdmin,
    isBoatOwner,
    isMarinaStaff,
    hasMarina,
    hasBusiness,
    updateRole,
    registerMarina,
    registerBusiness,
    refetch: fetchUserData,
  };
}
