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
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

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
          is_available: profileData.is_available ?? true,
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
      const { data, error } = await supabase
        .from("provider_profiles")
        .update({
          business_name: updates.business_name,
          service_categories: updates.service_categories,
          bio: updates.bio,
          hourly_rate: updates.hourly_rate,
          is_available: updates.is_available,
        })
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

  const toggleAvailability = async () => {
    if (!profile) return;
    await updateProfile({ is_available: !profile.is_available });
  };

  return {
    profile,
    loading,
    createProfile,
    updateProfile,
    toggleAvailability,
    refetch: fetchProfile,
    SERVICE_CATEGORIES,
  };
}
