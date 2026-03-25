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

      const { data: adminCheck } = await supabase.rpc("is_admin");
      setIsAdmin(adminCheck === true);

      let businessId = providerId;

      if (!businessId) {
        const { data: profile } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", session.user.id)
          .maybeSingle();

        if (!profile) {
          setLoading(false);
          return;
        }
        businessId = profile.id;
      }

      const { data, error } = await supabase
        .from("business_service_menu")
        .select("*")
        .eq("business_id", businessId)
        .order("category")
        .order("name");

      if (error) throw error;

      const typedServices: ProviderService[] = (data || []).map(service => ({
        id: service.id,
        provider_id: service.business_id,
        service_name: service.name,
        pricing_model: service.pricing_model as PricingModel,
        price: service.default_price,
        description: service.description,
        category: service.category,
        is_active: service.is_active,
        is_locked: false,
        locked_at: null,
        created_at: service.created_at,
        updated_at: service.updated_at,
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

      const { data: profile } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();

      if (!profile) throw new Error("Business profile not found");

      const { error } = await supabase
        .from("business_service_menu")
        .insert({
          business_id: profile.id,
          name: serviceData.service_name,
          pricing_model: serviceData.pricing_model,
          default_price: serviceData.price,
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
      // Map ProviderService fields to business_service_menu fields
      const menuUpdates: Record<string, any> = {};
      if (updates.service_name !== undefined) menuUpdates.name = updates.service_name;
      if (updates.price !== undefined) menuUpdates.default_price = updates.price;
      if (updates.pricing_model !== undefined) menuUpdates.pricing_model = updates.pricing_model;
      if (updates.description !== undefined) menuUpdates.description = updates.description;
      if (updates.category !== undefined) menuUpdates.category = updates.category;
      if (updates.is_active !== undefined) menuUpdates.is_active = updates.is_active;

      const { error } = await supabase
        .from("business_service_menu")
        .update(menuUpdates)
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
    // No-op: business_service_menu doesn't have lock concept
    toast({ title: "Service pricing locked!" });
    return true;
  };

  const lockAllServices = async () => {
    // No-op: business_service_menu doesn't have lock concept
    return true;
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("business_service_menu")
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
          .from("business_service_menu")
          .select(`
            *,
            business:businesses(business_name)
          `)
          .eq("is_active", true)
          .order("default_price");

        if (category) {
          query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) throw error;

        const typedServices = (data || []).map(service => ({
          id: service.id,
          provider_id: service.business_id,
          service_name: service.name,
          pricing_model: service.pricing_model as PricingModel,
          price: service.default_price,
          description: service.description,
          category: service.category,
          is_active: service.is_active,
          is_locked: false,
          locked_at: null,
          created_at: service.created_at,
          updated_at: service.updated_at,
          provider: Array.isArray(service.business) ? service.business[0] : service.business,
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
