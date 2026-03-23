import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProviderMetrics {
  activeJobsCount: number;
  pendingQuotesCount: number;
  totalEarnings: number;
}

export interface ActiveWorkOrder {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  scheduled_date: string | null;
  is_emergency: boolean;
  retail_price: number | null;
  wholesale_price: number | null;
  lead_fee: number | null;
  service_fee: number | null;
  created_at: string;
  boat_id: string;
  boat_name: string;
  boat_length_ft: number | null;
  marina_name: string | null;
  marina_address: string | null;
  slip_number: string | null;
  owner_id: string | null;
  provider_phone: string | null;
  provider_name: string | null;
  provider_checked_in_at: string | null;
}

export interface CompletedJob {
  id: string;
  title: string;
  completed_at: string | null;
  wholesale_price: number | null;
  lead_fee: number | null;
  funds_released_at: string | null;
  boat_name: string;
}

export interface ProviderService {
  id: string;
  service_name: string;
  price: number;
  pricing_model: string;
  is_locked: boolean;
  category?: string;
}

export function useProviderMetrics() {
  const [metrics, setMetrics] = useState<ProviderMetrics>({
    activeJobsCount: 0,
    pendingQuotesCount: 0,
    totalEarnings: 0,
  });
  const [activeWorkOrders, setActiveWorkOrders] = useState<ActiveWorkOrder[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMetrics = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Fetch business profile for services
      const { data: providerProfile } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      // Fetch provider's services
      if (providerProfile?.id) {
        const { data: services } = await supabase
          .from("provider_services")
          .select("id, service_name, price, pricing_model, is_locked")
          .eq("provider_id", providerProfile.id)
          .eq("is_active", true);
        
        setProviderServices((services || []) as ProviderService[]);
      }

      // Fetch active work orders (assigned or in_progress)
      const { data: activeOrders } = await supabase
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
          wholesale_price,
          lead_fee,
          service_fee,
          created_at,
          boat_id,
          provider_id,
          provider_checked_in_at,
          boat:boats(
            id,
            name,
            length_ft,
            owner_id,
            boat_profiles(marina_name, marina_address, slip_number)
          )
        `)
        .eq("provider_id", userId)
        .in("status", ["pending", "assigned", "in_progress"])
        .order("priority", { ascending: false })
        .order("scheduled_date", { ascending: true });

      const formattedActive: ActiveWorkOrder[] = (activeOrders || []).map((wo: any) => {
        const boatProfile = Array.isArray(wo.boat?.boat_profiles) 
          ? wo.boat.boat_profiles[0] 
          : wo.boat?.boat_profiles;
        
        return {
          id: wo.id,
          title: wo.title,
          description: wo.description,
          status: wo.status,
          priority: wo.priority,
          scheduled_date: wo.scheduled_date,
          is_emergency: wo.is_emergency,
          retail_price: wo.retail_price,
          wholesale_price: wo.wholesale_price,
          lead_fee: wo.lead_fee,
          service_fee: wo.service_fee,
          created_at: wo.created_at,
          boat_id: wo.boat?.id,
          boat_name: wo.boat?.name || "Unknown Boat",
          boat_length_ft: wo.boat?.length_ft,
          marina_name: boatProfile?.marina_name || null,
          marina_address: boatProfile?.marina_address || null,
          slip_number: boatProfile?.slip_number || null,
          owner_id: wo.boat?.owner_id || null,
          provider_phone: wo.provider?.primary_contact_phone || null,
          provider_name: wo.provider?.business_name || null,
          provider_checked_in_at: wo.provider_checked_in_at || null,
        };
      });

      setActiveWorkOrders(formattedActive);

      // Fetch pending quotes count
      const { count: pendingQuotes } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", userId)
        .eq("status", "pending");

      // Fetch completed jobs for earnings
      const { data: completed } = await supabase
        .from("work_orders")
        .select(`
          id,
          title,
          completed_at,
          wholesale_price,
          lead_fee,
          funds_released_at,
          boat:boats(name)
        `)
        .eq("provider_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      const formattedCompleted: CompletedJob[] = (completed || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        completed_at: job.completed_at,
        wholesale_price: job.wholesale_price,
        lead_fee: job.lead_fee,
        funds_released_at: job.funds_released_at,
        boat_name: job.boat?.name || "Unknown Boat",
      }));

      setCompletedJobs(formattedCompleted);

      // Calculate total earnings (sum of wholesale_price - lead_fee for completed jobs)
      const totalEarnings = formattedCompleted.reduce((sum, job) => {
        const gross = job.wholesale_price || 0;
        const fee = job.lead_fee || 0;
        return sum + (gross - fee);
      }, 0);

      setMetrics({
        activeJobsCount: formattedActive.length,
        pendingQuotesCount: pendingQuotes || 0,
        totalEarnings,
      });

    } catch (error) {
      console.error("Error fetching provider metrics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const notifyArrival = async (workOrderId: string, ownerId: string | null) => {
    try {
      // In a real app, this would send a push notification or email
      // For now, we'll update the work order status to in_progress
      const { error } = await supabase
        .from("work_orders")
        .update({ status: "in_progress" })
        .eq("id", workOrderId);

      if (error) throw error;

      toast({
        title: "Arrival Notified",
        description: "The boat owner has been notified that you're on-site.",
      });

      await fetchMetrics();
      return true;
    } catch (error: any) {
      console.error("Error notifying arrival:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      await fetchMetrics();
      return true;
    } catch (error: any) {
      console.error("Error updating work order:", error);
      toast({ 
        title: "Error updating status", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    }
  };

  return {
    metrics,
    activeWorkOrders,
    completedJobs,
    providerServices,
    loading,
    notifyArrival,
    updateWorkOrderStatus,
    refetch: fetchMetrics,
  };
}
