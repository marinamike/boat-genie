import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Star, 
  Flag, 
  Eye, 
  EyeOff, 
  Trash2, 
  Search, 
  MessageSquare,
  Loader2,
  User
} from "lucide-react";
import { useReviews, Review } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function ReviewModerationPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "hidden">("all");

  const { 
    getAllReviews, 
    flagReview, 
    toggleReviewVisibility, 
    deleteReview,
    loading: actionLoading 
  } = useReviews();

  const loadReviews = async () => {
    setLoading(true);
    const data = await getAllReviews();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleFlag = async () => {
    if (!selectedReview || !flagReason.trim()) return;
    
    const success = await flagReview(selectedReview.id, flagReason);
    if (success) {
      setFlagDialogOpen(false);
      setFlagReason("");
      setSelectedReview(null);
      loadReviews();
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    const success = await toggleReviewVisibility(review.id, !review.is_hidden);
    if (success) {
      loadReviews();
    }
  };

  const handleDelete = async (reviewId: string) => {
    const success = await deleteReview(reviewId);
    if (success) {
      loadReviews();
    }
  };

  // Filter and search
  const filteredReviews = reviews.filter(review => {
    // Apply filter
    if (filter === "flagged" && !review.is_flagged) return false;
    if (filter === "hidden" && !review.is_hidden) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        review.owner_name?.toLowerCase().includes(query) ||
        review.provider_name?.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query) ||
        review.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const stats = {
    total: reviews.length,
    flagged: reviews.filter(r => r.is_flagged).length,
    hidden: reviews.filter(r => r.is_hidden).length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Review Moderation
        </CardTitle>
        <CardDescription>
          Manage and moderate provider reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "p-3 rounded-lg text-center transition-colors",
              filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-80">Total</div>
          </button>
          <button
            onClick={() => setFilter("flagged")}
            className={cn(
              "p-3 rounded-lg text-center transition-colors",
              filter === "flagged" ? "bg-yellow-500 text-white" : "bg-muted"
            )}
          >
            <div className="text-2xl font-bold">{stats.flagged}</div>
            <div className="text-sm opacity-80">Flagged</div>
          </button>
          <button
            onClick={() => setFilter("hidden")}
            className={cn(
              "p-3 rounded-lg text-center transition-colors",
              filter === "hidden" ? "bg-destructive text-destructive-foreground" : "bg-muted"
            )}
          >
            <div className="text-2xl font-bold">{stats.hidden}</div>
            <div className="text-sm opacity-80">Hidden</div>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reviews Table */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews found
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id} className={review.is_hidden ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="font-medium">{review.provider_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
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
                      {review.comment && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {review.comment}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{review.owner_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {review.is_flagged && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                            Flagged
                          </Badge>
                        )}
                        {review.is_hidden && (
                          <Badge variant="destructive">Hidden</Badge>
                        )}
                        {!review.is_flagged && !review.is_hidden && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {!review.is_flagged && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedReview(review);
                              setFlagDialogOpen(true);
                            }}
                            title="Flag review"
                          >
                            <Flag className="w-4 h-4 text-yellow-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleVisibility(review)}
                          disabled={actionLoading}
                          title={review.is_hidden ? "Show review" : "Hide review"}
                        >
                          {review.is_hidden ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete review"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this review. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(review.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Flag Dialog */}
        <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-yellow-600" />
                Flag Review
              </DialogTitle>
              <DialogDescription>
                Flag this review for violating community standards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedReview && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">{selectedReview.provider_name}</p>
                  <p className="text-muted-foreground mt-1">
                    {selectedReview.comment || "No comment"}
                  </p>
                </div>
              )}
              <Textarea
                placeholder="Reason for flagging..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleFlag} 
                disabled={!flagReason.trim() || actionLoading}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Flag Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
