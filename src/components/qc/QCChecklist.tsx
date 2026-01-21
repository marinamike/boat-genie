import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Loader2, 
  ClipboardCheck,
  Clock,
  User,
  Ban
} from "lucide-react";
import { useQCFlow, QCChecklistItem } from "@/hooks/useQCFlow";
import { ReviewSuccessDialog } from "@/components/reviews/ReviewSuccessDialog";
import { formatDistanceToNow } from "date-fns";

interface QCChecklistProps {
  workOrderId: string;
  boatId: string;
  isVerifier: boolean; // Owner, Admin, or Runner
  escrowStatus: string;
  materialsDeposit?: number;
  laborBalance?: number;
  providerId?: string;
  providerName?: string;
  onComplete?: () => void;
}

export function QCChecklist({
  workOrderId,
  boatId,
  isVerifier,
  escrowStatus,
  materialsDeposit = 0,
  laborBalance = 0,
  providerId,
  providerName,
  onComplete,
}: QCChecklistProps) {
  const [items, setItems] = useState<QCChecklistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueReason, setIssueReason] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  const {
    loading,
    fetchChecklistItems,
    verifyChecklistItem,
    unverifyChecklistItem,
    verifyAndReleaseFunds,
    reportIssue,
  } = useQCFlow();

  useEffect(() => {
    const loadItems = async () => {
      const data = await fetchChecklistItems(workOrderId);
      setItems(data);
      setLoadingItems(false);
    };
    loadItems();
  }, [workOrderId, fetchChecklistItems]);

  const allVerified = items.length > 0 && items.every(item => item.is_verified);
  const verifiedCount = items.filter(item => item.is_verified).length;

  const handleToggleItem = async (item: QCChecklistItem) => {
    if (!isVerifier) return;
    
    const success = item.is_verified 
      ? await unverifyChecklistItem(item.id)
      : await verifyChecklistItem(item.id);
    
    if (success) {
      const updated = await fetchChecklistItems(workOrderId);
      setItems(updated);
    }
  };

  const handleReleaseFunds = async () => {
    const success = await verifyAndReleaseFunds(workOrderId, boatId);
    if (success) {
      // Show review dialog after successful release
      if (providerId) {
        setReviewDialogOpen(true);
      } else {
        onComplete?.();
      }
    }
  };

  const handleReviewComplete = () => {
    setReviewDialogOpen(false);
    onComplete?.();
  };

  const handleReportIssue = async () => {
    if (!issueReason.trim()) return;
    const success = await reportIssue(workOrderId, boatId, issueReason);
    if (success) {
      setIssueDialogOpen(false);
      setIssueReason("");
      if (onComplete) onComplete();
    }
  };

  if (loadingItems) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            QC checklist will appear when the provider requests review
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={escrowStatus === "disputed" ? "border-destructive" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              QC Verification
            </CardTitle>
            <CardDescription>
              {verifiedCount} of {items.length} items verified
            </CardDescription>
          </div>
          {escrowStatus === "disputed" ? (
            <Badge variant="destructive" className="gap-1">
              <Ban className="w-3 h-3" />
              Disputed
            </Badge>
          ) : allVerified ? (
            <Badge className="bg-green-500 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Milestone Payment Info */}
        {(materialsDeposit > 0 || laborBalance > 0) && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <p className="font-medium">Payment Breakdown</p>
            {materialsDeposit > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materials Deposit (Released)</span>
                <span className="text-green-600">${materialsDeposit.toFixed(2)}</span>
              </div>
            )}
            {laborBalance > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labor Balance (In Escrow)</span>
                <span className="font-medium">${laborBalance.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Checklist Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                item.is_verified 
                  ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30" 
                  : "bg-background border-border"
              }`}
            >
              <Checkbox
                id={item.id}
                checked={item.is_verified}
                onCheckedChange={() => handleToggleItem(item)}
                disabled={!isVerifier || loading || escrowStatus === "disputed" || escrowStatus === "released"}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={item.id}
                  className={`text-sm cursor-pointer ${
                    item.is_verified ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.description}
                </label>
                {item.is_verified && item.verifier_name && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Verified by {item.verifier_name}
                    {item.verified_at && ` • ${formatDistanceToNow(new Date(item.verified_at), { addSuffix: true })}`}
                  </p>
                )}
              </div>
              {item.is_verified && (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {isVerifier && escrowStatus !== "disputed" && escrowStatus !== "released" && (
          <div className="flex gap-2 pt-2 border-t">
            {/* Report Issue Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => setIssueDialogOpen(true)}
              disabled={loading}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Report Issue
            </Button>

            {/* Release Funds Button - Only enabled when all verified */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!allVerified || loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4 mr-1" />
                  )}
                  Verify & Release
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Release Payment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will release the remaining ${laborBalance.toFixed(2)} to the service provider.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReleaseFunds} className="bg-green-600 hover:bg-green-700">
                    Release Funds
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Dispute Dialog */}
        <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Report Issue
              </DialogTitle>
              <DialogDescription>
                This will freeze the escrow and notify administrators for review.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reason">Describe the issue</Label>
                <Textarea
                  id="reason"
                  placeholder="What went wrong? Be specific..."
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReportIssue}
                disabled={!issueReason.trim() || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                File Dispute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Success Dialog */}
        {providerId && (
          <ReviewSuccessDialog
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            workOrderId={workOrderId}
            providerId={providerId}
            providerName={providerName}
            onComplete={handleReviewComplete}
          />
        )}
      </CardContent>
    </Card>
  );
}
