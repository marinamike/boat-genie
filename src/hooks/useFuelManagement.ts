import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/hooks/use-toast";

export interface FuelTank {
  id: string;
  business_id: string;
  tank_name: string;
  fuel_type: "diesel" | "gasoline" | "premium";
  total_capacity_gallons: number;
  current_volume_gallons: number;
  low_level_threshold_gallons: number;
  last_delivery_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuelPump {
  id: string;
  business_id: string;
  tank_id: string;
  pump_name: string;
  pump_number: string | null;
  lifetime_meter_gallons: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tank?: FuelTank;
}

export interface FuelTransaction {
  id: string;
  business_id: string;
  pump_id: string;
  tank_id: string;
  gallons_sold: number;
  price_per_gallon: number;
  total_amount: number;
  vessel_name: string | null;
  vessel_id: string | null;
  reservation_id: string | null;
  notes: string | null;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
  pump?: FuelPump;
  tank?: FuelTank;
}

export interface FuelDelivery {
  id: string;
  business_id: string;
  tank_id: string;
  gallons_delivered: number;
  delivery_date: string;
  vendor_name: string | null;
  invoice_number: string | null;
  cost_per_gallon: number | null;
  total_cost: number | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
  tank?: FuelTank;
}

export interface FuelReconciliation {
  id: string;
  business_id: string;
  tank_id: string;
  physical_reading_gallons: number;
  theoretical_volume_gallons: number;
  discrepancy_gallons: number;
  discrepancy_percentage: number;
  measurement_type: "gallons" | "inches";
  raw_measurement: number | null;
  notes: string | null;
  recorded_by: string;
  recorded_at: string;
  created_at: string;
  tank?: FuelTank;
}

export function useFuelManagement() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [tanks, setTanks] = useState<FuelTank[]>([]);
  const [pumps, setPumps] = useState<FuelPump[]>([]);
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [deliveries, setDeliveries] = useState<FuelDelivery[]>([]);
  const [reconciliations, setReconciliations] = useState<FuelReconciliation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTanks = useCallback(async () => {
    if (!business?.id) return;
    
    const { data, error } = await supabase
      .from("fuel_tanks")
      .select("*")
      .eq("business_id", business.id)
      .order("tank_name");

    if (error) {
      console.error("Error fetching tanks:", error);
      return;
    }

    setTanks(data as FuelTank[]);
  }, [business?.id]);

  const fetchPumps = useCallback(async () => {
    if (!business?.id) return;
    
    const { data, error } = await supabase
      .from("fuel_pumps")
      .select("*, tank:fuel_tanks(*)")
      .eq("business_id", business.id)
      .order("pump_name");

    if (error) {
      console.error("Error fetching pumps:", error);
      return;
    }

    setPumps(data as FuelPump[]);
  }, [business?.id]);

