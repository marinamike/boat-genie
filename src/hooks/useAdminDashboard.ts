import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AppRole } from "@/contexts/AuthContext";

const GOD_MODE_EMAIL = "info@marinamike.com";

export interface MarketplaceHealth {
  totalWishes: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  totalPlatformRevenue: number; // 5% service fee + 5% lead fee
}

export interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

export interface WorkOrderWithDetails {
  id: string;
  title: string;
  status: string;
  boat_name: string;
  provider_name: string | null;
  check_in_method: string | null;
  provider_checked_in_at: string | null;
  created_at: string;
  is_emergency: boolean;
}

export function useAdminDashboard() {
  const [isGodMode, setIsGodMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marketplaceHealth, setMarketplaceHealth] = useState<MarketplaceHealth>({
    totalWishes: 0,
    activeWorkOrders: 0,
    completedWorkOrders: 0,
    totalPlatformRevenue: 0,
  });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const checkGodModeAccess = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsGodMode(false);
        setLoading(false);
        return;
      }

      // Only allow specific email for God Mode
      const hasAccess = session.user.email === GOD_MODE_EMAIL;
      setIsGodMode(hasAccess);

      if (hasAccess) {
        await Promise.all([
          fetchMarketplaceHealth(),
          fetchUsers(),
          fetchWorkOrders(),
        ]);
      }
    } catch (error) {
      console.error("Error checking god mode access:", error);
      setIsGodMode(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarketplaceHealth = async () => {
    try {
      // Get total wishes
      const { count: wishCount } = await supabase
        .from("wish_forms")
        .select("*", { count: "exact", head: true });

      // Get active work orders
      const { count: activeCount } = await supabase
        .from("work_orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "assigned", "in_progress"]);

      // Get completed work orders with revenue
      const { data: completedOrders } = await supabase
        .from("work_orders")
        .select("service_fee, lead_fee")
        .eq("status", "completed");

      const totalRevenue = (completedOrders || []).reduce((sum, order) => {
        return sum + (Number(order.service_fee) || 0) + (Number(order.lead_fee) || 0);
      }, 0);

      setMarketplaceHealth({
        totalWishes: wishCount || 0,
        activeWorkOrders: activeCount || 0,
        completedWorkOrders: completedOrders?.length || 0,
        totalPlatformRevenue: totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching marketplace health:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: roleMap.get(profile.id) || "boat_owner",
        created_at: profile.created_at,
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          title,
          status,
          check_in_method,
          provider_checked_in_at,
          created_at,
          is_emergency,
          boats(name),
          provider_id
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get provider names
      const providerIds = [...new Set((data || []).map(wo => wo.provider_id).filter(Boolean))];
      let providerMap = new Map<string, string>();

      if (providerIds.length > 0) {
        const { data: providers } = await supabase
          .from("provider_profiles")
          .select("user_id, business_name")
          .in("user_id", providerIds);

        providerMap = new Map((providers || []).map(p => [p.user_id, p.business_name || "Unknown"]));
      }

      const workOrdersWithDetails: WorkOrderWithDetails[] = (data || []).map(wo => ({
        id: wo.id,
        title: wo.title,
        status: wo.status,
        boat_name: (wo.boats as any)?.name || "Unknown Boat",
        provider_name: wo.provider_id ? (providerMap.get(wo.provider_id) || null) : null,
        check_in_method: wo.check_in_method,
        provider_checked_in_at: wo.provider_checked_in_at,
        created_at: wo.created_at,
        is_emergency: wo.is_emergency,
      }));

      setWorkOrders(workOrdersWithDetails);
    } catch (error) {
      console.error("Error fetching work orders:", error);
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({ title: "Role updated successfully" });
      return true;
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    checkGodModeAccess();
  }, [checkGodModeAccess]);

  return {
    isGodMode,
    loading,
    marketplaceHealth,
    users,
    workOrders,
    viewAsUserId,
    setViewAsUserId,
    updateUserRole,
    refetch: checkGodModeAccess,
  };
}
