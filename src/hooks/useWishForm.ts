import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type MembershipTier = Database["public"]["Enums"]["membership_tier"];

export type ServiceCategory = "wash_detail" | "mechanical" | "electrical" | "hull_bottom" | "canvas_upholstery" | "rigging" | "general";

export interface WishFormData {
  boatId: string;
  serviceCategory: ServiceCategory;
  serviceType: string;
  description: string;
  urgency: "normal" | "urgent";
  isEmergency: boolean;
  preferredDate?: string;
  calculatedPrice?: number;
  photos?: string[];
  providerId?: string;
}

export interface ServiceRate {
  id: string;
  service_name: string;
  service_type: "genie_service" | "pro_service";
  rate_per_foot: number | null;
  diagnostic_fee: number | null;
  description: string | null;
}

const EMERGENCY_FEE_STANDARD = 150;
const EMERGENCY_FEE_MEMBER = 50;
const SERVICE_FEE_RATE = 0.05;

export function useWishForm() {
  const [loading, setLoading] = useState(false);
  const [serviceRates, setServiceRates] = useState<ServiceRate[]>([]);
  const { toast } = useToast();

  const fetchServiceRates = useCallback(async () => {
    const { data, error } = await supabase
      .from("service_rates")
      .select("*")
      .eq("is_active", true)
      .order("service_name");

    if (error) {
      console.error("Error fetching service rates:", error);
      return [];
    }

    setServiceRates(data || []);
    return data || [];
  }, []);

  const calculatePrice = useCallback(
    (
      serviceRate: ServiceRate,
      boatLengthFt: number,
      membershipTier: MembershipTier,
      isEmergency: boolean
    ) => {
      let basePrice = 0;

      if (serviceRate.service_type === "genie_service" && serviceRate.rate_per_foot) {
        basePrice = boatLengthFt * serviceRate.rate_per_foot;
      } else if (serviceRate.service_type === "pro_service" && serviceRate.diagnostic_fee) {
        basePrice = serviceRate.diagnostic_fee;
      }

      // Service fee (5% for standard, 0% for genie members)
      const serviceFee = membershipTier === "genie" ? 0 : basePrice * SERVICE_FEE_RATE;

      // Emergency fee
      const emergencyFee = isEmergency
        ? membershipTier === "genie"
          ? EMERGENCY_FEE_MEMBER
          : EMERGENCY_FEE_STANDARD
        : 0;

      return {
        basePrice,
        serviceFee,
        emergencyFee,
        totalPrice: basePrice + serviceFee + emergencyFee,
      };
    },
    []
  );

  const uploadPhotos = useCallback(
    async (files: File[], userId: string): Promise<string[]> => {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("wish-photos")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Error uploading photo:", error);
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("wish-photos")
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      return uploadedUrls;
    },
    [toast]
  );

  const submitWish = useCallback(
    async (formData: WishFormData): Promise<boolean> => {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to submit a service request.",
            variant: "destructive",
          });
          return false;
        }

        // Create the wish form record
        const { error } = await supabase.from("wish_forms").insert({
          requester_id: user.id,
          boat_id: formData.boatId,
          service_type: formData.serviceType,
          description: formData.description,
          urgency: formData.urgency,
          is_emergency: formData.isEmergency,
          preferred_date: formData.preferredDate || null,
          calculated_price: formData.calculatedPrice || null,
          photos: formData.photos || [],
          status: "submitted",
          provider_id: formData.providerId || null,
        });

        if (error) {
          console.error("Error submitting wish:", error);
          toast({
            title: "Submission Failed",
            description: "There was an error submitting your request. Please try again.",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Wish Submitted! ✨",
          description: "Your service request has been sent. Providers will start quoting soon!",
        });

        return true;
      } catch (error) {
        console.error("Error in submitWish:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    loading,
    serviceRates,
    fetchServiceRates,
    calculatePrice,
    uploadPhotos,
    submitWish,
  };
}

export const SERVICE_CATEGORIES = {
  wash_detail: {
    label: "Wash & Detail",
    description: "Wash, wax, and detailing services",
    icon: "Sparkles",
  },
  mechanical: {
    label: "Mechanical",
    description: "Engine and drive train repair",
    icon: "Wrench",
  },
  electrical: {
    label: "Electrical",
    description: "Wiring, electronics, navigation",
    icon: "Zap",
  },
  hull_bottom: {
    label: "Hull & Bottom",
    description: "Bottom paint, fiberglass, gelcoat",
    icon: "Paintbrush",
  },
  canvas_upholstery: {
    label: "Canvas & Upholstery",
    description: "Covers, enclosures, cushions",
    icon: "Scissors",
  },
  rigging: {
    label: "Rigging",
    description: "Standing and running rigging",
    icon: "Anchor",
  },
  general: {
    label: "General",
    description: "Other marine services",
    icon: "Settings",
  },
} as const;
