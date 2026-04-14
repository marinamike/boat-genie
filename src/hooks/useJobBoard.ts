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

export interface QuoteLineItem {
  name: string;
  pricingModel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isCustom?: boolean;
}

export interface QuoteFormData {
  lineItems: QuoteLineItem[];
  totalAmount: number;
  estimatedCompletionDate: string;
  estimatedArrivalTime?: string;
  notes?: string;
}

// Check if a wish matches any provider service name or category
function matchesProviderService(
  wishServiceCategory: string | null,
  wishServiceType: string,
  providerServiceNames: string[],
  providerCategories: string[]
): boolean {
  // Match by service_category (new catalog-driven wishes)
  if (wishServiceCategory) {
    const normalizedWishCat = wishServiceCategory.toLowerCase().trim();
    if (providerCategories.some(c => c.toLowerCase().trim() === normalizedWishCat)) {
      return true;
    }
  }

  // Fallback: match by service_type against service names (legacy wishes)
  const normalizedWish = wishServiceType.toLowerCase().trim();
  if (normalizedWish === "other" || normalizedWish === "custom request" || !normalizedWish) {
    return providerServiceNames.length > 0;
  }

  return providerServiceNames.some(service => {
    const ns = service.toLowerCase().trim();
    return ns === normalizedWish || ns.includes(normalizedWish) || normalizedWish.includes(ns);
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

      // Fetch open wishes (available for any provider)
      const { data: wishes, error: wishError } = await supabase
        .from("wish_forms")
        .select(`
          id,
          service_type,
          service_category,
          service_name,
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
        .in("status", ["open"])
        .order("created_at", { ascending: false });

      if (wishError) throw wishError;

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
        .filter((wish) =>
          matchesProviderService(wish.service_category, wish.service_type, serviceNames, menuCategories)
        );

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
        .eq("business_id", businessProfile?.id ?? "")
        .not("status", "eq", "completed")
        .not("status", "eq", "cancelled")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (woError) throw woError;

      const workOrders: WorkOrderItem[] = (workOrdersRaw || []).map((wo: any) => ({
        ...wo,
        quotes: Array.isArray(wo.quotes) ? wo.quotes : wo.quotes ? [wo.quotes] : [],
      }));

      // Fetch wish IDs that this business has already quoted
      const wishIds = (filteredWishes as WishFormItem[]).map(w => w.id);
      let quotedWishIds = new Set<string>();
      if (wishIds.length > 0) {
        const { data: quotedOrders } = await supabase
          .from("work_orders")
          .select("wish_form_id")
          .eq("business_id", businessProfile?.id ?? "")
          .in("wish_form_id", wishIds);

        quotedWishIds = new Set(
          (quotedOrders || []).map(wo => wo.wish_form_id).filter(Boolean) as string[]
        );
      }

      // Split into new leads vs pending quoted leads
      const newLeads = (filteredWishes as WishFormItem[]).filter(
        w => !quotedWishIds.has(w.id)
      );
      const pendingLeads = (filteredWishes as WishFormItem[]).filter(
        w => quotedWishIds.has(w.id)
      );

      setAvailableWishes(newLeads);
      setPendingQuotedWishes(pendingLeads);
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
      const { data: businessProfileForQuote, error: profileError } = await supabase
        .from("businesses")
        .select("id, hourly_rate, rate_per_foot, diagnostic_fee")
        .eq("owner_id", session.user.id)
        .single();

      if (profileError) throw profileError;
      const bizId = businessProfileForQuote.id;

      const basePrice = quoteData.totalAmount;
      const totalOwnerPrice = basePrice;
      const totalProviderReceives = basePrice;

      // Use service_name from wish if available, fall back to service_type
      const wishTitle = (wish as any).service_name || wish.service_type;

      const { data: workOrder, error: woError } = await supabase
        .from("work_orders")
        .insert({
          boat_id: wish.boat_id,
          provider_id: session.user.id,
          business_id: bizId,
          wish_form_id: wishId,
          title: wishTitle,
          description: wish.description,
          status: "pending",
          priority: wish.urgency === "urgent" ? 3 : wish.urgency === "high" ? 2 : 1,
          is_emergency: wish.urgency === "urgent",
          scheduled_date: quoteData.estimatedCompletionDate,
          estimated_arrival_time: quoteData.estimatedArrivalTime || null,
          wholesale_price: basePrice,
          retail_price: totalOwnerPrice,
          escrow_status: "pending_quote",
          provider_hourly_rate: businessProfileForQuote.hourly_rate,
          provider_rate_per_foot: businessProfileForQuote.rate_per_foot,
          provider_diagnostic_fee: businessProfileForQuote.diagnostic_fee,
        })
        .select()
        .single();

      if (woError) throw woError;

      // Insert line items into work_order_line_items
      if (quoteData.lineItems.length > 0) {
        const { error: liError } = await supabase
          .from("work_order_line_items")
          .insert(
            quoteData.lineItems.map((item) => ({
              work_order_id: workOrder.id,
              service_name: item.name,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: item.lineTotal,
            }))
          );
        if (liError) console.error("Error inserting line items:", liError);
      }

      const { error: quoteError } = await supabase
        .from("quotes")
        .insert({
          work_order_id: workOrder.id,
          provider_id: session.user.id,
          business_id: bizId,
          base_price: basePrice,
          service_fee: 0,
          lead_fee: 0,
          total_owner_price: totalOwnerPrice,
          total_provider_receives: totalProviderReceives,
          materials_deposit: 0,
          notes: quoteData.notes || null,
          status: "pending",
          is_emergency: wish.urgency === "urgent",
          provider_hourly_rate: businessProfileForQuote.hourly_rate,
          provider_rate_per_foot: businessProfileForQuote.rate_per_foot,
          provider_diagnostic_fee: businessProfileForQuote.diagnostic_fee,
        });

      if (quoteError) throw quoteError;

      // Wish stays "open" until owner accepts a quote

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
    pendingQuotedWishes,
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
