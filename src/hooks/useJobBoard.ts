import { useState, useEffect, useCallback } from "react";
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
    image_url: string | null;
  } | null;
  boat_profile?: {
    marina_name: string | null;
    slip_number: string | null;
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
  wholesale_price: number | null;
  created_at: string;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
  } | null;
  quotes?: {
    id: string;
    status: string;
    base_price: number;
    total_owner_price: number;
  }[];
}

export interface QuoteFormData {
  laborCost: number;
  materialsCost: number;
  estimatedCompletionDate: string;
  notes?: string;
}

// Maps wish form service types to provider categories
const SERVICE_TYPE_MAPPING: Record<string, string[]> = {
  "Wash": ["Detailing", "Hull Cleaning"],
  "Detail": ["Detailing"],
  "Hull Cleaning": ["Hull Cleaning", "Detailing"],
  "Engine Service": ["Engine Repair", "Mechanical"],
  "Engine Repair": ["Engine Repair", "Mechanical"],
  "Electronics": ["Electronics", "Electrical"],
  "Electrical": ["Electrical", "Electronics"],
  "Canvas": ["Canvas Work"],
  "Rigging": ["Rigging"],
  "Bottom Paint": ["Bottom Painting"],
  "Fiberglass": ["Fiberglass Repair"],
  "Plumbing": ["Plumbing"],
  "HVAC": ["HVAC"],
  "General Maintenance": ["Mechanical", "Engine Repair", "Detailing"],
  "Other": [], // Shows to all providers
};

export function useJobBoard() {
  const [availableWishes, setAvailableWishes] = useState<WishFormItem[]>([]);
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrderItem[]>([]);
  const [providerCategories, setProviderCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const { toast } = useToast();

  const fetchJobs = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Fetch provider's service categories
      const { data: providerProfile } = await supabase
        .from("provider_profiles")
        .select("service_categories")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const categories = providerProfile?.service_categories || [];
      setProviderCategories(categories);

      // Fetch available wishes (submitted or reviewed status)
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
          boat:boats(
            id, 
            name, 
            make, 
            model, 
            length_ft, 
            image_url,
            boat_profiles(marina_name, slip_number)
          )
        `)
        .in("status", ["submitted", "reviewed", "approved"])
        .order("created_at", { ascending: false });

      if (wishError) throw wishError;

      // Filter wishes by provider's service categories
      const filteredWishes = (wishes || [])
        .map((wish) => {
          // Flatten boat_profiles from array to single object
          const boat = wish.boat;
          const boatProfile = Array.isArray(boat?.boat_profiles) 
            ? boat.boat_profiles[0] 
            : boat?.boat_profiles;
          
          return {
            ...wish,
            boat: boat ? { ...boat, boat_profiles: undefined } : null,
            boat_profile: boatProfile || null,
          };
        })
        .filter((wish) => {
          // If provider has no categories set, show nothing until they set up profile
          if (categories.length === 0) return false;
          
          // Match service type to provider categories
          const matchingCategories = SERVICE_TYPE_MAPPING[wish.service_type] || [];
          
          // "Other" shows to everyone
          if (wish.service_type === "Other" || matchingCategories.length === 0) {
            return true;
          }
          
          return matchingCategories.some(cat => categories.includes(cat));
        });

      // Fetch active work orders assigned to this provider
      const { data: workOrdersRaw, error: woError } = await supabase
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
          created_at,
          boat:boats(id, name, make, model, length_ft),
          quotes(id, status, base_price, total_owner_price)
        `)
        .eq("provider_id", session.user.id)
        .not("status", "eq", "completed")
        .not("status", "eq", "cancelled")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (woError) throw woError;

      // Transform work orders to expected shape (quotes is array)
      const workOrders: WorkOrderItem[] = (workOrdersRaw || []).map((wo: any) => ({
        ...wo,
        quotes: Array.isArray(wo.quotes) ? wo.quotes : wo.quotes ? [wo.quotes] : [],
      }));

      setAvailableWishes(filteredWishes as WishFormItem[]);
      setActiveWorkOrders(workOrders);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const submitQuote = async (wishId: string, quoteData: QuoteFormData) => {
    setSubmittingQuote(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // Get the wish details
      const { data: wish, error: wishError } = await supabase
        .from("wish_forms")
        .select("*, boat:boats(id, name)")
        .eq("id", wishId)
        .single();

      if (wishError) throw wishError;

      // Calculate pricing
      const basePrice = quoteData.laborCost + quoteData.materialsCost;
      const serviceFee = basePrice * 0.10; // 10% platform fee
      const totalOwnerPrice = basePrice + serviceFee;
      const totalProviderReceives = basePrice - (basePrice * 0.03); // 3% lead fee

      // Create work order first
      const { data: workOrder, error: woError } = await supabase
        .from("work_orders")
        .insert({
          boat_id: wish.boat_id,
          provider_id: session.user.id,
          title: `${wish.service_type} Service`,
          description: wish.description,
          status: "pending",
          priority: wish.urgency === "urgent" ? 3 : wish.urgency === "high" ? 2 : 1,
          is_emergency: wish.urgency === "urgent",
          scheduled_date: quoteData.estimatedCompletionDate,
          wholesale_price: basePrice,
          retail_price: totalOwnerPrice,
          escrow_status: "pending_quote",
        })
        .select()
        .single();

      if (woError) throw woError;

      // Create quote
      const { error: quoteError } = await supabase
        .from("quotes")
        .insert({
          work_order_id: workOrder.id,
          provider_id: session.user.id,
          base_price: basePrice,
          service_fee: serviceFee,
          lead_fee: basePrice * 0.03,
          total_owner_price: totalOwnerPrice,
          total_provider_receives: totalProviderReceives,
          notes: quoteData.notes || null,
          status: "pending",
          is_emergency: wish.urgency === "urgent",
        });

      if (quoteError) throw quoteError;

      // Update wish status to indicate quote is pending
      const { error: updateError } = await supabase
        .from("wish_forms")
        .update({ status: "reviewed" })
        .eq("id", wishId);

      if (updateError) throw updateError;

      toast({ 
        title: "Quote submitted!", 
        description: "The boat owner has been notified." 
      });
      await fetchJobs();
      return true;
    } catch (error: any) {
      console.error("Error submitting quote:", error);
      toast({ 
        title: "Error submitting quote", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    } finally {
      setSubmittingQuote(false);
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
    providerCategories,
    loading,
    submittingQuote,
    submitQuote,
    updateWorkOrderStatus,
    refetch: fetchJobs,
  };
}
