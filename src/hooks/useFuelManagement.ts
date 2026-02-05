import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/hooks/use-toast";

export interface FuelTank {
  id: string;
  business_id: string;
  tank_name: string;
  fuel_type: "diesel" | "gasoline";
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
  tank_id: string | null;
  fuel_type: string;
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
  gallons_requested: number | null;
  gallons_delivered: number;
  delivery_date: string;
  vendor_name: string | null;
  invoice_number: string | null;
  cost_per_gallon: number | null;
  total_cost: number | null;
  notes: string | null;
  recorded_by: string;
  status: "requested" | "delivered" | "cancelled";
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  tank?: FuelTank;
}

export interface PumpTotalizerReading {
  pump_id: string;
  pump_name: string;
  meter_reading: number;
  expected_reading: number;
}

export interface TankReading {
  tank_id: string;
  tank_name: string;
  theoretical_gallons: number;
  physical_gallons: number;
  discrepancy_gallons: number;
}

export interface FuelReconciliation {
  id: string;
  business_id: string;
  fuel_type: string | null;
  tank_readings: TankReading[] | null;
  // Legacy/summary fields
  tank_id: string;
  physical_reading_gallons: number;
  theoretical_volume_gallons: number;
  discrepancy_gallons: number;
  discrepancy_percentage: number;
  measurement_type: string;
  raw_measurement: number | null;
  pump_totalizer_readings: PumpTotalizerReading[] | null;
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

