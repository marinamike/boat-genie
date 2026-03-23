import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProviderOnboardingProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  bio: string | null;
  service_categories: string[];
  hourly_rate: number | null;
  rate_per_foot: number | null;
  diagnostic_fee: number | null;
  insurance_doc_url: string | null;
  insurance_expiry: string | null;
  w9_doc_url: string | null;
  ein: string | null;
  stripe_connected: boolean;
  stripe_account_id: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  rates_agreed: boolean;
  rates_locked_at: string | null;
  onboarding_status: string;
  submitted_for_review_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  route?: string;
}

export function useProviderOnboarding() {
  const [profile, setProfile] = useState<ProviderOnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceCount, setServiceCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
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
        .from("businesses")
        .select("*")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Type assertion since the database has new columns
      setProfile(data as unknown as ProviderOnboardingProfile);

      // Get service count
      if (data) {
        const { count } = await supabase
          .from("provider_services")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", data.id);
        setServiceCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching provider profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getChecklistItems = useCallback((): ChecklistItem[] => {
    if (!profile) return [];

    return [
      {
        id: "business_profile",
        label: "Business Profile",
        description: "Company name, logo, and primary contact info",
        isComplete: Boolean(profile.business_name && profile.primary_contact_name && profile.primary_contact_email),
      },
      {
        id: "service_menu",
        label: "Service Menu",
        description: "Add at least one service to your menu",
        isComplete: serviceCount > 0,
      },
      {
        id: "insurance",
        label: "Insurance Vault",
        description: "Upload Certificate of Insurance (COI) with expiration date",
        isComplete: Boolean(profile.insurance_doc_url && profile.insurance_expiry),
      },
      {
        id: "tax_info",
        label: "Tax Information",
        description: "Upload W-9 and provide EIN",
        isComplete: Boolean(profile.w9_doc_url && profile.ein),
      },
      {
        id: "bank_setup",
        label: "Bank Setup",
        description: "Connect with Stripe for payouts",
        isComplete: profile.stripe_connected,
      },
      {
        id: "terms",
        label: "Legal Agreement",
        description: "Accept Terms of Service including Locked Pricing Policy",
        isComplete: profile.terms_accepted,
      },
    ];
  }, [profile, serviceCount]);

  const completionPercentage = useCallback(() => {
    const items = getChecklistItems();
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.isComplete).length;
    return Math.round((completed / items.length) * 100);
  }, [getChecklistItems]);

  const isChecklistComplete = useCallback(() => {
    return completionPercentage() === 100;
  }, [completionPercentage]);

  const canAccessJobBoard = useCallback(() => {
    return profile?.onboarding_status === "active";
  }, [profile]);

  const updateProfile = async (updates: Partial<ProviderOnboardingProfile>) => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from("businesses")
        .update(updates as Record<string, unknown>)
        .eq("id", profile.id);

      if (error) throw error;
      
      await fetchProfile();
      toast({ title: "Profile updated successfully!" });
      return true;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const submitForReview = async () => {
    if (!profile || !isChecklistComplete()) return false;

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          verification_status: "pending" as any,
        })
        .eq("id", profile.id);

      if (error) throw error;
      
      await fetchProfile();
      toast({ 
        title: "Submitted for Review!", 
        description: "An admin will review your application and activate your account." 
      });
      return true;
    } catch (error: any) {
      console.error("Error submitting for review:", error);
      toast({ title: "Error submitting", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const acceptTerms = async () => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          accepting_jobs: true,
        })
        .eq("id", profile.id);

      if (error) throw error;
      
      await fetchProfile();
      toast({ title: "Terms accepted!" });
      return true;
    } catch (error: any) {
      console.error("Error accepting terms:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const uploadDocument = async (file: File, type: "insurance" | "w9" | "logo") => {
    if (!profile) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${session.user.id}/${type}_${Date.now()}.${fileExt}`;

      // Determine correct Content-Type for proper browser display
      const contentTypeMap: Record<string, string> = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      const contentType = contentTypeMap[fileExt || ""] || file.type || "application/octet-stream";

      const { error: uploadError } = await supabase.storage
        .from("provider-documents")
        .upload(fileName, file, { 
          upsert: true,
          contentType: contentType,
        });

      if (uploadError) throw uploadError;

      // Store ONLY the file path (not full URL) for signed URL generation later
      // Update the appropriate field
      const updateField = type === "insurance" 
        ? "insurance_doc_url" 
        : type === "w9" 
          ? "w9_doc_url" 
          : "logo_url";

      await updateProfile({ [updateField]: fileName } as Partial<ProviderOnboardingProfile>);
      
      toast({ title: "Document uploaded successfully!" });
      return fileName;
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
  };

  // Admin functions
  const approveProvider = async (providerId: string) => {
    if (!isAdmin) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from("businesses")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", providerId);

      if (error) throw error;
      
      toast({ title: "Provider approved!" });
      return true;
    } catch (error: any) {
      console.error("Error approving provider:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const rejectProvider = async (providerId: string, reason: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          verification_status: "rejected",
        })
        .eq("id", providerId);

      if (error) throw error;
      
      toast({ title: "Provider rejected" });
      return true;
    } catch (error: any) {
      console.error("Error rejecting provider:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
  };

  const getPendingProviders = async () => {
    if (!isAdmin) return [];

    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("verification_status", "pending_review")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as unknown as ProviderOnboardingProfile[];
    } catch (error) {
      console.error("Error fetching pending providers:", error);
      return [];
    }
  };

  return {
    profile,
    loading,
    isAdmin,
    serviceCount,
    getChecklistItems,
    completionPercentage,
    isChecklistComplete,
    canAccessJobBoard,
    updateProfile,
    submitForReview,
    acceptTerms,
    uploadDocument,
    approveProvider,
    rejectProvider,
    getPendingProviders,
    refetch: fetchProfile,
  };
}
