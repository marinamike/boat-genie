import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Building2, 
  Package, 
  Shield, 
  FileText, 
  CreditCard, 
  Scale,
  AlertCircle,
  Clock,
  CheckCircle
} from "lucide-react";
import { useProviderOnboarding, ChecklistItem } from "@/hooks/useProviderOnboarding";
import { cn } from "@/lib/utils";

interface OnboardingChecklistProps {
  onNavigateToSection: (section: string) => void;
}

export function OnboardingChecklist({ onNavigateToSection }: OnboardingChecklistProps) {
  const { 
    profile, 
    loading, 
    getChecklistItems, 
    completionPercentage, 
    isChecklistComplete,
    submitForReview 
  } = useProviderOnboarding();
  const [submitting, setSubmitting] = useState(false);

  const getIconForItem = (id: string) => {
    switch (id) {
      case "business_profile": return Building2;
      case "service_menu": return Package;
      case "insurance": return Shield;
      case "tax_info": return FileText;
      case "bank_setup": return CreditCard;
      case "terms": return Scale;
      default: return Circle;
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    await submitForReview();
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const checklistItems = getChecklistItems();
  const percentage = completionPercentage();
  const allComplete = isChecklistComplete();
  const onboardingStatus = profile?.onboarding_status || "pending_setup";

  // Show status message for pending/rejected
  if (onboardingStatus === "pending_review") {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle>Application Under Review</CardTitle>
          <CardDescription>
            Your application has been submitted and is being reviewed by our team. 
            You'll be notified once your account is activated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            Submitted: {profile?.submitted_for_review_at 
              ? new Date(profile.submitted_for_review_at).toLocaleDateString() 
              : "N/A"}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (onboardingStatus === "rejected") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>Application Rejected</CardTitle>
          <CardDescription>
            Unfortunately, your application was not approved at this time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.rejection_reason && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Reason:</p>
              <p className="text-sm text-muted-foreground">{profile.rejection_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (onboardingStatus === "active") {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle>Account Active!</CardTitle>
          <CardDescription>
            Your provider account is fully set up and active. You can now view and quote on jobs.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Setup Progress</CardTitle>
              <CardDescription>
                Complete all items to submit your application for review
              </CardDescription>
            </div>
            <Badge variant={allComplete ? "default" : "secondary"} className="text-lg px-3 py-1">
              {percentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={percentage} className="h-3 mb-6" />
          
          <div className="space-y-3">
            {checklistItems.map((item) => {
              const Icon = getIconForItem(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigateToSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
                    item.isComplete 
                      ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/15" 
                      : "bg-muted/50 border-border hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    item.isComplete ? "bg-green-500/20" : "bg-muted"
                  )}>
                    {item.isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      item.isComplete && "text-green-700 dark:text-green-400"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div>
                    {item.isComplete ? (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400">
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline">Incomplete</Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {allComplete && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">All Set!</h3>
              <p className="text-muted-foreground mb-4">
                You've completed all the required items. Submit your application for admin review.
              </p>
              <Button 
                onClick={handleSubmitForReview}
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Review"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
