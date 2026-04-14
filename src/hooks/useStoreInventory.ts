import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type StoreItemCategory = "parts" | "retail" | "consumables";

export interface StoreItem {
  id: string;
  business_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: StoreItemCategory;
  description: string | null;
  current_quantity: number;
  reorder_point: number;
  unit_cost: number;
  retail_price: number;
  is_part: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesReceipt {
  id: string;
  business_id: string;
  receipt_number: string;
  customer_id: string | null;
  customer_name: string | null;
  boat_id: string | null;
  boat_name: string | null;
  is_guest_checkout: boolean;
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  total_amount: number;
  payment_method: string;
  notes: string | null;
  recorded_by: string;
  recorded_at: string;
  items?: SalesReceiptItem[];
}

export interface SalesReceiptItem {
  id: string;
  receipt_id: string;
  item_type: "inventory" | "fuel" | "service";
  inventory_item_id: string | null;
  fuel_transaction_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CartItem {
  id: string; // temp ID for cart
  type: "inventory" | "fuel";
  item_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CustomerLookup {
  id: string;
  name: string;
  email: string | null;
  boat_id?: string;
  boat_name?: string;
}

export interface PartsPullLog {
  id: string;
  work_order_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  charge_price: number;
  line_item_id: string | null;
  pulled_by: string;
  pulled_at: string;
  notes: string | null;
  item?: StoreItem;
}

export function useStoreInventory() {
  const { business } = useBusiness();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [inventory, setInventory] = useState<StoreItem[]>([]);
  const [receipts, setReceipts] = useState<SalesReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    if (!business?.id) return;
    
    const { data, error } = await supabase
      .from("store_inventory")
      .select("*")
      .eq("business_id", business.id)
      .order("name");
    
    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      // Cast the data to StoreItem[] since we know the structure
      setInventory((data || []) as unknown as StoreItem[]);
    }
  }, [business?.id]);

