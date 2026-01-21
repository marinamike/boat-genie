import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  service_categories: string[];
  insurance_doc_url: string | null;
  insurance_expiry: string | null;
  bio: string | null;
  hourly_rate: number | null;
  rate_per_foot: number | null;
  diagnostic_fee: number | null;
  rates_locked_at: string | null;
  rates_agreed: boolean;
  is_available: boolean;
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

      // Check if user is admin
      const { data: adminCheck } = await supabase.rpc("is_admin");
      setIsAdmin(adminCheck === true);

      const { data, error } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching provider profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Check if rates are locked (profile is active with rates_agreed = true)
  const areRatesLocked = profile?.rates_agreed === true && profile?.rates_locked_at !== null;

  const createProfile = async (profileData: Partial<ProviderProfile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase
        .from("provider_profiles")
        .insert({
          user_id: session.user.id,
          business_name: profileData.business_name || null,
          service_categories: profileData.service_categories || [],
          bio: profileData.bio || null,
          hourly_rate: profileData.hourly_rate || null,
          rate_per_foot: profileData.rate_per_foot || null,
          diagnostic_fee: profileData.diagnostic_fee || null,
          is_available: profileData.is_available ?? true,
          rates_agreed: profileData.rates_agreed ?? false,
          rates_locked_at: profileData.rates_agreed ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
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
      // If rates are locked and user is not admin, prevent rate changes
      const ratesLocked = profile.rates_agreed && profile.rates_locked_at;
      
      const updateData: Record<string, unknown> = {
        business_name: updates.business_name,
        service_categories: updates.service_categories,
        bio: updates.bio,
        is_available: updates.is_available,
      };

      // Only allow rate updates if rates are not locked OR user is admin
      if (!ratesLocked || isAdmin) {
        updateData.hourly_rate = updates.hourly_rate;
        updateData.rate_per_foot = updates.rate_per_foot;
        updateData.diagnostic_fee = updates.diagnostic_fee;
        
        // If agreeing to rates for first time, lock them
        if (updates.rates_agreed && !profile.rates_agreed) {
          updateData.rates_agreed = true;
          updateData.rates_locked_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from("provider_profiles")
        .update(updateData)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      toast({ title: "Profile updated successfully!" });
      return true;
    } catch (error: any) {
      console.error("Error updating provider profile:", error);
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
      return false;
    }
  };

  // Admin-only function to update locked rates
  const adminUpdateRates = async (providerId: string, rates: { hourly_rate?: number; rate_per_foot?: number; diagnostic_fee?: number }) => {
    if (!isAdmin) {
      toast({ title: "Unauthorized", description: "Only admins can update locked rates", variant: "destructive" });
      return false;
    }

    try {
      const { error } = await supabase
        .from("provider_profiles")
        .update(rates)
        .eq("id", providerId);

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
    if (!profile) return;
    await updateProfile({ is_available: !profile.is_available });
  };

  return {
    profile,
    loading,
    isAdmin,
    areRatesLocked,
    createProfile,
    updateProfile,
    adminUpdateRates,
    toggleAvailability,
    refetch: fetchProfile,
    SERVICE_CATEGORIES,
  };
}
