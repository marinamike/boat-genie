import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DockStatusWithDetails {
  id: string;
  boat_id: string;
  slip_number: string | null;
  stay_type: string | null;
  is_active: boolean;
  checked_in_at: string;
  checked_out_at: string | null;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
  };
  active_work_orders?: {
    id: string;
    work_order_id: string;
    provider_name: string | null;
    service_type: string | null;
    started_at: string;
  }[];
}

export function useLiveDockStatus() {
  const [dockStatus, setDockStatus] = useState<DockStatusWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDockStatus = useCallback(async () => {
    try {
      // Fetch active dock status with boat details
      const { data: statusData, error: statusError } = await supabase
        .from("dock_status")
        .select(`
          id,
          boat_id,
          slip_number,
          stay_type,
          is_active,
          checked_in_at,
          checked_out_at
        `)
        .eq("is_active", true)
        .order("checked_in_at", { ascending: false });

      if (statusError) throw statusError;

      if (!statusData || statusData.length === 0) {
        setDockStatus([]);
        setLoading(false);
        return;
      }

      // Fetch boat details
      const boatIds = statusData.map(s => s.boat_id);
      const { data: boatsData } = await supabase
        .from("boats")
        .select("id, name, make, model, length_ft")
        .in("id", boatIds);

      // Fetch active work orders on dock
      const statusIds = statusData.map(s => s.id);
      const { data: workOrdersData } = await supabase
        .from("dock_work_orders")
        .select("id, dock_status_id, work_order_id, provider_name, service_type, started_at")
        .in("dock_status_id", statusIds)
        .eq("is_active", true);

      // Combine data
      const combined = statusData.map(status => ({
        ...status,
        boat: boatsData?.find(b => b.id === status.boat_id),
        active_work_orders: workOrdersData?.filter(wo => wo.dock_status_id === status.id) || []
      }));

      setDockStatus(combined);
    } catch (error) {
      console.error("Error fetching dock status:", error);
      toast({
        title: "Error",
        description: "Failed to load dock status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchDockStatus();
  }, [fetchDockStatus]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("dock_status_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dock_status",
        },
        () => {
          fetchDockStatus();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dock_work_orders",
        },
        () => {
          fetchDockStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDockStatus]);

  const checkInBoat = async (
    boatId: string,
    slipNumber: string,
    stayType: string,
    reservationId?: string
  ) => {
    try {
      const { error } = await supabase.from("dock_status").insert({
        boat_id: boatId,
        slip_number: slipNumber,
        stay_type: stayType,
        reservation_id: reservationId,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Checked In",
        description: "Vessel is now on dock",
      });

      return true;
    } catch (error) {
      console.error("Error checking in boat:", error);
      toast({
        title: "Error",
        description: "Failed to check in vessel",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkOutBoat = async (dockStatusId: string) => {
    try {
      const { error } = await supabase
        .from("dock_status")
        .update({
          is_active: false,
          checked_out_at: new Date().toISOString(),
        })
        .eq("id", dockStatusId);

      if (error) throw error;

      toast({
        title: "Checked Out",
        description: "Vessel has departed",
      });

      return true;
    } catch (error) {
      console.error("Error checking out boat:", error);
      toast({
        title: "Error",
        description: "Failed to check out vessel",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    dockStatus,
    loading,
    refetch: fetchDockStatus,
    checkInBoat,
    checkOutBoat,
  };
}
