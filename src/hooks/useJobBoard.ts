import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WishFormItem {
  id: string;
  service_type: string;
  description: string;
  urgency: string | null;
  preferred_date: string | null;
  status: string;
  created_at: string;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
  } | null;
}

export interface WorkOrderItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  scheduled_date: string | null;
  is_emergency: boolean;
  retail_price: number | null;
  created_at: string;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
  } | null;
}

export function useJobBoard() {
  const [availableWishes, setAvailableWishes] = useState<WishFormItem[]>([]);
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Fetch available wishes (submitted status, not yet converted to work orders)
      const { data: wishes, error: wishError } = await supabase
        .from("wish_forms")
        .select(`
          id,
          service_type,
          description,
          urgency,
          preferred_date,
          status,
          created_at,
          boat:boats(id, name, make, model, length_ft)
        `)
        .eq("status", "submitted")
        .order("created_at", { ascending: false });

      if (wishError) throw wishError;

      // Fetch active work orders assigned to this provider
      const { data: workOrders, error: woError } = await supabase
        .from("work_orders")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          scheduled_date,
          is_emergency,
          retail_price,
          created_at,
          boat:boats(id, name, make, model, length_ft)
        `)
        .eq("provider_id", session.user.id)
        .not("status", "eq", "completed")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (woError) throw woError;

      setAvailableWishes(wishes || []);
      setActiveWorkOrders(workOrders || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const claimWish = async (wishId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // Get the wish details
      const { data: wish, error: wishError } = await supabase
        .from("wish_forms")
        .select("*")
        .eq("id", wishId)
        .single();

      if (wishError) throw wishError;

      // Create a work order from the wish
      const { error: woError } = await supabase
        .from("work_orders")
        .insert({
          boat_id: wish.boat_id,
          provider_id: session.user.id,
          title: `${wish.service_type} Service`,
          description: wish.description,
          status: "pending",
          priority: wish.urgency === "urgent" ? 3 : wish.urgency === "high" ? 2 : 1,
          is_emergency: wish.urgency === "urgent",
          scheduled_date: wish.preferred_date,
        });

      if (woError) throw woError;

      // Update wish status
      const { error: updateError } = await supabase
        .from("wish_forms")
        .update({ status: "converted" })
        .eq("id", wishId);

      if (updateError) throw updateError;

      toast({ title: "Job claimed successfully!" });
      await fetchJobs();
      return true;
    } catch (error: any) {
      console.error("Error claiming wish:", error);
      toast({ title: "Error claiming job", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const updateWorkOrderStatus = async (workOrderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("work_orders")
        .update({ 
          status: status as "pending" | "in_progress" | "completed" | "assigned" | "cancelled",
          completed_at: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", workOrderId);

      if (error) throw error;

      toast({ title: "Status updated!" });
      await fetchJobs();
      return true;
    } catch (error: any) {
      console.error("Error updating work order:", error);
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
      return false;
    }
  };

  return {
    availableWishes,
    activeWorkOrders,
    loading,
    claimWish,
    updateWorkOrderStatus,
    refetch: fetchJobs,
  };
}
