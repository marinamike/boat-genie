import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  work_order_id: string;
  owner_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  verified_purchase: boolean;
  is_flagged: boolean;
  flagged_reason: string | null;
  is_hidden: boolean;
  created_at: string;
  owner_name?: string;
  boat_name?: string;
  provider_name?: string;
}

export interface ProviderRating {
  average_rating: number;
  review_count: number;
  recent_reviews: Review[];
}

export const REVIEW_TAGS = ["Punctual", "Quality Work", "Clean Boat"] as const;
export type ReviewTag = typeof REVIEW_TAGS[number];

export function useReviews() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Submit a new review
  const submitReview = async (data: {
    workOrderId: string;
    providerId: string;
    rating: number;
    comment?: string;
    tags: string[];
  }): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("reviews").insert({
        work_order_id: data.workOrderId,
        owner_id: user.id,
        provider_id: data.providerId,
        rating: data.rating,
        comment: data.comment || null,
        tags: data.tags,
        verified_purchase: true,
      });

      if (error) throw error;

      // Create notification for provider
      await supabase.from("notifications").insert({
        user_id: data.providerId,
        title: "New Review Received!",
        message: `Congratulations! An owner just left you a ${data.rating}-star review.`,
        type: "review",
        related_id: data.workOrderId,
      });

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not submit review";
      console.error("Error submitting review:", error);
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if a work order has been reviewed
  const hasReviewed = async (workOrderId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id")
      .eq("work_order_id", workOrderId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking review status:", error);
    }

    return !!data;
  };

  // Get provider rating summary
  const getProviderRating = useCallback(async (providerId: string): Promise<ProviderRating | null> => {
    try {
      // Get all non-hidden reviews for this provider
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("provider_id", providerId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!reviews || reviews.length === 0) {
        return {
          average_rating: 0,
          review_count: 0,
          recent_reviews: [],
        };
      }

      // Calculate average
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Get owner names for recent reviews
      const recentReviews = reviews.slice(0, 3);
      const ownerIds = [...new Set(recentReviews.map(r => r.owner_id))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      const enrichedReviews = recentReviews.map(r => ({
        ...r,
        owner_name: profileMap.get(r.owner_id) || "Verified Owner",
      }));

      return {
        average_rating: Math.round(averageRating * 10) / 10,
        review_count: reviews.length,
        recent_reviews: enrichedReviews,
      };
    } catch (error) {
      console.error("Error fetching provider rating:", error);
      return null;
    }
  }, []);

  // Get all reviews (admin)
  const getAllReviews = useCallback(async (): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with names
      const ownerIds = [...new Set((data || []).map(r => r.owner_id))];
      const providerIds = [...new Set((data || []).map(r => r.provider_id))];

      const [{ data: profiles }, { data: providers }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", ownerIds),
        supabase.from("businesses").select("owner_id, business_name").in("owner_id", providerIds),
      ]);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
      const providerMap = new Map((providers || []).map(p => [p.owner_id, p.business_name]));

      return (data || []).map(r => ({
        ...r,
        owner_name: profileMap.get(r.owner_id) || "Unknown",
        provider_name: providerMap.get(r.provider_id) || "Unknown",
      }));
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      return [];
    }
  }, []);

  // Flag a review (admin)
  const flagReview = async (reviewId: string, reason: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("reviews")
        .update({
          is_flagged: true,
          flagged_reason: reason,
          flagged_at: new Date().toISOString(),
          flagged_by: user.id,
        })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Review Flagged",
        description: "The review has been flagged for violation.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not flag review";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Hide/unhide a review (admin)
  const toggleReviewVisibility = async (reviewId: string, hide: boolean): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ is_hidden: hide })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: hide ? "Review Hidden" : "Review Restored",
        description: hide 
          ? "The review is no longer visible to users."
          : "The review is now visible to users.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not update review";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a review (admin only)
  const deleteReview = async (reviewId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Review Deleted",
        description: "The review has been permanently removed.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not delete review";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitReview,
    hasReviewed,
    getProviderRating,
    getAllReviews,
    flagReview,
    toggleReviewVisibility,
    deleteReview,
    REVIEW_TAGS,
  };
}
