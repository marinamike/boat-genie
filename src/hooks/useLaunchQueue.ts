import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type LaunchStatus = "queued" | "on_deck" | "splashing" | "splashed" | "in_water" | "hauling" | "re_racked" | "cancelled";
type LaunchMode = "live_queue" | "scheduled_windows";

interface LaunchQueueItem {
  id: string;
  boat_id: string;
  owner_id: string;
  slip_id: string | null;
  status: LaunchStatus;
  queue_position: number | null;
  requested_at: string;
  scheduled_time: string | null;
  eta: string | null;
  on_deck_at: string | null;
  splashed_at: string | null;
  checked_in_at: string | null;
  hauled_at: string | null;
  is_stale: boolean;
  stale_flagged_at: string | null;
  re_rack_fee_charged: boolean;
  notes: string | null;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
    owner_id: string;
  };
}

interface PublicQueueItem {
  id: string;
  status: LaunchStatus;
  queue_position: number | null;
  requested_at: string;
  scheduled_time: string | null;
  on_deck_at: string | null;
  splashed_at: string | null;
  boat_type: string | null;
  boat_name: string | null;
  is_own_boat: boolean;
}

interface LaunchSettings {
  launch_mode: LaunchMode;
  stale_timeout_minutes: number;
  re_rack_fee: number;
}

