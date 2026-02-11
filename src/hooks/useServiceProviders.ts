import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/hooks/useWishForm";

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
export function useServiceProviders(category?: ServiceCategory) {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    if (!category) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const serviceCategory = SERVICE_CATEGORIES[category].label;

      // Query business_service_menu joined with businesses
      const { data: menuItems, error } = await supabase
        .from("business_service_menu")
        .select(`
          id,
          business_id,
          name,
          pricing_model,
          default_price,
          category,
          business:businesses(
            id,
            business_name,
            logo_url,
            is_verified
          )
        `)
        .eq("is_active", true)
        .eq("category", serviceCategory);

      if (error) throw error;

      // Group by business and find min price
      const providerMap = new Map<string, ServiceProvider>();
      
      for (const item of menuItems || []) {
        const business = Array.isArray(item.business) 
          ? item.business[0] 
          : item.business;
        
        if (!business || !business.business_name) continue;
        
        const existing = providerMap.get(business.id);
        
        if (existing) {
          if (item.default_price < (existing.base_price || Infinity)) {
            existing.base_price = item.default_price;
            existing.pricing_model = item.pricing_model as ServiceProvider["pricing_model"];
          }
          existing.service_count++;
          if (!existing.categories.includes(item.category)) {
            existing.categories.push(item.category);
          }
        } else {
          providerMap.set(business.id, {
            id: business.id,
            business_name: business.business_name,
            rating: null,
            base_price: item.default_price,
            pricing_model: item.pricing_model as ServiceProvider["pricing_model"],
            service_count: 1,
            logo_url: business.logo_url,
            categories: [item.category],
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

// Fetch services for a specific business
export function useProviderServicesByBusiness(businessId?: string, category?: ServiceCategory) {
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
      if (!businessId) {
        setServices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from("business_service_menu")
          .select("id, name, pricing_model, default_price, description, category")
          .eq("business_id", businessId)
          .eq("is_active", true);
        
        if (category) {
          query = query.eq("category", SERVICE_CATEGORIES[category].label);
        }

        const { data, error } = await query.order("default_price");

        if (error) throw error;
        
        // Map field names to match the expected interface
        setServices((data || []).map(s => ({
          id: s.id,
          service_name: s.name,
          pricing_model: s.pricing_model as "per_foot" | "flat_rate" | "per_hour",
          price: s.default_price,
          description: s.description,
          category: s.category,
        })));
      } catch (error) {
        console.error("Error fetching provider services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [businessId, category]);

  return { services, loading };
}
