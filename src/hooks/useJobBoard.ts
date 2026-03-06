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
  is_emergency: boolean;
  calculated_price: number | null;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    year: number | null;
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
  materialsDeposit: number;
  estimatedCompletionDate: string;
  estimatedArrivalTime?: string;
  notes?: string;
}

// Category slug → label mapping for matching wishes to service menu categories
const CATEGORY_LABELS: Record<string, string> = {
  wash_detail: "wash & detail",
  mechanical: "mechanical",
  electrical: "electrical",
  hull_bottom: "hull & bottom",
  canvas_upholstery: "canvas & upholstery",
  rigging: "rigging",
  general: "general",
};

// Normalize service name for matching (case-insensitive, partial match)
function normalizeServiceName(name: string): string {
  return name.toLowerCase().trim();
}

// Check if a wish service type matches any provider service name or category
function matchesProviderService(
  wishServiceType: string,
  providerServiceNames: string[],
  providerCategories: string[]
): boolean {
  const normalizedWish = normalizeServiceName(wishServiceType);
  
  if (normalizedWish === "other" || !normalizedWish) {
    return providerServiceNames.length > 0;
  }

  // Check if the wish category slug maps to a category the provider offers
  const wishCategoryLabel = CATEGORY_LABELS[normalizedWish];
  if (wishCategoryLabel && providerCategories.some(c => normalizeServiceName(c) === wishCategoryLabel)) {
    return true;
  }
  
  // Also match against individual service names (partial/exact)
  return providerServiceNames.some(service => {
    const normalizedService = normalizeServiceName(service);
    return normalizedService === normalizedWish ||
           normalizedService.includes(normalizedWish) ||
           normalizedWish.includes(normalizedService);
  });
}

export function useJobBoard() {
  const [availableWishes, setAvailableWishes] = useState<WishFormItem[]>([]);
  const [pendingQuotedWishes, setPendingQuotedWishes] = useState<WishFormItem[]>([]);
  const [activeWorkOrders, setActiveWorkOrders] = useState<WorkOrderItem[]>([]);
  const [providerCategories, setProviderCategories] = useState<string[]>([]);
  const [providerServiceNames, setProviderServiceNames] = useState<string[]>([]);
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

      // Fetch business profile for service categories (from unified businesses table)
      const { data: businessProfile } = await supabase
        .from("businesses")
        .select("id, service_categories, hourly_rate, rate_per_foot, diagnostic_fee")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      const categories = businessProfile?.service_categories || [];
      setProviderCategories(categories);

      // Fetch provider's actual Service Menu items from business_service_menu
      let serviceNames: string[] = [];
      let menuCategories: string[] = [];
      if (businessProfile?.id) {
        const { data: menuItems } = await supabase
          .from("business_service_menu")
          .select("name, category")
          .eq("business_id", businessProfile.id)
          .eq("is_active", true);
        
        serviceNames = (menuItems || []).map(s => s.name);
        menuCategories = [...new Set((menuItems || []).map(s => s.category))];
      }
      setProviderServiceNames(serviceNames);

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
          is_emergency,
          calculated_price,
          boat:boats(
            id, 
            name, 
            make, 
            model,
            year,
            length_ft, 
            image_url,
            boat_profiles(marina_name, slip_number)
          )
        `)
        .in("status", ["submitted", "reviewed", "approved"])
        .order("created_at", { ascending: false });

      if (wishError) throw wishError;

      // Filter wishes by provider's Service Menu
      const filteredWishes = (wishes || [])
        .map((wish) => {
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
          if (serviceNames.length === 0) return false;
          return matchesProviderService(wish.service_type, serviceNames, menuCategories);
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
          quotes:quotes!quotes_work_order_id_fkey(id, status, base_price, total_owner_price)
        `)
        .eq("provider_id", session.user.id)
        .not("status", "eq", "completed")
        .not("status", "eq", "cancelled")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (woError) throw woError;

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

      const { data: wish, error: wishError } = await supabase
        .from("wish_forms")
        .select("*, boat:boats(id, name)")
        .eq("id", wishId)
        .single();

      if (wishError) throw wishError;

      // Get provider's current rates from businesses table
      const { data: businessProfile, error: profileError } = await supabase
        .from("businesses")
        .select("hourly_rate, rate_per_foot, diagnostic_fee")
        .eq("owner_id", session.user.id)
        .single();

      if (profileError) throw profileError;

      const basePrice = quoteData.laborCost + quoteData.materialsCost;
      const serviceFee = basePrice * 0.10;
      const totalOwnerPrice = basePrice + serviceFee;
      const totalProviderReceives = basePrice - (basePrice * 0.03);

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
          estimated_arrival_time: quoteData.estimatedArrivalTime || null,
          wholesale_price: basePrice,
          retail_price: totalOwnerPrice,
          escrow_status: "pending_quote",
          provider_hourly_rate: businessProfile.hourly_rate,
          provider_rate_per_foot: businessProfile.rate_per_foot,
          provider_diagnostic_fee: businessProfile.diagnostic_fee,
        })
        .select()
        .single();

      if (woError) throw woError;

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
          materials_deposit: quoteData.materialsDeposit || 0,
          notes: quoteData.notes || null,
          status: "pending",
          is_emergency: wish.urgency === "urgent",
          provider_hourly_rate: businessProfile.hourly_rate,
          provider_rate_per_foot: businessProfile.rate_per_foot,
          provider_diagnostic_fee: businessProfile.diagnostic_fee,
        });

      if (quoteError) throw quoteError;

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
    providerServiceNames,
    loading,
    submittingQuote,
    submitQuote,
    updateWorkOrderStatus,
    refetch: fetchJobs,
  };
}