    // Map the data to properly type JSONB fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedData: FuelReconciliation[] = (data || []).map((rec: any) => ({
      ...rec,
      tank_readings: Array.isArray(rec.tank_readings) ? rec.tank_readings as unknown as TankReading[] : null,
      pump_totalizer_readings: Array.isArray(rec.pump_totalizer_readings) ? rec.pump_totalizer_readings as unknown as PumpTotalizerReading[] : null,
    }));

    setReconciliations(typedData);
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

  const deleteTank = async (id: string) => {
    // Check if tank has linked pumps
    const linkedPumps = pumps.filter(p => p.tank_id === id);
    if (linkedPumps.length > 0) {
      toast({ 
        title: "Cannot delete tank", 
        description: "Remove linked pumps first before deleting this tank.",
        variant: "destructive" 
      });
      return false;
    }

    const { error } = await supabase
      .from("fuel_tanks")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting tank", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Tank deleted" });
    await fetchTanks();
    return true;
  };

  const deletePump = async (id: string) => {
    const { error } = await supabase
      .from("fuel_pumps")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting pump", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "Pump deleted" });
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

    // Find all active tanks of this fuel type and pick the one with the most volume
    const matchingTanks = tanks
      .filter(t => t.fuel_type === pump.fuel_type && t.is_active)
      .sort((a, b) => b.current_volume_gallons - a.current_volume_gallons);
    
    const primaryTank = matchingTanks[0];
    if (!primaryTank) {
      toast({ title: "Error", description: `No active ${pump.fuel_type} tanks found`, variant: "destructive" });
      return null;
    }

    // Create transaction - associate with primary tank for inventory tracking
    const { data: transaction, error } = await supabase
      .from("fuel_transactions")
      .insert({
        business_id: business.id,
        pump_id: data.pump_id,
        tank_id: primaryTank.id,
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

    // Update tank volume - deduct from the tank with the most fuel
    await supabase
      .from("fuel_tanks")
      .update({ current_volume_gallons: primaryTank.current_volume_gallons - data.gallons_sold })
      .eq("id", primaryTank.id);

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

  const createDeliveryRequest = async (data: {
    tank_id: string;
    gallons_requested: number;
    vendor_name?: string;
    requested_date?: Date;
    next_available?: boolean;
  }) => {
    if (!business?.id) return null;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    // Build notes for next available flag
    const deliveryNotes = data.next_available ? "Next available delivery requested" : null;

    const { data: delivery, error } = await supabase
      .from("fuel_deliveries")
      .insert({
        business_id: business.id,
        tank_id: data.tank_id,
        gallons_requested: data.gallons_requested,
        gallons_delivered: 0, // Will be set on confirmation
        vendor_name: data.vendor_name || null,
        delivery_date: data.requested_date?.toISOString() || new Date().toISOString(),
        notes: deliveryNotes,
        recorded_by: user.user.id,
        status: "requested",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating delivery request", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ 
      title: "Delivery request created", 
      description: `${data.gallons_requested.toLocaleString()} gallons ordered` 
    });
    
    await refresh();
    return delivery as unknown as FuelDelivery;
  };

  const confirmDelivery = async (deliveryId: string, data: {
    gallons_delivered: number;
    cost_per_gallon?: number;
    invoice_number?: string;
    notes?: string;
  }) => {
    if (!business?.id) return false;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    // Get the delivery to find the tank
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) {
      toast({ title: "Error", description: "Delivery not found", variant: "destructive" });
      return false;
    }

    const total_cost = data.cost_per_gallon 
      ? data.gallons_delivered * data.cost_per_gallon 
      : null;

    const { error } = await supabase
      .from("fuel_deliveries")
      .update({
        gallons_delivered: data.gallons_delivered,
        cost_per_gallon: data.cost_per_gallon || null,
        invoice_number: data.invoice_number || null,
        total_cost,
        notes: data.notes || null,
        status: "delivered",
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.user.id,
        delivery_date: new Date().toISOString(), // Update to actual delivery date
      })
      .eq("id", deliveryId);

    if (error) {
      toast({ title: "Error confirming delivery", description: error.message, variant: "destructive" });
      return false;
    }

    // Update tank volume and last delivery date
    const tank = tanks.find(t => t.id === delivery.tank_id);
    if (tank) {
      await supabase
        .from("fuel_tanks")
        .update({ 
          current_volume_gallons: tank.current_volume_gallons + data.gallons_delivered,
          last_delivery_date: new Date().toISOString()
        })
        .eq("id", tank.id);

      // Auto-update cost basis if cost per gallon was provided
      if (data.cost_per_gallon) {
        const fuelType = tank.fuel_type;
        
        // Get current pricing record for this fuel type
        const { data: priceRecord } = await supabase
          .from("fuel_prices")
          .select("*")
          .eq("business_id", business.id)
          .eq("fuel_type", fuelType)
          .single();

        if (priceRecord) {
          // Calculate new prices based on settings
          let newRetailPrice = priceRecord.retail_price;
          let newMemberPrice = priceRecord.member_price;

          if (priceRecord.auto_margin_enabled && priceRecord.auto_margin_amount) {
            newRetailPrice = data.cost_per_gallon + priceRecord.auto_margin_amount;
          }

          if (priceRecord.member_discount_enabled && priceRecord.member_discount_amount && newRetailPrice) {
            newMemberPrice = newRetailPrice - priceRecord.member_discount_amount;
          }

          // Update fuel prices with new cost basis
          await supabase
            .from("fuel_prices")
            .update({
              cost_basis: data.cost_per_gallon,
              retail_price: newRetailPrice,
              member_price: newMemberPrice,
              updated_by: user.user.id,
            })
            .eq("id", priceRecord.id);
        }
      }
    }

    toast({ 
      title: "Delivery confirmed", 
      description: `${data.gallons_delivered.toLocaleString()} gallons added to tank` 
    });
    
    await refresh();
    return true;
  };

  // Legacy function for backward compatibility
  const recordDelivery = async (data: {
    tank_id: string;
    gallons_delivered: number;
    vendor_name?: string;
    invoice_number?: string;
    cost_per_gallon?: number;
    notes?: string;
  }) => {
    // Create and immediately confirm a delivery
    const request = await createDeliveryRequest({
      tank_id: data.tank_id,
      gallons_requested: data.gallons_delivered,
      vendor_name: data.vendor_name,
    });

    if (!request) return null;

    await confirmDelivery(request.id, {
      gallons_delivered: data.gallons_delivered,
      cost_per_gallon: data.cost_per_gallon,
      invoice_number: data.invoice_number,
      notes: data.notes,
    });

    return request;
  };

  const recordReconciliation = async (data: {
    fuel_type: string;
    tank_readings: TankReading[];
    pump_totalizer_readings?: PumpTotalizerReading[];
    measurement_type: "gallons" | "inches";
    notes?: string;
  }) => {
    if (!business?.id) return null;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    if (data.tank_readings.length === 0) {
      toast({ title: "Error", description: "At least one tank reading is required", variant: "destructive" });
      return null;
    }

    // Calculate totals across all tanks
    const totalTheoretical = data.tank_readings.reduce((sum, tr) => sum + tr.theoretical_gallons, 0);
    const totalPhysical = data.tank_readings.reduce((sum, tr) => sum + tr.physical_gallons, 0);
    const totalDiscrepancy = totalPhysical - totalTheoretical;
    const discrepancy_percentage = totalTheoretical > 0 
      ? (totalDiscrepancy / totalTheoretical) * 100 
      : 0;

    // Use first tank as primary for legacy compatibility
    const primaryTank = data.tank_readings[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any = {
      business_id: business.id,
      fuel_type: data.fuel_type,
      tank_readings: data.tank_readings,
      // Legacy fields for backward compatibility
      tank_id: primaryTank.tank_id,
      physical_reading_gallons: totalPhysical,
      theoretical_volume_gallons: totalTheoretical,
      discrepancy_gallons: totalDiscrepancy,
      discrepancy_percentage,
      measurement_type: data.measurement_type,
      pump_totalizer_readings: data.pump_totalizer_readings || [],
      notes: data.notes || null,
      recorded_by: user.user.id,
    };

    const { data: reconciliation, error } = await supabase
      .from("fuel_reconciliations")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({ title: "Error recording reconciliation", description: error.message, variant: "destructive" });
      return null;
    }

    // Update all tanks to match their physical readings
    for (const tankReading of data.tank_readings) {
      await supabase
        .from("fuel_tanks")
        .update({ current_volume_gallons: tankReading.physical_gallons })
        .eq("id", tankReading.tank_id);
    }

    toast({ 
      title: "Reconciliation recorded", 
      description: `${data.fuel_type} - Discrepancy: ${totalDiscrepancy >= 0 ? '+' : ''}${totalDiscrepancy.toFixed(1)} gal (${discrepancy_percentage.toFixed(1)}%)` 
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
    deleteTank,
    createPump,
    updatePump,
    deletePump,
    recordSale,
    recordDelivery,
    createDeliveryRequest,
    confirmDelivery,
    recordReconciliation,
  };
}