export function useLaunchQueue() {
  const [queue, setQueue] = useState<LaunchQueueItem[]>([]);
  const [publicQueue, setPublicQueue] = useState<PublicQueueItem[]>([]);
  const [settings, setSettings] = useState<LaunchSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQueue = useCallback(async () => {
    const { data, error } = await supabase
      .from("launch_queue")
      .select(`
        *,
        boat:boat_id (
          id, name, make, model, length_ft, owner_id
        )
      `)
      .in("status", ["queued", "on_deck", "splashing", "splashed", "in_water", "hauling"])
      .order("queue_position", { ascending: true, nullsFirst: false })
      .order("requested_at", { ascending: true });

    if (!error && data) {
      setQueue(data as unknown as LaunchQueueItem[]);
    }
  }, []);

  const fetchPublicQueue = useCallback(async () => {
    const { data, error } = await supabase
      .from("launch_queue_public")
      .select("*");

    if (!error && data) {
      setPublicQueue(data as PublicQueueItem[]);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("marina_settings")
      .select("launch_mode, stale_timeout_minutes, re_rack_fee")
      .limit(1)
      .maybeSingle();

    if (data) {
      setSettings(data as unknown as LaunchSettings);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchQueue(), fetchPublicQueue(), fetchSettings()]);
      setLoading(false);
    };
    loadData();
  }, [fetchQueue, fetchPublicQueue, fetchSettings]);

  const addToQueue = async (boatId: string, ownerId: string, scheduledTime?: Date) => {
    // Get next queue position
    const maxPosition = queue.reduce((max, item) => 
      Math.max(max, item.queue_position || 0), 0);

    const { data, error } = await supabase
      .from("launch_queue")
      .insert({
        boat_id: boatId,
        owner_id: ownerId,
        queue_position: maxPosition + 1,
        scheduled_time: scheduledTime?.toISOString() || null,
        status: "queued",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Could not add to queue", variant: "destructive" });
      return null;
    }

    await fetchQueue();
    toast({ title: "Added to queue", description: "Launch request submitted" });
    return data;
  };

  const updateStatus = async (queueId: string, status: LaunchStatus) => {
    const updates: Record<string, unknown> = { status };

    // Set timestamps based on status
    if (status === "on_deck") updates.on_deck_at = new Date().toISOString();
    if (status === "splashed") updates.splashed_at = new Date().toISOString();
    if (status === "in_water") updates.checked_in_at = new Date().toISOString();
    if (status === "hauling" || status === "re_racked") updates.hauled_at = new Date().toISOString();

    const { error } = await supabase
      .from("launch_queue")
      .update(updates)
      .eq("id", queueId);

    if (error) {
      toast({ title: "Error", description: "Could not update status", variant: "destructive" });
      return false;
    }

    await fetchQueue();
    return true;
  };

  const setETA = async (queueId: string, eta: Date) => {
    const { error } = await supabase
      .from("launch_queue")
      .update({ eta: eta.toISOString() })
      .eq("id", queueId);

    if (error) {
      toast({ title: "Error", description: "Could not set ETA", variant: "destructive" });
      return false;
    }

    await fetchQueue();
    return true;
  };

  const checkIn = async (queueId: string) => {
    return updateStatus(queueId, "in_water");
  };

  const flagAsStale = async (queueId: string) => {
    const { error } = await supabase
      .from("launch_queue")
      .update({ 
        is_stale: true, 
        stale_flagged_at: new Date().toISOString() 
      })
      .eq("id", queueId);

    if (error) {
      toast({ title: "Error", description: "Could not flag boat", variant: "destructive" });
      return false;
    }

    await fetchQueue();
    toast({ title: "Boat flagged", description: "Marked as stale - no show" });
    return true;
  };

  const chargeReRackFee = async (queueItem: LaunchQueueItem, chargedBy: string) => {
    if (!settings) return false;

    // Create fee record
    const { error: feeError } = await supabase
      .from("re_rack_fees")
      .insert({
        launch_queue_id: queueItem.id,
        boat_id: queueItem.boat_id,
        owner_id: queueItem.owner_id,
        charged_by: chargedBy,
        amount: settings.re_rack_fee,
      });

    if (feeError) {
      toast({ title: "Error", description: "Could not charge fee", variant: "destructive" });
      return false;
    }

    // Update queue item
    const { error } = await supabase
      .from("launch_queue")
      .update({ 
        re_rack_fee_charged: true,
        re_rack_fee_charged_at: new Date().toISOString(),
        status: "re_racked"
      })
      .eq("id", queueItem.id);

    if (error) {
      toast({ title: "Error", description: "Could not update queue", variant: "destructive" });
      return false;
    }

    await fetchQueue();
    toast({ 
      title: "Re-rack fee charged", 
      description: `$${settings.re_rack_fee} charged to owner` 
    });
    return true;
  };

  const updateLaunchMode = async (mode: LaunchMode) => {
    const { error } = await supabase
      .from("marina_settings")
      .update({ launch_mode: mode })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

    if (error) {
      toast({ title: "Error", description: "Could not update mode", variant: "destructive" });
      return false;
    }

    setSettings(prev => prev ? { ...prev, launch_mode: mode } : null);
    toast({ title: "Launch mode updated", description: mode === "live_queue" ? "Live Queue (FCFS)" : "Scheduled Windows" });
    return true;
  };

  // Check for stale boats
  const checkStaleBoats = useCallback(() => {
    if (!settings) return [];

    const now = new Date();
    return queue.filter(item => {
      if (item.status !== "splashed" || item.is_stale || item.checked_in_at) return false;

      const splashedAt = new Date(item.splashed_at!);
      const etaTime = item.eta ? new Date(item.eta) : null;

      // Check against ETA (30 mins past) or splash time (60 mins)
      if (etaTime) {
        const etaDeadline = new Date(etaTime.getTime() + 30 * 60 * 1000);
        return now > etaDeadline;
      } else {
        const defaultDeadline = new Date(splashedAt.getTime() + settings.stale_timeout_minutes * 60 * 1000);
        return now > defaultDeadline;
      }
    });
  }, [queue, settings]);

  const staleBoats = checkStaleBoats();

  return {
    queue,
    publicQueue,
    settings,
    loading,
    addToQueue,
    updateStatus,
    setETA,
    checkIn,
    flagAsStale,
    chargeReRackFee,
    updateLaunchMode,
    staleBoats,
    refetch: () => Promise.all([fetchQueue(), fetchPublicQueue(), fetchSettings()]),
  };
}

export type { LaunchQueueItem, PublicQueueItem, LaunchStatus, LaunchMode, LaunchSettings };
