import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export interface QCQueueItem {
  id: string;
  title: string;
  boat_id: string;
  boat_name: string;
  boat_length_ft: number | null;
  owner_name: string | null;
  provider_id: string | null;
  provider_name: string | null;
  marina_name: string | null;
  marina_lat: number | null;
  marina_lng: number | null;
  escrow_amount: number | null;
  materials_deposit: number | null;
  qc_requested_at: string | null;
  is_emergency: boolean;
  escrow_status: string;
  checklist_count: number;
  verified_count: number;
}

export interface ActiveWorkOrder {
  id: string;
  title: string;
  boat_name: string;
  provider_name: string | null;
  status: string;
  scheduled_date: string | null;
  is_emergency: boolean;
  created_at: string;
  escrow_status: string;
}

export function useQCQueue() {
  const [qcQueue, setQCQueue] = useState<QCQueueItem[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveWorkOrder[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<ActiveWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isMarinaStaff, marina } = useUserRole();

  const fetchQCQueue = useCallback(async () => {
    try {
      // Fetch work orders pending QC review
      let query = supabase
        .from("work_orders")
        .select(`
          id,
          title,
          boat_id,
          provider_id,
          escrow_amount,
          materials_deposit,
          qc_requested_at,
          is_emergency,
          escrow_status,
          boats (
            name,
            length_ft,
            owner_id
          )
        `)
        .eq("escrow_status", "pending_release")
        .order("qc_requested_at", { ascending: true });

      const { data: workOrders, error } = await query;
      if (error) throw error;

      if (!workOrders || workOrders.length === 0) {
        setQCQueue([]);
        return;
      }

      // Get boat profiles for marina info
      const boatIds = workOrders.map(wo => wo.boat_id);
      const { data: boatProfiles } = await supabase
        .from("boat_profiles")
        .select("boat_id, marina_name")
        .in("boat_id", boatIds);

      const boatProfileMap = new Map(
        (boatProfiles || []).map(bp => [bp.boat_id, bp])
      );

      // Get provider names from businesses table (unified schema)
      const providerIds = [...new Set(workOrders.map(wo => wo.provider_id).filter(Boolean))];
      let providerMap = new Map<string, string>();
      if (providerIds.length > 0) {
        const { data: providers } = await supabase
          .from("businesses")
          .select("owner_id, business_name")
          .in("owner_id", providerIds);
        providerMap = new Map((providers || []).map(p => [p.owner_id, p.business_name || "Unknown"]));
      }

      // Get owner names
      const ownerIds = [...new Set(workOrders.map(wo => (wo.boats as any)?.owner_id).filter(Boolean))];
      let ownerMap = new Map<string, string>();
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds);
        ownerMap = new Map((profiles || []).map(p => [p.id, p.full_name || "Unknown"]));
      }

      // Get checklist counts
      const workOrderIds = workOrders.map(wo => wo.id);
      const { data: checklistItems } = await supabase
        .from("qc_checklist_items")
        .select("work_order_id, is_verified")
        .in("work_order_id", workOrderIds);

      const checklistCounts = new Map<string, { total: number; verified: number }>();
      (checklistItems || []).forEach(item => {
        const current = checklistCounts.get(item.work_order_id) || { total: 0, verified: 0 };
        current.total++;
        if (item.is_verified) current.verified++;
        checklistCounts.set(item.work_order_id, current);
      });

      // Build queue items
      let queueItems: QCQueueItem[] = workOrders.map(wo => {
        const boat = wo.boats as any;
        const profile = boatProfileMap.get(wo.boat_id);
        const counts = checklistCounts.get(wo.id) || { total: 0, verified: 0 };

        return {
          id: wo.id,
          title: wo.title,
          boat_id: wo.boat_id,
          boat_name: boat?.name || "Unknown Boat",
          boat_length_ft: boat?.length_ft,
          owner_name: boat?.owner_id ? ownerMap.get(boat.owner_id) || null : null,
          provider_id: wo.provider_id,
          provider_name: wo.provider_id ? providerMap.get(wo.provider_id) || null : null,
          marina_name: profile?.marina_name || null,
          marina_lat: null, // Could be enhanced with marina coordinates
          marina_lng: null,
          escrow_amount: wo.escrow_amount,
          materials_deposit: wo.materials_deposit,
          qc_requested_at: wo.qc_requested_at,
          is_emergency: wo.is_emergency,
          escrow_status: wo.escrow_status,
          checklist_count: counts.total,
          verified_count: counts.verified,
        };
      });

      // Filter for marina staff - only show boats at their marina
      if (isMarinaStaff && marina) {
        queueItems = queueItems.filter(
          item => item.marina_name?.toLowerCase() === marina.business_name.toLowerCase()
        );
      }

      setQCQueue(queueItems);
    } catch (error) {
      console.error("Error fetching QC queue:", error);
      setQCQueue([]);
    }
  }, [isMarinaStaff, marina]);

  const fetchActiveJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          title,
          status,
          scheduled_date,
          is_emergency,
          created_at,
          escrow_status,
          provider_id,
          boats (name)
        `)
        .in("status", ["assigned", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get provider names from businesses table (unified schema)
      const providerIds = [...new Set((data || []).map(wo => wo.provider_id).filter(Boolean))];
      let providerMap = new Map<string, string>();
      if (providerIds.length > 0) {
        const { data: providers } = await supabase
          .from("businesses")
          .select("owner_id, business_name")
          .in("owner_id", providerIds);
        providerMap = new Map((providers || []).map(p => [p.owner_id, p.business_name || "Unknown"]));
      }

      const active: ActiveWorkOrder[] = (data || []).map(wo => ({
        id: wo.id,
        title: wo.title,
        boat_name: (wo.boats as any)?.name || "Unknown Boat",
        provider_name: wo.provider_id ? providerMap.get(wo.provider_id) || null : null,
        status: wo.status,
        scheduled_date: wo.scheduled_date,
        is_emergency: wo.is_emergency,
        created_at: wo.created_at,
        escrow_status: wo.escrow_status,
      }));

      setActiveJobs(active);
    } catch (error) {
      console.error("Error fetching active jobs:", error);
    }
  }, []);

  const fetchUpcomingJobs = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          title,
          status,
          scheduled_date,
          is_emergency,
          created_at,
          escrow_status,
          provider_id,
          boats (name)
        `)
        .eq("status", "pending")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(20);

      if (error) throw error;

      // Get provider names from businesses table (unified schema)
      const providerIds = [...new Set((data || []).map(wo => wo.provider_id).filter(Boolean))];
      let providerMap = new Map<string, string>();
      if (providerIds.length > 0) {
        const { data: providers } = await supabase
          .from("businesses")
          .select("owner_id, business_name")
          .in("owner_id", providerIds);
        providerMap = new Map((providers || []).map(p => [p.owner_id, p.business_name || "Unknown"]));
      }

      const upcoming: ActiveWorkOrder[] = (data || []).map(wo => ({
        id: wo.id,
        title: wo.title,
        boat_name: (wo.boats as any)?.name || "Unknown Boat",
        provider_name: wo.provider_id ? providerMap.get(wo.provider_id) || null : null,
        status: wo.status,
        scheduled_date: wo.scheduled_date,
        is_emergency: wo.is_emergency,
        created_at: wo.created_at,
        escrow_status: wo.escrow_status,
      }));

      setUpcomingJobs(upcoming);
    } catch (error) {
      console.error("Error fetching upcoming jobs:", error);
    }
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchQCQueue(), fetchActiveJobs(), fetchUpcomingJobs()]);
    setLoading(false);
  }, [fetchQCQueue, fetchActiveJobs, fetchUpcomingJobs]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    qcQueue,
    activeJobs,
    upcomingJobs,
    loading,
    refetch,
  };
}
