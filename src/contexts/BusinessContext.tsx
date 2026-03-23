import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type BusinessModule = Database["public"]["Enums"]["business_module"];

interface StaffPermissions {
  [module: string]: {
    read?: boolean;
    write?: boolean;
  };
}

interface Business {
  id: string;
  owner_id: string;
  business_name: string;
  enabled_modules: BusinessModule[];
  is_verified: boolean;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  power_rate_per_kwh?: number | null;
  water_rate_per_gallon?: number | null;
  default_daily_rate_per_ft?: number | null;
  default_weekly_rate_per_ft?: number | null;
  default_monthly_rate_per_ft?: number | null;
  default_seasonal_rate_per_ft?: number | null;
  default_annual_rate_per_ft?: number | null;
  accepting_jobs?: boolean;
}

interface BusinessContextType {
  business: Business | null;
  loading: boolean;
  enabledModules: BusinessModule[];
  isOwner: boolean;
  isStaff: boolean;
  staffPermissions: StaffPermissions;
  hasModuleAccess: (module: BusinessModule, action: "read" | "write") => boolean;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>({});
  const [isOwner, setIsOwner] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  const fetchBusiness = useCallback(async () => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First check if user owns a business
      const { data: ownedBusiness } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (ownedBusiness) {
        setBusiness(ownedBusiness as Business);
        setIsOwner(true);
        setIsStaff(false);
        setStaffPermissions({});
        setLoading(false);
        return;
      }

      // Check if user is staff at a business
      const { data: staffRecord } = await supabase
        .from("business_staff")
        .select("business_id, module_permissions, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (staffRecord) {
        const { data: staffBusiness } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", staffRecord.business_id)
          .single();

        if (staffBusiness) {
          setBusiness(staffBusiness as Business);
          setIsOwner(false);
          setIsStaff(true);
          setStaffPermissions(staffRecord.module_permissions as StaffPermissions || {});
        }
      } else {
        setBusiness(null);
        setIsOwner(false);
        setIsStaff(false);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const hasModuleAccess = useCallback(
    (module: BusinessModule, action: "read" | "write"): boolean => {
      if (!business) return false;

      // Check if module is enabled for the business
      if (!business.enabled_modules.includes(module)) {
        return false;
      }

      // Owners have full access
      if (isOwner) return true;

      // Staff check permissions
      if (isStaff) {
        const modulePerms = staffPermissions[module];
        if (!modulePerms) return false;
        return action === "read" ? !!modulePerms.read : !!modulePerms.write;
      }

      return false;
    },
    [business, isOwner, isStaff, staffPermissions]
  );

  const value: BusinessContextType = {
    business,
    loading,
    enabledModules: business?.enabled_modules || [],
    isOwner,
    isStaff,
    staffPermissions,
    hasModuleAccess,
    refreshBusiness: fetchBusiness,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