  const fetchReceipts = useCallback(async () => {
    if (!business?.id) return;
    
    const { data, error } = await supabase
      .from("sales_receipts")
      .select(`
        *,
        items:sales_receipt_items(*)
      `)
      .eq("business_id", business.id)
      .order("recorded_at", { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("Error fetching receipts:", error);
    } else {
      setReceipts((data || []) as unknown as SalesReceipt[]);
    }
  }, [business?.id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchInventory(), fetchReceipts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchInventory, fetchReceipts]);

  // CRUD for inventory items
  const createItem = async (item: Omit<StoreItem, "id" | "business_id" | "created_at" | "updated_at">) => {
    if (!business?.id) return;

    const { error } = await supabase
      .from("store_inventory")
      .insert({
        ...item,
        business_id: business.id,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item Added", description: `${item.name} added to inventory` });
      await fetchInventory();
    }
  };

  const updateItem = async (id: string, updates: Partial<StoreItem>) => {
    const { error } = await supabase
      .from("store_inventory")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item Updated" });
      await fetchInventory();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from("store_inventory")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item Deleted" });
      await fetchInventory();
    }
  };

  // Customer lookup
  const searchCustomers = async (query: string): Promise<CustomerLookup[]> => {
    if (!query || query.length < 2) return [];

    // Search profiles and boats
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .ilike("full_name", `%${query}%`)
      .limit(10);

    const { data: boats } = await supabase
      .from("boats")
      .select("id, name, owner_id")
      .ilike("name", `%${query}%`)
      .limit(10);

    const results: CustomerLookup[] = [];

    // Add profile results
    (profiles || []).forEach((p: any) => {
      results.push({
        id: p.id,
        name: p.full_name || "Unknown",
        email: p.email,
      });
    });

    // Add boat results (with owner info)
    for (const boat of boats || []) {
      const b = boat as any;
      const { data: owner } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", b.owner_id)
        .single();

      if (owner) {
        results.push({
          id: b.owner_id,
          name: (owner as any).full_name || "Unknown",
          email: (owner as any).email,
          boat_id: b.id,
          boat_name: b.name,
        });
      }
    }

    return results;
  };

  // Generate receipt number
  const generateReceiptNumber = () => {
    const date = new Date();
    const prefix = `R${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${suffix}`;
  };

  // Process sale (checkout)
  const processSale = async (
    cart: CartItem[],
    customer: CustomerLookup | null,
    taxRate: number = 0,
    paymentMethod: string = "card",
    notes?: string
  ) => {
    if (!business?.id || !user?.id) return null;
    if (cart.length === 0) {
      toast({ title: "Error", description: "Cart is empty", variant: "destructive" });
      return null;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const receiptNumber = generateReceiptNumber();

    // Create receipt
    const { data: receipt, error: receiptError } = await supabase
      .from("sales_receipts")
      .insert({
        business_id: business.id,
        receipt_number: receiptNumber,
        customer_id: customer?.id || null,
        customer_name: customer?.name || null,
        boat_id: customer?.boat_id || null,
        boat_name: customer?.boat_name || null,
        is_guest_checkout: !customer,
        subtotal,
        tax_amount: taxAmount,
        tax_rate: taxRate,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        notes,
        recorded_by: user.id,
      })
      .select()
      .single();

    if (receiptError || !receipt) {
      toast({ title: "Error", description: receiptError?.message || "Failed to create receipt", variant: "destructive" });
      return null;
    }

    // Create line items
    const lineItems = cart.map((item) => ({
      receipt_id: (receipt as any).id,
      item_type: item.type,
      inventory_item_id: item.type === "inventory" ? item.item_id : null,
      fuel_transaction_id: item.type === "fuel" ? item.item_id : null,
      description: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));

    const { error: itemsError } = await supabase
      .from("sales_receipt_items")
      .insert(lineItems);

    if (itemsError) {
      console.error("Error creating receipt items:", itemsError);
    }

    // Deduct inventory quantities
    for (const item of cart) {
      if (item.type === "inventory" && item.item_id) {
        const inventoryItem = inventory.find((i) => i.id === item.item_id);
        if (inventoryItem) {
          await supabase
            .from("store_inventory")
            .update({ current_quantity: inventoryItem.current_quantity - item.quantity })
            .eq("id", item.item_id);
        }
      }
    }

    // Create unified customer invoice entry if customer is identified
    if (customer?.id) {
      await supabase
        .from("customer_invoices")
        .insert({
          customer_id: customer.id,
          business_id: business.id,
          source_type: "store",
          source_id: (receipt as any).id,
          source_reference: `Ship Store Receipt #${receiptNumber}`,
          amount: totalAmount,
          status: "paid", // POS sales are paid immediately
          paid_at: new Date().toISOString(),
        });
    }

    toast({ title: "Sale Complete", description: `Receipt #${receiptNumber}` });
    await Promise.all([fetchInventory(), fetchReceipts()]);

    return receipt as unknown as SalesReceipt;
  };

  // Pull part for work order
  const pullPartForWorkOrder = async (
    workOrderId: string,
    itemId: string,
    quantity: number,
    notes?: string,
    chargePrice?: number
  ) => {
    if (!user?.id) return false;

    const item = inventory.find((i) => i.id === itemId);
    if (!item) {
      toast({ title: "Error", description: "Item not found", variant: "destructive" });
      return false;
    }

    if (item.current_quantity < quantity) {
      toast({ title: "Error", description: "Insufficient stock", variant: "destructive" });
      return false;
    }

    const totalCost = item.unit_cost * quantity;
    const finalChargePrice = chargePrice ?? item.retail_price;

    // Log the parts pull
    const { error: logError } = await supabase
      .from("parts_pull_log")
      .insert({
        work_order_id: workOrderId,
        inventory_item_id: itemId,
        quantity,
        unit_cost: item.unit_cost,
        total_cost: totalCost,
        charge_price: finalChargePrice,
        pulled_by: user.id,
        notes,
      });

    if (logError) {
      toast({ title: "Error", description: logError.message, variant: "destructive" });
      return false;
    }

    // Deduct from inventory
    await supabase
      .from("store_inventory")
      .update({ current_quantity: item.current_quantity - quantity })
      .eq("id", itemId);

    toast({ 
      title: "Part Pulled", 
      description: `${quantity}x ${item.name} added to work order ($${totalCost.toFixed(2)})` 
    });
    
    await fetchInventory();
    return true;
  };

  // Get low stock items
  const lowStockItems = inventory.filter(
    (item) => item.is_active && item.current_quantity <= item.reorder_point
  );

  // Get parts (items that can be added to work orders)
  const partsInventory = inventory.filter((item) => item.is_part && item.is_active);

  return {
    inventory,
    receipts,
    loading,
    lowStockItems,
    partsInventory,
    createItem,
    updateItem,
    deleteItem,
    searchCustomers,
    processSale,
    pullPartForWorkOrder,
    refreshInventory: fetchInventory,
    refreshReceipts: fetchReceipts,
  };
}
