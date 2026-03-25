import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/pricing";

export interface ExistingCustomer {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  isGuest: boolean;
  guestCustomerId?: string;
  boats: {
    id: string;
    name: string;
    lengthFt: number | null;
    make: string | null;
    model: string | null;
  }[];
}

export interface NewCustomerData {
  ownerName: string;
  ownerEmail: string;
  boatName: string;
  boatLengthFt: number | null;
}

export interface ProviderServiceOption {
  id: string;
  serviceName: string;
  pricingModel: "per_foot" | "flat_rate" | "hourly";
  price: number;
  category: string;
  description: string | null;
}

export interface WorkOrderQuote {
  basePrice: number;
  serviceFee: number; // 5% charged to owner
  leadFee: number; // 5% charged to provider
  totalOwnerPrice: number;
  totalProviderReceives: number;
  materialsDeposit: number;
}

export function useProviderWorkOrder() {
  const [existingCustomers, setExistingCustomers] = useState<ExistingCustomer[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderServiceOption[]>([]);
  const [providerProfile, setProviderProfile] = useState<{ id: string; business_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch provider's existing customers (owners they've worked with before)
  const fetchExistingCustomers = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get business profile
      const { data: profile } = await supabase
        .from("businesses")
        .select("id, business_name")
        .eq("owner_id", session.user.id)
        .single();

      if (!profile) return;
      setProviderProfile(profile);

      const customers: ExistingCustomer[] = [];

      // Get all work orders for this provider to find previous customers
      const { data: workOrders } = await supabase
        .from("work_orders")
        .select(`
          boat_id,
          boats!inner(
            id,
            name,
            length_ft,
            make,
            model,
            owner_id
          )
        `)
        .eq("provider_id", session.user.id);

      // Get unique owner IDs from work orders
      const ownerIds = workOrders
        ? [...new Set(workOrders.map(wo => (wo.boats as any)?.owner_id).filter(Boolean))]
        : [];

      // Get unique owner IDs
      const ownerIds = [...new Set(workOrders.map(wo => (wo.boats as any)?.owner_id).filter(Boolean))];
      
      if (ownerIds.length === 0) return;

      // Fetch owner profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds);

      if (!profiles) return;

      // Fetch all boats for these owners
      const { data: allBoats } = await supabase
        .from("boats")
        .select("id, name, length_ft, make, model, owner_id")
        .in("owner_id", ownerIds);

      // Build customer list with their boats (real users)
      const customers: ExistingCustomer[] = profiles.map(profile => ({
        ownerId: profile.id,
        ownerName: profile.full_name || profile.email || "Unknown",
        ownerEmail: profile.email || "",
        isGuest: false,
        boats: (allBoats || [])
          .filter(boat => boat.owner_id === profile.id)
          .map(boat => ({
            id: boat.id,
            name: boat.name,
            lengthFt: boat.length_ft ? Number(boat.length_ft) : null,
            make: boat.make,
            model: boat.model,
          })),
      }));

      // Also fetch guest customers for this business
      const { data: guestCustomers } = await (supabase
        .from("guest_customers" as any)
        .select("*")
        .eq("business_id", profile.id) as any) as { data: any[] | null };

      if (guestCustomers && guestCustomers.length > 0) {
        // Find boats owned by this business user that correspond to guest customers
        // Guest boats were created with owner_id = session.user.id
        const { data: guestBoats } = await supabase
          .from("boats")
          .select("id, name, length_ft, make, model, owner_id")
          .eq("owner_id", session.user.id);

        for (const gc of guestCustomers) {
          // Match guest boat by name and length
          const matchingBoat = (guestBoats || []).find(
            b => b.name === gc.boat_name &&
              (gc.boat_length_ft == null || Number(b.length_ft) === Number(gc.boat_length_ft))
          );

          customers.push({
            ownerId: gc.id, // use guest_customer id as the owner identifier
            ownerName: gc.owner_name,
            ownerEmail: gc.owner_email || "",
            isGuest: true,
            guestCustomerId: gc.id,
            boats: matchingBoat
              ? [{
                  id: matchingBoat.id,
                  name: matchingBoat.name,
                  lengthFt: matchingBoat.length_ft ? Number(matchingBoat.length_ft) : null,
                  make: matchingBoat.make,
                  model: matchingBoat.model,
                }]
              : [{
                  id: "",
                  name: gc.boat_name,
                  lengthFt: gc.boat_length_ft ? Number(gc.boat_length_ft) : null,
                  make: gc.boat_make || null,
                  model: gc.boat_model || null,
                }],
          });
        }
      }

      setExistingCustomers(customers);
    } catch (error) {
      console.error("Error fetching existing customers:", error);
    }
  }, []);

  // Fetch active services from business service menu
  const fetchProviderServices = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (!profile) return;

      const { data: services } = await supabase
        .from("business_service_menu")
        .select("*")
        .eq("business_id", profile.id)
        .eq("is_active", true)
        .order("category")
        .order("name");

      if (!services) return;

      setProviderServices(
        services.map(s => {
          const pricingModel: "per_foot" | "flat_rate" | "hourly" =
            s.pricing_model === "per_foot" ? "per_foot"
            : s.pricing_model === "hourly" ? "hourly"
            : "flat_rate";
          return {
            id: s.id,
            serviceName: s.name,
            pricingModel,
            price: Number(s.default_price),
            category: s.category,
            description: s.description,
          };
        })
      );
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchExistingCustomers(), fetchProviderServices()]);
      setLoading(false);
    };
    init();
  }, [fetchExistingCustomers, fetchProviderServices]);

  // Calculate pricing with platform fees
  const calculateQuote = (
    service: ProviderServiceOption,
    boatLengthFt: number | null,
    materialsDeposit: number = 0,
    customPrice?: number
  ): WorkOrderQuote => {
    // Base price calculation
    let basePrice: number;
    if (customPrice !== undefined) {
      basePrice = customPrice;
    } else if (service.pricingModel === "per_foot" && boatLengthFt) {
      basePrice = service.price * boatLengthFt;
    } else if (service.pricingModel === "flat_rate" || service.pricingModel === "hourly") {
      basePrice = service.price;
    } else {
      basePrice = 0;
    }

    // No platform fees for manually created work orders
    const serviceFee = 0;
    const leadFee = 0;

    const totalOwnerPrice = basePrice + materialsDeposit;
    const totalProviderReceives = basePrice;

    return {
      basePrice,
      serviceFee,
      leadFee,
      totalOwnerPrice,
      totalProviderReceives,
      materialsDeposit,
    };
  };

  // Create work order for existing customer
  const createWorkOrderForExisting = async (
    boatId: string,
    ownerId: string,
    serviceId: string,
    quote: WorkOrderQuote,
    notes?: string,
    scheduledDate?: string
  ): Promise<boolean> => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get service details
      const service = providerServices.find(s => s.id === serviceId);
      if (!service) throw new Error("Service not found");

      // Create work order with pending status (awaiting owner approval)
      const { data: workOrder, error: woError } = await supabase
        .from("work_orders")
        .insert({
          boat_id: boatId,
          provider_id: session.user.id,
          business_id: providerProfile?.id,
          title: service.serviceName,
          description: notes || `${service.serviceName} service`,
          status: "pending",
          provider_initiated: true,
          provider_service_id: serviceId,
          retail_price: quote.totalOwnerPrice,
          wholesale_price: quote.basePrice,
          service_fee: quote.serviceFee,
          lead_fee: quote.leadFee,
          materials_deposit: quote.materialsDeposit,
          scheduled_date: scheduledDate || null,
          service_type: "genie_service",
        } as any)
        .select()
        .single();

      if (woError) throw woError;

      // Create quote record
      const { error: quoteError } = await supabase
        .from("quotes")
        .insert({
          work_order_id: workOrder.id,
          provider_id: session.user.id,
          base_price: quote.basePrice,
          service_fee: quote.serviceFee,
          lead_fee: quote.leadFee,
          total_owner_price: quote.totalOwnerPrice,
          total_provider_receives: quote.totalProviderReceives,
          materials_deposit: quote.materialsDeposit,
          status: "pending",
          notes: notes,
        });

      if (quoteError) throw quoteError;

      toast({
        title: "Work Order Sent!",
        description: "The owner will be notified to approve and fund escrow.",
      });

      return true;
    } catch (error: any) {
      console.error("Error creating work order:", error);
      toast({
        title: "Error creating work order",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Create work order for new (guest) customer
  const createWorkOrderForNew = async (
    newCustomer: NewCustomerData,
    serviceId: string,
    quote: WorkOrderQuote,
    notes?: string,
    scheduledDate?: string
  ): Promise<boolean> => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !providerProfile) throw new Error("Not authenticated");

      const service = providerServices.find(s => s.id === serviceId);
      if (!service) throw new Error("Service not found");

      // 1. Create guest customer record
      const { data: guest, error: guestError } = await (supabase
        .from("guest_customers" as any)
        .insert({
          business_id: providerProfile.id,
          owner_name: newCustomer.ownerName,
          owner_email: newCustomer.ownerEmail || null,
          boat_name: newCustomer.boatName,
          boat_length_ft: newCustomer.boatLengthFt,
        }) as any)
        .select()
        .single() as { data: { id: string } | null; error: any };

      if (guestError || !guest) throw guestError || new Error("Failed to create guest customer");

      // 2. Create a boat record linked to a placeholder owner (the business owner acts as proxy)
      const { data: boat, error: boatError } = await supabase
        .from("boats")
        .insert({
          name: newCustomer.boatName,
          owner_id: session.user.id, // business owner holds the boat until guest claims
          length_ft: newCustomer.boatLengthFt,
        })
        .select()
        .single();

      if (boatError) throw boatError;

      // 3. Create work order immediately with pending_approval status
      const { data: workOrder, error: woError } = await supabase
        .from("work_orders")
        .insert({
          boat_id: boat.id,
          provider_id: session.user.id,
          business_id: providerProfile.id,
          title: service.serviceName,
          description: notes || `${service.serviceName} service`,
          status: "pending_approval",
          provider_initiated: true,
          provider_service_id: serviceId,
          retail_price: quote.totalOwnerPrice,
          wholesale_price: quote.basePrice,
          service_fee: 0,
          lead_fee: 0,
          materials_deposit: quote.materialsDeposit,
          scheduled_date: scheduledDate || null,
          service_type: "genie_service",
          guest_customer_id: guest.id,
        } as any)
        .select("*, approval_token")
        .single();

      if (woError) throw woError;

      // 4. Create quote record
      const { error: quoteError } = await supabase
        .from("quotes")
        .insert({
          work_order_id: workOrder.id,
          provider_id: session.user.id,
          base_price: quote.basePrice,
          service_fee: 0,
          lead_fee: 0,
          total_owner_price: quote.totalOwnerPrice,
          total_provider_receives: quote.totalProviderReceives,
          materials_deposit: quote.materialsDeposit,
          status: "pending",
          notes: notes,
        });

      if (quoteError) throw quoteError;

      // 5. Send approval email via edge function
      if (newCustomer.ownerEmail) {
        const { error: emailError } = await supabase.functions.invoke("send-owner-invite", {
          body: {
            providerName: providerProfile.business_name || "Service Provider",
            ownerName: newCustomer.ownerName,
            ownerEmail: newCustomer.ownerEmail,
            boatName: newCustomer.boatName,
            serviceName: service.serviceName,
            basePrice: quote.basePrice,
            materialsDeposit: quote.materialsDeposit,
            totalPrice: quote.totalOwnerPrice,
            scheduledDate: scheduledDate || undefined,
            notes: notes || undefined,
            approvalToken: (workOrder as any).approval_token,
          },
        });

        if (emailError) {
          console.warn("Email send warning:", emailError);
          // Don't fail the whole flow if email fails
        }
      }

      toast({
        title: "Work Order Created!",
        description: newCustomer.ownerEmail
          ? `Approval email sent to ${newCustomer.ownerEmail}.`
          : `Work order for ${newCustomer.ownerName} has been created.`,
      });

      return true;
    } catch (error: any) {
      console.error("Error creating guest work order:", error);
      toast({
        title: "Error creating work order",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    existingCustomers,
    providerServices,
    providerProfile,
    loading,
    submitting,
    calculateQuote,
    createWorkOrderForExisting,
    createWorkOrderForNew,
    refetch: async () => {
      await Promise.all([fetchExistingCustomers(), fetchProviderServices()]);
    },
  };
}
