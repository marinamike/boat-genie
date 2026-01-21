import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { useProviderOnboarding } from "@/hooks/useProviderOnboarding";

interface BankSetupFormProps {
  onComplete?: () => void;
}

export function BankSetupForm({ onComplete }: BankSetupFormProps) {
  const { profile, loading, updateProfile } = useProviderOnboarding();
  const [connecting, setConnecting] = useState(false);

  // Placeholder for Stripe Connect integration
  const handleConnectStripe = async () => {
    setConnecting(true);
    
    // Simulate Stripe Connect flow
    // In production, this would redirect to Stripe Connect OAuth
    // For now, we'll mark it as connected for demo purposes
    setTimeout(async () => {
      await updateProfile({ 
        stripe_connected: true,
        stripe_account_id: `acct_demo_${Date.now()}` 
      });
      setConnecting(false);
      if (onComplete) {
        onComplete();
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isComplete = profile?.stripe_connected;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bank Setup
          </CardTitle>
          <CardDescription>
            Connect your bank account to receive payouts for completed jobs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isComplete ? (
            <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-700 dark:text-green-400">Bank Connected</p>
                <p className="text-sm text-muted-foreground">
                  Your Stripe account is linked for payouts
                </p>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/50 rounded-lg">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Connect with Stripe</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We use Stripe to securely process payments. You'll receive payouts directly 
                to your bank account within 2-3 business days of job completion.
              </p>
              <Button onClick={handleConnectStripe} disabled={connecting} size="lg">
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect with Stripe
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Stripe is a PCI-compliant payment processor trusted by millions of businesses
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isComplete && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Bank setup is complete! You're ready to receive payouts.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
