import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";

export interface ServiceMenuItem {
  id: string;
  business_id: string;
  name: string;
  category: string;
  pricing_model: string;
  default_price: number;
  description: string | null;
  is_active: boolean;
  min_length: number | null;
  max_length: number | null;
  created_at: string;
  updated_at: string;
}

export const SERVICE_MENU_CATEGORIES = [
  "Detailing & Cleaning",
  "Engines & Propulsion",
  "Electrical & Electronics",
  "Hull, Bottom & Deck",
  "Plumbing & Water Systems",
  "Canvas, Upholstery & Interior",
  "Rigging & Sails",
  "Stabilizers & Steering",
  "Custom Request",
];

export const PRICING_MODELS = [
  { value: "fixed", label: "Fixed Price" },
  { value: "hourly", label: "Hourly Rate" },
  { value: "per_foot", label: "Per Foot" },
  { value: "diagnostic_fee", label: "Diagnostic Fee" },
] as const;

export function useServiceMenu() {
  const { business } = useBusiness();
  const [menuItems, setMenuItems] = useState<ServiceMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenuItems = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("business_service_menu")
      .select("*")
      .eq("business_id", business.id)
      .order("category")
      .order("name");
    if (error) console.error("Error fetching service menu:", error);
    else setMenuItems(data || []);
    setLoading(false);
  }, [business?.id]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const fetchCatalogServices = async (category: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("service_catalog")
      .select("name")
      .eq("category", category)
      .order("name");
    if (error) {
      console.error("Error fetching catalog services:", error);
      return [];
    }
    return (data || []).map((d) => d.name);
  };

  const createMenuItem = async (item: Partial<ServiceMenuItem>) => {
    if (!business?.id) return null;
    const { data, error } = await supabase
      .from("business_service_menu")
      .insert({ ...item, business_id: business.id } as any)
      .select()
      .single();
    if (error) {
      toast.error("Failed to create service item: " + error.message);
      return null;
    }
    toast.success("Service item created");
    await fetchMenuItems();
    return data;
  };

  const updateMenuItem = async (id: string, item: Partial<ServiceMenuItem>) => {
    const { error } = await supabase
      .from("business_service_menu")
      .update(item as any)
      .eq("id", id);
    if (error) {
      toast.error("Failed to update service item: " + error.message);
      return false;
    }
    toast.success("Service item updated");
    await fetchMenuItems();
    return true;
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("business_service_menu")
      .update({ is_active: !isActive } as any)
      .eq("id", id);
    if (error) {
      toast.error("Failed to update service item");
      return false;
    }
    toast.success(isActive ? "Service item deactivated" : "Service item activated");
    await fetchMenuItems();
    return true;
  };

  const activeMenuItems = menuItems.filter((i) => i.is_active);

  return {
    menuItems,
    activeMenuItems,
    loading,
    createMenuItem,
    updateMenuItem,
    toggleActive,
    fetchMenuItems,
    fetchCatalogServices,
  };
}
