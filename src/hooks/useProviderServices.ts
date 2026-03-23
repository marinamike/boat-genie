import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PricingModel = "per_foot" | "flat_rate" | "per_hour";

export interface ProviderService {
  id: string;
  provider_id: string;
  service_name: string;
  pricing_model: PricingModel;
  price: number;
  description: string | null;
  category: string;
  is_active: boolean;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export type NewProviderService = Omit<ProviderService, "id" | "provider_id" | "is_locked" | "locked_at" | "created_at" | "updated_at">;

const SERVICE_CATEGORIES = [
  "Wash & Detail",
  "Mechanical",
  "Electronics",
  "Canvas & Upholstery",
  "Fiberglass & Gelcoat",
  "Bottom Work",
  "Captain/Crew",
  "General",
] as const;

export function useProviderServices(providerId?: string) {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: adminCheck } = await supabase.rpc("is_admin");
      setIsAdmin(adminCheck === true);

      // If providerId is provided, fetch that provider's services
      // Otherwise, fetch current user's provider services
      let query = supabase.from("provider_services").select("*");
      
      if (providerId) {
        query = query.eq("provider_id", providerId);
      } else {
        // Get current user's business profile first
        const { data: profile } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", session.user.id)
          .maybeSingle();

        if (!profile) {
          setLoading(false);
          return;
        }
        query = query.eq("provider_id", profile.id);
      }

      const { data, error } = await query.order("category").order("service_name");

      if (error) throw error;
      
      // Cast the pricing_model to our type
      const typedServices = (data || []).map(service => ({
        ...service,
        pricing_model: service.pricing_model as PricingModel
      }));
      
      setServices(typedServices);
    } catch (error) {
      console.error("Error fetching provider services:", error);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = async (serviceData: NewProviderService) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // Get business profile ID
      const { data: profile } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (!profile) throw new Error("Business profile not found");

      const { error } = await supabase
        .from("provider_services")
        .insert({
          provider_id: profile.id,
          service_name: serviceData.service_name,
          pricing_model: serviceData.pricing_model,
          price: serviceData.price,
          description: serviceData.description,
          category: serviceData.category,
          is_active: serviceData.is_active,
        });

      if (error) throw error;

      toast({ title: "Service added successfully!" });
      await fetchServices();
      return true;
    } catch (error: any) {
      console.error("Error adding service:", error);
      toast({ title: "Error adding service", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateService = async (serviceId: string, updates: Partial<ProviderService>) => {
    setSaving(true);
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) throw new Error("Service not found");

      // If service is locked and user is not admin, prevent price changes
      if (service.is_locked && !isAdmin) {
        if (updates.price !== undefined && updates.price !== service.price) {
          toast({ 
            title: "Price is locked", 
            description: "Contact Boat Genie Support to update locked prices.", 
            variant: "destructive" 
          });
          return false;
        }
        // Remove price from updates if locked
        delete updates.price;
        delete updates.pricing_model;
      }

      const { error } = await supabase
        .from("provider_services")
        .update(updates)
        .eq("id", serviceId);

      if (error) throw error;

      toast({ title: "Service updated!" });
      await fetchServices();
      return true;
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast({ title: "Error updating service", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const lockService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("provider_services")
        .update({ 
          is_locked: true, 
          locked_at: new Date().toISOString() 
        })
        .eq("id", serviceId);

      if (error) throw error;

      toast({ title: "Service pricing locked!" });
      await fetchServices();
      return true;
    } catch (error: any) {
      console.error("Error locking service:", error);
      toast({ title: "Error locking service", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const lockAllServices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data: profile } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (!profile) return false;

      const { error } = await supabase
        .from("provider_services")
        .update({ 
          is_locked: true, 
          locked_at: new Date().toISOString() 
        })
        .eq("provider_id", profile.id)
        .eq("is_locked", false);

      if (error) throw error;

      await fetchServices();
      return true;
    } catch (error: any) {
      console.error("Error locking services:", error);
      return false;
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (service?.is_locked && !isAdmin) {
        toast({ 
          title: "Cannot delete locked service", 
          description: "Contact Boat Genie Support to remove locked services.", 
          variant: "destructive" 
        });
        return false;
      }

      const { error } = await supabase
        .from("provider_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      toast({ title: "Service deleted!" });
      await fetchServices();
      return true;
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast({ title: "Error deleting service", description: error.message, variant: "destructive" });
      return false;
    }
  };

  // Calculate price based on service and boat length or hours
  const calculatePrice = (service: ProviderService, boatLengthFt?: number, hours?: number): number => {
    if (service.pricing_model === "flat_rate") {
      return service.price;
    }
    if (service.pricing_model === "per_hour") {
      return service.price * (hours || 1);
    }
    return service.price * (boatLengthFt || 0);
  };

  return {
    services,
    loading,
    saving,
    isAdmin,
    addService,
    updateService,
    lockService,
    lockAllServices,
    deleteService,
    calculatePrice,
    refetch: fetchServices,
    SERVICE_CATEGORIES,
  };
}

// Hook to fetch all available services across providers for owner view
export function useAllProviderServices(category?: string) {
  const [services, setServices] = useState<(ProviderService & { provider?: { business_name: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        let query = supabase
          .from("provider_services")
          .select(`
            *,
            provider:businesses(business_name)
          `)
          .eq("is_active", true)
          .order("price");

        if (category) {
          query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        const typedServices = (data || []).map(service => ({
          ...service,
          pricing_model: service.pricing_model as PricingModel,
          provider: Array.isArray(service.provider) ? service.provider[0] : service.provider
        }));
        
        setServices(typedServices);
      } catch (error) {
        console.error("Error fetching all services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [category]);

  return { services, loading };
}
