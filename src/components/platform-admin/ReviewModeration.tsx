import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scale, Flag, Check, Trash2, Star, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportedReview {
  id: string;
  business_id: string;
  reviewer_id: string;
  rating: number;
  review_text: string | null;
  report_reason: string | null;
  reported_at: string | null;
  created_at: string;
  business_name?: string;
  reviewer_name?: string;
}

export function ReviewModeration() {
  const [reviews, setReviews] = useState<ReportedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReportedReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_reviews")
        .select("*")
        .eq("is_reported", true)
        .eq("is_deleted", false)
        .order("reported_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch business and reviewer names
        const businessIds = [...new Set(data.map(r => r.business_id).filter(Boolean))];
        const reviewerIds = [...new Set(data.map(r => r.reviewer_id))];

        const [{ data: businesses }, { data: profiles }] = await Promise.all([
          supabase.from("businesses").select("id, business_name").in("id", businessIds),
          supabase.from("profiles").select("id, full_name").in("id", reviewerIds),
        ]);

        const businessMap = new Map(businesses?.map(b => [b.id, b.business_name]) || []);
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        setReviews(data.map(r => ({
          ...r,
          business_name: businessMap.get(r.business_id) || "Unknown Business",
          reviewer_name: profileMap.get(r.reviewer_id) || "Anonymous",
        })));
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reported reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedReviews();
  }, []);

  const handleDismissReport = async (reviewId: string) => {
    setActionLoading(`dismiss-${reviewId}`);
    try {
      const { error } = await supabase
        .from("platform_reviews")
        .update({ 
          is_reported: false,
          report_reason: null,
          reported_at: null,
          reported_by: null
        })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Report Dismissed",
        description: "The review will remain visible",
      });

      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to dismiss report",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setActionLoading(`delete-${reviewId}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("platform_reviews")
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id
        })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Review Deleted",
        description: "The review has been removed",
      });

      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          The Judge
        </CardTitle>
        <CardDescription>
          {reviews.length} reported reviews awaiting moderation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No reported reviews to moderate.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="border-l-4 border-l-destructive">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{review.business_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <User className="w-3 h-3" />
                        <span>{review.reviewer_name}</span>
                        <span>•</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      Reported
                    </Badge>
                  </div>

                  {/* Review Content */}
                  {review.review_text && (
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      "{review.review_text}"
                    </p>
                  )}

                  {/* Report Reason */}
                  {review.report_reason && (
                    <div className="text-sm">
                      <span className="font-medium text-destructive">Report Reason: </span>
                      <span className="text-muted-foreground">{review.report_reason}</span>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Posted: {new Date(review.created_at).toLocaleDateString()}
                    </span>
                    {review.reported_at && (
                      <span className="flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        Reported: {new Date(review.reported_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismissReport(review.id)}
                      disabled={actionLoading?.startsWith("dismiss") || actionLoading?.startsWith("delete")}
                      className="flex-1"
                    >
                      {actionLoading === `dismiss-${review.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Dismiss Report
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={actionLoading?.startsWith("dismiss") || actionLoading?.startsWith("delete")}
                      className="flex-1"
                    >
                      {actionLoading === `delete-${review.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Review
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
