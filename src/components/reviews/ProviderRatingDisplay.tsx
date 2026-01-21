import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MessageSquare, User } from "lucide-react";
import { useReviews, ProviderRating, Review } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ProviderRatingDisplayProps {
  providerId: string;
  compact?: boolean;
  showReviews?: boolean;
}

export function ProviderRatingDisplay({
  providerId,
  compact = false,
  showReviews = true,
}: ProviderRatingDisplayProps) {
  const [rating, setRating] = useState<ProviderRating | null>(null);
  const [loading, setLoading] = useState(true);
  const { getProviderRating } = useReviews();

  useEffect(() => {
    const loadRating = async () => {
      const data = await getProviderRating(providerId);
      setRating(data);
      setLoading(false);
    };
    loadRating();
  }, [providerId, getProviderRating]);

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    );
  }

  if (!rating || rating.review_count === 0) {
    if (compact) {
      return (
        <span className="text-sm text-muted-foreground">No reviews yet</span>
      );
    }
    return null;
  }

  // Compact display for cards, headers, etc.
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating.average_rating.toFixed(1)}</span>
        <span className="text-muted-foreground text-sm">
          ({rating.review_count})
        </span>
      </div>
    );
  }

  // Full display with reviews
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Summary */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold">{rating.average_rating.toFixed(1)}</div>
            <div className="flex items-center justify-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-4 h-4",
                    star <= Math.round(rating.average_rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div>
            <div className="text-lg font-medium">{rating.review_count}</div>
            <div className="text-sm text-muted-foreground">
              {rating.review_count === 1 ? "Review" : "Reviews"}
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        {showReviews && rating.recent_reviews.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Recent Reviews
            </h4>
            {rating.recent_reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{review.owner_name}</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-3 h-3",
                    star <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
        </span>
      </div>

      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {review.comment && (
        <p className="text-sm text-muted-foreground">{review.comment}</p>
      )}

      {review.verified_purchase && (
        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
          ✓ Verified Service
        </Badge>
      )}
    </div>
  );
}
