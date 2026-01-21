import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scale, Loader2, CheckCircle2, Lock, DollarSign } from "lucide-react";
import { useProviderOnboarding } from "@/hooks/useProviderOnboarding";

interface TermsAcceptanceFormProps {
  onComplete?: () => void;
}

export function TermsAcceptanceForm({ onComplete }: TermsAcceptanceFormProps) {
  const { profile, loading, acceptTerms } = useProviderOnboarding();
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const handleAcceptTerms = async () => {
    if (!agreed) return;
    
    setAccepting(true);
    const success = await acceptTerms();
    setAccepting(false);
    
    if (success && onComplete) {
      onComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.terms_accepted) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle>Terms Accepted</CardTitle>
          <CardDescription>
            You accepted the Terms of Service on{" "}
            {profile.terms_accepted_at 
              ? new Date(profile.terms_accepted_at).toLocaleDateString() 
              : "N/A"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Terms of Service
          </CardTitle>
          <CardDescription>
            Please review and accept the provider terms to complete your setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Terms Highlights */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">Locked Pricing Policy</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Once you go live, your service menu prices are locked and cannot be changed 
                without written approval from Boat Genie administration.
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-700 dark:text-blue-400">5% Lead Fee</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                A 5% platform fee is deducted from each completed job. This covers lead 
                generation, payment processing, and platform services.
              </p>
            </div>
          </div>

          {/* Full Terms */}
          <div className="border rounded-lg">
            <div className="p-3 bg-muted/50 border-b">
              <h4 className="font-medium">Provider Agreement</h4>
            </div>
            <ScrollArea className="h-64 p-4">
              <div className="prose prose-sm dark:prose-invert">
                <h4>1. Service Provider Terms</h4>
                <p>
                  By accepting these terms, you agree to provide marine services through the 
                  Boat Genie platform in accordance with all applicable laws, regulations, 
                  and industry standards.
                </p>

                <h4>2. Locked Pricing Policy</h4>
                <p>
                  All service prices listed in your Service Menu are considered final once 
                  your account is activated. You may add new services at any time, but existing 
                  prices cannot be modified without prior written approval from Boat Genie. 
                  This policy ensures pricing consistency and trust for boat owners.
                </p>

                <h4>3. Platform Fees</h4>
                <p>
                  Boat Genie charges a 5% lead fee on all completed jobs. This fee is 
                  automatically deducted from your payout and covers:
                </p>
                <ul>
                  <li>Lead generation and customer acquisition</li>
                  <li>Payment processing fees</li>
                  <li>Platform maintenance and support</li>
                  <li>Insurance and dispute resolution services</li>
                </ul>

                <h4>4. Insurance Requirements</h4>
                <p>
                  You must maintain valid liability insurance coverage at all times while 
                  providing services through the platform. Failure to maintain current 
                  insurance may result in account suspension.
                </p>

                <h4>5. Quality Standards</h4>
                <p>
                  All work must be performed to professional standards. Providers are expected 
                  to communicate clearly with customers, arrive on time, and complete work as 
                  quoted. Repeated complaints may result in account review or termination.
                </p>

                <h4>6. Payment Terms</h4>
                <p>
                  Payments are processed through Stripe and deposited to your connected bank 
                  account within 2-3 business days of job completion and customer approval.
                </p>

                <h4>7. Account Termination</h4>
                <p>
                  Either party may terminate this agreement with written notice. Upon 
                  termination, all pending jobs must be completed and final payments processed.
                </p>
              </div>
            </ScrollArea>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="terms_agreed"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms_agreed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the Terms of Service
              </label>
              <p className="text-sm text-muted-foreground">
                I have read and understand the <strong>Locked Pricing Policy</strong> and the <strong>5% Lead Fee</strong> structure. 
                I agree to abide by all terms and conditions of the Boat Genie Provider Agreement.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleAcceptTerms} 
            disabled={!agreed || accepting}
            className="w-full"
            size="lg"
          >
            {accepting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Accept Terms & Continue"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
