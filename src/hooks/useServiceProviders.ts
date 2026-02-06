import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceProvider {
  id: string;
  business_name: string;
  rating: number | null;
  base_price: number | null;
  pricing_model: "per_foot" | "flat_rate" | "per_hour" | null;
  service_count: number;
  logo_url: string | null;
  categories: string[];
}

// Fetch verified businesses that have services matching the category
export function useServiceProviders(category?: string) {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    if (!category) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Map category to provider service category
      const categoryMap: Record<string, string> = {
        "wash_detail": "Wash & Detail",
        "mechanical": "Mechanical",
        "visual_cosmetic": "Fiberglass & Gelcoat",
      };
      
      const serviceCategory = categoryMap[category] || category;

      // Fetch provider profiles that have matching active services
      const { data: services, error } = await supabase
        .from("provider_services")
        .select(`
          id,
          provider_id,
          service_name,
          pricing_model,
          price,
          category,
          provider:provider_profiles(
            id,
            business_name,
            logo_url,
            is_available
          )
        `)
        .eq("is_active", true)
        .or(`category.eq.${serviceCategory},pricing_model.eq.per_foot`);

      if (error) throw error;

      // Group by provider and find min price
      const providerMap = new Map<string, ServiceProvider>();
      
      for (const service of services || []) {
        const provider = Array.isArray(service.provider) 
          ? service.provider[0] 
          : service.provider;
        
        if (!provider || !provider.business_name) continue;
        
        const existing = providerMap.get(provider.id);
        
        if (existing) {
          // Update if this price is lower
          if (service.price < (existing.base_price || Infinity)) {
            existing.base_price = service.price;
            existing.pricing_model = service.pricing_model as ServiceProvider["pricing_model"];
          }
          existing.service_count++;
          if (!existing.categories.includes(service.category)) {
            existing.categories.push(service.category);
          }
        } else {
          providerMap.set(provider.id, {
            id: provider.id,
            business_name: provider.business_name,
            rating: null, // Will be populated from reviews if available
            base_price: service.price,
            pricing_model: service.pricing_model as ServiceProvider["pricing_model"],
            service_count: 1,
            logo_url: provider.logo_url,
            categories: [service.category],
          });
        }
      }

      setProviders(Array.from(providerMap.values()));
    } catch (error) {
      console.error("Error fetching service providers:", error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return { providers, loading, refetch: fetchProviders };
}

// Fetch services for a specific provider
export function useProviderServicesByBusiness(providerId?: string, category?: string) {
  const [services, setServices] = useState<Array<{
    id: string;
    service_name: string;
    pricing_model: "per_foot" | "flat_rate" | "per_hour";
    price: number;
    description: string | null;
    category: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      if (!providerId) {
        setServices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from("provider_services")
          .select("id, service_name, pricing_model, price, description, category")
          .eq("provider_id", providerId)
          .eq("is_active", true);
        
        if (category) {
          const categoryMap: Record<string, string> = {
            "wash_detail": "Wash & Detail",
            "mechanical": "Mechanical",
            "visual_cosmetic": "Fiberglass & Gelcoat",
          };
          query = query.eq("category", categoryMap[category] || category);
        }

        const { data, error } = await query.order("price");

        if (error) throw error;
        
        setServices((data || []).map(s => ({
          ...s,
          pricing_model: s.pricing_model as "per_foot" | "flat_rate" | "per_hour"
        })));
      } catch (error) {
        console.error("Error fetching provider services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [providerId, category]);

  return { services, loading };
}
