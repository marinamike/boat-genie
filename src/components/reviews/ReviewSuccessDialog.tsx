import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Star, Loader2 } from "lucide-react";
import { useReviews, REVIEW_TAGS, ReviewTag } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

interface ReviewSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  providerId: string;
  providerName?: string;
  onComplete?: () => void;
}

export function ReviewSuccessDialog({
  open,
  onOpenChange,
  workOrderId,
  providerId,
  providerName,
  onComplete,
}: ReviewSuccessDialogProps) {
  const [step, setStep] = useState<"success" | "rating">("success");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([]);
  const [comment, setComment] = useState("");
  const { submitReview, loading } = useReviews();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("success");
      setRating(0);
      setHoveredRating(0);
      setSelectedTags([]);
      setComment("");
    }
  }, [open]);

  const handleTagToggle = (tag: ReviewTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;

    const success = await submitReview({
      workOrderId,
      providerId,
      rating,
      comment: comment.trim() || undefined,
      tags: selectedTags,
    });

    if (success) {
      onOpenChange(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "success" ? (
          <>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl">Service Completed!</DialogTitle>
                <DialogDescription className="mt-2">
                  Payment has been released to {providerName || "the provider"}.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => setStep("rating")}
              >
                <Star className="w-4 h-4 mr-2" />
                Rate Your Experience
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleSkip}
              >
                Maybe Later
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Rate Your Experience</DialogTitle>
              <DialogDescription>
                How was your experience with {providerName || "the provider"}?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-10 h-10 transition-colors",
                        (hoveredRating >= star || rating >= star)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Quick Tags */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Quick feedback (optional)
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {REVIEW_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedTags.includes(tag)
                          ? "bg-primary"
                          : "hover:bg-accent"
                      )}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSkip}
              >
                Skip
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={rating === 0 || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Submit Review
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