  const fetchTransactions = useCallback(async () => {
    if (!business?.id) return;
    
    const { data, error } = await supabase
      .from("fuel_transactions")
      .select("*, pump:fuel_pumps(*), tank:fuel_tanks(*)")
      .eq("business_id", business.id)
      .order("recorded_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching transactions:", error);
      return;
    }

    setTransactions(data as FuelTransaction[]);
  }, [business?.id]);

  const fetchDeliveries = useCallback(async () => {
    if (!business?.id) return;
    
    const { data, error } = await supabase
      .from("fuel_deliveries")
      .select("*, tank:fuel_tanks(*)")
      .eq("business_id", business.id)
      .order("delivery_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching deliveries:", error);
      return;
    }

    setDeliveries(data as FuelDelivery[]);
  }, [business?.id]);

  const fetchReconciliations = useCallback(async () => {
    if (!business?.id) return;
    
    const { data, error } = await supabase
      .from("fuel_reconciliations")
      .select("*, tank:fuel_tanks(*)")
      .eq("business_id", business.id)
      .order("recorded_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching reconciliations:", error);
      return;
    }

    setReconciliations(data as FuelReconciliation[]);
  }, [business?.id]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchTanks(),
      fetchPumps(),
      fetchTransactions(),
      fetchDeliveries(),
      fetchReconciliations(),
    ]);
    setLoading(false);
  }, [fetchTanks, fetchPumps, fetchTransactions, fetchDeliveries, fetchReconciliations]);

  useEffect(() => {
    if (business?.id) {
      refresh();
    }
  }, [business?.id, refresh]);

  // CRUD Operations
  const createTank = async (data: Omit<FuelTank, "id" | "created_at" | "updated_at" | "business_id">) => {
    if (!business?.id) return null;
    
    const { data: newTank, error } = await supabase
      .from("fuel_tanks")
      .insert({ ...data, business_id: business.id })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating tank", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ title: "Tank created", description: `${data.tank_name} has been added.` });
    await fetchTanks();
    return newTank;
  };

  const updateTank = async (id: string, data: Partial<FuelTank>) => {
    const { error } = await supabase
      .from("fuel_tanks")
      .update(data)
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating tank", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Tank updated" });
    await fetchTanks();
    return true;
  };

  const createPump = async (data: Omit<FuelPump, "id" | "created_at" | "updated_at" | "business_id" | "tank">) => {
    if (!business?.id) return null;
    
    const { data: newPump, error } = await supabase
      .from("fuel_pumps")
      .insert({ ...data, business_id: business.id })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating pump", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ title: "Pump created", description: `${data.pump_name} has been added.` });
    await fetchPumps();
    return newPump;
  };

  const updatePump = async (id: string, data: Partial<FuelPump>) => {
    const { error } = await supabase
      .from("fuel_pumps")
      .update(data)
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating pump", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Pump updated" });
    await fetchPumps();
    return true;
  };

  const recordSale = async (data: {
    pump_id: string;
    gallons_sold: number;
    price_per_gallon: number;
    vessel_name?: string;
    vessel_id?: string;
    reservation_id?: string;
    notes?: string;
  }) => {
    if (!business?.id) return null;
    
    const pump = pumps.find(p => p.id === data.pump_id);
    if (!pump) {
      toast({ title: "Error", description: "Pump not found", variant: "destructive" });
      return null;
    }

    const total_amount = data.gallons_sold * data.price_per_gallon;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    // Create transaction
    const { data: transaction, error } = await supabase
      .from("fuel_transactions")
      .insert({
        business_id: business.id,
        pump_id: data.pump_id,
        tank_id: pump.tank_id,
        gallons_sold: data.gallons_sold,
        price_per_gallon: data.price_per_gallon,
        total_amount,
        vessel_name: data.vessel_name || null,
        vessel_id: data.vessel_id || null,
        reservation_id: data.reservation_id || null,
        notes: data.notes || null,
        recorded_by: user.user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error recording sale", description: error.message, variant: "destructive" });
      return null;
    }

    // Update tank volume
    const tank = tanks.find(t => t.id === pump.tank_id);
    if (tank) {
      await supabase
        .from("fuel_tanks")
        .update({ current_volume_gallons: tank.current_volume_gallons - data.gallons_sold })
        .eq("id", tank.id);
    }

    // Update pump meter
    await supabase
      .from("fuel_pumps")
      .update({ lifetime_meter_gallons: pump.lifetime_meter_gallons + data.gallons_sold })
      .eq("id", pump.id);

    toast({ 
      title: "Sale recorded", 
      description: `${data.gallons_sold} gallons sold for $${total_amount.toFixed(2)}` 
    });
    
    await refresh();
    return transaction;
  };

  const recordDelivery = async (data: {
    tank_id: string;
    gallons_delivered: number;
    vendor_name?: string;
    invoice_number?: string;
    cost_per_gallon?: number;
    notes?: string;
  }) => {
    if (!business?.id) return null;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const total_cost = data.cost_per_gallon 
      ? data.gallons_delivered * data.cost_per_gallon 
      : null;

    const { data: delivery, error } = await supabase
      .from("fuel_deliveries")
      .insert({
        business_id: business.id,
        tank_id: data.tank_id,
        gallons_delivered: data.gallons_delivered,
        vendor_name: data.vendor_name || null,
        invoice_number: data.invoice_number || null,
        cost_per_gallon: data.cost_per_gallon || null,
        total_cost,
        notes: data.notes || null,
        recorded_by: user.user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error recording delivery", description: error.message, variant: "destructive" });
      return null;
    }

    // Update tank volume and last delivery date
    const tank = tanks.find(t => t.id === data.tank_id);
    if (tank) {
      await supabase
        .from("fuel_tanks")
        .update({ 
          current_volume_gallons: tank.current_volume_gallons + data.gallons_delivered,
          last_delivery_date: new Date().toISOString()
        })
        .eq("id", tank.id);
    }

    toast({ 
      title: "Delivery recorded", 
      description: `${data.gallons_delivered} gallons added to tank` 
    });
    
    await refresh();
    return delivery;
  };

  const recordReconciliation = async (data: {
    tank_id: string;
    physical_reading_gallons: number;
    measurement_type: "gallons" | "inches";
    raw_measurement?: number;
    notes?: string;
  }) => {
    if (!business?.id) return null;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const tank = tanks.find(t => t.id === data.tank_id);
    if (!tank) {
      toast({ title: "Error", description: "Tank not found", variant: "destructive" });
      return null;
    }

    const theoretical = tank.current_volume_gallons;
    const physical = data.physical_reading_gallons;
    const discrepancy = physical - theoretical;
    const discrepancy_percentage = theoretical > 0 
      ? (discrepancy / theoretical) * 100 
      : 0;

    const { data: reconciliation, error } = await supabase
      .from("fuel_reconciliations")
      .insert({
        business_id: business.id,
        tank_id: data.tank_id,
        physical_reading_gallons: physical,
        theoretical_volume_gallons: theoretical,
        discrepancy_gallons: discrepancy,
        discrepancy_percentage,
        measurement_type: data.measurement_type,
        raw_measurement: data.raw_measurement || null,
        notes: data.notes || null,
        recorded_by: user.user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error recording reconciliation", description: error.message, variant: "destructive" });
      return null;
    }

    // Update tank to match physical reading
    await supabase
      .from("fuel_tanks")
      .update({ current_volume_gallons: physical })
      .eq("id", tank.id);

    toast({ 
      title: "Reconciliation recorded", 
      description: `Discrepancy: ${discrepancy >= 0 ? '+' : ''}${discrepancy.toFixed(1)} gallons (${discrepancy_percentage.toFixed(1)}%)` 
    });
    
    await refresh();
    return reconciliation;
  };

  return {
    tanks,
    pumps,
    transactions,
    deliveries,
    reconciliations,
    loading,
    refresh,
    createTank,
    updateTank,
    createPump,
    updatePump,
    recordSale,
    recordDelivery,
    recordReconciliation,
  };
}
