import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BoatLogEntry {
  id: string;
  boat_id: string;
  work_order_id: string | null;
  title: string;
  description: string | null;
  log_type: string;
  created_at: string;
  created_by: string | null;
}

export interface WorkOrderWithDetails {
  id: string;
  title: string;
  description: string | null;
  status: string;
  service_type: string | null;
  scheduled_date: string | null;
  completed_at: string | null;
  created_at: string;
  retail_price: number | null;
  wholesale_price: number | null;
  service_fee: number | null;
  lead_fee: number | null;
  materials_deposit: number | null;
  escrow_amount: number | null;
  is_emergency: boolean;
  provider_id: string | null;
  qc_verified_at: string | null;
  qc_verifier_name: string | null;
  qc_verifier_role: string | null;
  boat: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
  };
  provider?: {
    business_name: string | null;
  } | null;
}

export interface QCChecklistItem {
  id: string;
  work_order_id: string;
  description: string;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  verifier_name: string | null;
}

export interface BoatLogPhoto {
  id: string;
  boat_log_id: string;
  file_url: string;
  caption: string | null;
  uploaded_at: string;
}

export interface MessageWithPhoto {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  message_type: string;
}

export function useBoatLog(boatId?: string) {
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [completedWorkOrders, setCompletedWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [boats, setBoats] = useState<{ id: string; name: string }[]>([]);
  const [selectedBoatId, setSelectedBoatId] = useState<string | null>(boatId || null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user's boats
  const fetchBoats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("boats")
        .select("id, name")
        .eq("owner_id", session.user.id)
        .order("name");

      if (data && data.length > 0) {
        setBoats(data);
        if (!selectedBoatId) {
          setSelectedBoatId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching boats:", error);
    }
  }, [selectedBoatId]);

  // Fetch work orders for the selected boat
  const fetchWorkOrders = useCallback(async () => {
    if (!selectedBoatId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch active work orders (not completed/cancelled)
      const { data: activeData } = await supabase
        .from("work_orders")
        .select(`
          id, title, description, status, service_type,
          scheduled_date, completed_at, created_at,
          retail_price, wholesale_price, service_fee, lead_fee,
          materials_deposit, escrow_amount, is_emergency,
          provider_id, qc_verified_at, qc_verifier_name, qc_verifier_role,
          boat:boats!inner(id, name, make, model, length_ft)
        `)
        .eq("boat_id", selectedBoatId)
        .not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false });

      // Fetch completed work orders
      const { data: completedData } = await supabase
        .from("work_orders")
        .select(`
          id, title, description, status, service_type,
          scheduled_date, completed_at, created_at,
          retail_price, wholesale_price, service_fee, lead_fee,
          materials_deposit, escrow_amount, is_emergency,
          provider_id, qc_verified_at, qc_verifier_name, qc_verifier_role,
          boat:boats!inner(id, name, make, model, length_ft)
        `)
        .eq("boat_id", selectedBoatId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      // Get provider names for work orders with providers
      const activeWithProviders = await enrichWithProviders(activeData || []);
      const completedWithProviders = await enrichWithProviders(completedData || []);

      setActiveWorkOrders(activeWithProviders);
      setCompletedWorkOrders(completedWithProviders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBoatId]);

  // Enrich work orders with provider business names
  const enrichWithProviders = async (workOrders: any[]): Promise<WorkOrderWithDetails[]> => {
    const providerIds = [...new Set(workOrders.map(wo => wo.provider_id).filter(Boolean))];
    
    if (providerIds.length === 0) {
      return workOrders.map(wo => ({
        ...wo,
        boat: Array.isArray(wo.boat) ? wo.boat[0] : wo.boat,
        provider: null,
      }));
    }

    const { data: providers } = await supabase
      .from("provider_profiles")
      .select("user_id, business_name")
      .in("user_id", providerIds);

    const providerMap = new Map(providers?.map(p => [p.user_id, p.business_name]) || []);

    return workOrders.map(wo => ({
      ...wo,
      boat: Array.isArray(wo.boat) ? wo.boat[0] : wo.boat,
      provider: wo.provider_id ? { business_name: providerMap.get(wo.provider_id) || null } : null,
    }));
  };

  // Fetch QC checklist for a work order
  const fetchQCChecklist = async (workOrderId: string): Promise<QCChecklistItem[]> => {
    const { data } = await supabase
      .from("qc_checklist_items")
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("sort_order");

    return data || [];
  };

  // Fetch photos from messages for a work order
  const fetchWorkOrderPhotos = async (workOrderId: string): Promise<string[]> => {
    const { data } = await supabase
      .from("messages")
      .select("image_url")
      .eq("work_order_id", workOrderId)
      .not("image_url", "is", null);

    return (data || []).map(m => m.image_url).filter(Boolean) as string[];
  };

  // Fetch boat log photos
  const fetchBoatLogPhotos = async (boatId: string): Promise<BoatLogPhoto[]> => {
    const { data } = await supabase
      .from("boat_log_photos")
      .select("*")
      .eq("boat_log_id", boatId)
      .order("uploaded_at", { ascending: false });

    return data || [];
  };

  useEffect(() => {
    fetchBoats();
  }, [fetchBoats]);

  useEffect(() => {
    if (selectedBoatId) {
      setLoading(true);
      fetchWorkOrders();
    }
  }, [selectedBoatId, fetchWorkOrders]);

  return {
    boats,
    selectedBoatId,
    setSelectedBoatId,
    activeWorkOrders,
    completedWorkOrders,
    loading,
    fetchQCChecklist,
    fetchWorkOrderPhotos,
    refetch: fetchWorkOrders,
  };
}
