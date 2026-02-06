import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Provider profile data now comes from the unified businesses table
export interface ProviderProfile {
  id: string;
  owner_id: string;
  business_name: string;
  service_categories: string[];
  insurance_doc_url: string | null;
  insurance_expiry: string | null;
  bio: string | null;
  primary_contact_phone: string | null;
  hourly_rate: number | null;
  rate_per_foot: number | null;
  diagnostic_fee: number | null;
  is_verified: boolean;
  is_available: boolean;
  rates_agreed: boolean;
  created_at: string;
  updated_at: string;
}

const SERVICE_CATEGORIES = [
  "Engine Repair",
  "Hull Cleaning",
  "Electronics",
  "Rigging",
  "Canvas Work",
  "Detailing",
  "Bottom Painting",
  "Mechanical",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Fiberglass Repair",
] as const;

export function useProviderProfile() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Check if user is platform admin
      const { data: adminCheck } = await supabase.rpc("is_platform_admin");
      setIsAdmin(adminCheck === true);

      // Fetch from businesses table (unified schema)
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Map businesses table to provider profile interface
        setProfile({
          id: data.id,
          owner_id: data.owner_id,
          business_name: data.business_name,
          service_categories: data.service_categories || [],
          insurance_doc_url: data.insurance_doc_url,
          insurance_expiry: data.insurance_expiry,
          bio: data.description,
          primary_contact_phone: data.contact_phone,
          hourly_rate: data.hourly_rate,
          rate_per_foot: data.rate_per_foot,
          diagnostic_fee: data.diagnostic_fee,
          is_verified: data.is_verified || false,
          is_available: true, // Business availability is always true when profile exists
          rates_agreed: true, // Rates are always agreed when profile exists
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error("Error fetching provider profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const createProfile = async (profileData: Partial<ProviderProfile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase
        .from("businesses")
        .insert({
          owner_id: session.user.id,
          business_name: profileData.business_name || "My Business",
          service_categories: profileData.service_categories || [],
          description: profileData.bio || null,
          contact_phone: profileData.primary_contact_phone || null,
          hourly_rate: profileData.hourly_rate || null,
          rate_per_foot: profileData.rate_per_foot || null,
          diagnostic_fee: profileData.diagnostic_fee || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setProfile({
        id: data.id,
        owner_id: data.owner_id,
        business_name: data.business_name,
        service_categories: data.service_categories || [],
        insurance_doc_url: data.insurance_doc_url,
        insurance_expiry: data.insurance_expiry,
        bio: data.description,
        primary_contact_phone: data.contact_phone,
        hourly_rate: data.hourly_rate,
        rate_per_foot: data.rate_per_foot,
        diagnostic_fee: data.diagnostic_fee,
        is_verified: data.is_verified || false,
        is_available: true,
        rates_agreed: true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      
      toast({ title: "Profile created successfully!" });
      return true;
    } catch (error: any) {
      console.error("Error creating provider profile:", error);
      toast({ title: "Error creating profile", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const updateProfile = async (updates: Partial<ProviderProfile>) => {
    if (!profile) return false;

    try {
      const updateData: Record<string, unknown> = {
        business_name: updates.business_name,
        service_categories: updates.service_categories,
        description: updates.bio,
        contact_phone: updates.primary_contact_phone,
        hourly_rate: updates.hourly_rate,
        rate_per_foot: updates.rate_per_foot,
        diagnostic_fee: updates.diagnostic_fee,
      };

      const { data, error } = await supabase
        .from("businesses")
        .update(updateData)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile({
        id: data.id,
        owner_id: data.owner_id,
        business_name: data.business_name,
        service_categories: data.service_categories || [],
        insurance_doc_url: data.insurance_doc_url,
        insurance_expiry: data.insurance_expiry,
        bio: data.description,
        primary_contact_phone: data.contact_phone,
        hourly_rate: data.hourly_rate,
        rate_per_foot: data.rate_per_foot,
        diagnostic_fee: data.diagnostic_fee,
        is_verified: data.is_verified || false,
        is_available: true,
        rates_agreed: true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      
      toast({ title: "Profile updated successfully!" });
      return true;
    } catch (error: any) {
      console.error("Error updating provider profile:", error);
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
      return false;
    }
  };

  // Admin-only function to update rates
  const adminUpdateRates = async (businessId: string, rates: { hourly_rate?: number; rate_per_foot?: number; diagnostic_fee?: number }) => {
    if (!isAdmin) {
      toast({ title: "Unauthorized", description: "Only admins can update locked rates", variant: "destructive" });
      return false;
    }

    try {
      const { error } = await supabase
        .from("businesses")
        .update(rates)
        .eq("id", businessId);

      if (error) throw error;
      toast({ title: "Rates updated successfully!" });
      await fetchProfile();
      return true;
    } catch (error: any) {
      console.error("Error updating rates:", error);
      toast({ title: "Error updating rates", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const toggleAvailability = async () => {
    // Availability toggle - now a no-op since business is always available when profile exists
    // This could be enhanced to toggle a specific business flag if needed
    return;
  };

  return {
    profile,
    loading,
    isAdmin,
    areRatesLocked: false, // Rates locking now handled at business level
    createProfile,
    updateProfile,
    adminUpdateRates,
    toggleAvailability,
    refetch: fetchProfile,
    SERVICE_CATEGORIES,
  };
}
