import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Eye,
  Shield,
  FileText,
  CreditCard,
  Calendar,
  Mail,
  Phone
} from "lucide-react";
import { useProviderOnboarding, ProviderOnboardingProfile } from "@/hooks/useProviderOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function AdminProviderReview() {
  const { isAdmin, approveProvider, rejectProvider } = useProviderOnboarding();
  const [pendingProviders, setPendingProviders] = useState<ProviderOnboardingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderOnboardingProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("onboarding_status", "pending_review")
        .order("submitted_for_review_at", { ascending: true });

      if (error) throw error;
      setPendingProviders(data as unknown as ProviderOnboardingProfile[]);
    } catch (error) {
      console.error("Error fetching pending providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (provider: ProviderOnboardingProfile) => {
    setProcessing(true);
    const success = await approveProvider(provider.id);
    if (success) {
      await fetchPendingProviders();
      setSelectedProvider(null);
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedProvider || !rejectionReason) return;
    
    setProcessing(true);
    const success = await rejectProvider(selectedProvider.id, rejectionReason);
    if (success) {
      await fetchPendingProviders();
      setSelectedProvider(null);
      setShowRejectDialog(false);
      setRejectionReason("");
    }
    setProcessing(false);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Review Queue</CardTitle>
          <CardDescription>
            Review and approve new provider applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingProviders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No pending applications to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={provider.logo_url || undefined} />
                    <AvatarFallback>
                      <Building2 className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{provider.business_name || "Unnamed Business"}</p>
                    <p className="text-sm text-muted-foreground">
                      {provider.primary_contact_name} • {provider.primary_contact_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {provider.submitted_for_review_at 
                        ? format(new Date(provider.submitted_for_review_at), "PPp")
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedProvider && !showRejectDialog} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Review Application
            </DialogTitle>
            <DialogDescription>
              Review the provider's documentation and approve or reject their application
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6">
              {/* Business Info */}
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedProvider.logo_url || undefined} />
                  <AvatarFallback>
                    <Building2 className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedProvider.business_name}</h3>
                  <p className="text-muted-foreground">{selectedProvider.bio}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedProvider.primary_contact_email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedProvider.primary_contact_phone || "Not provided"}</span>
                </div>
              </div>

              {/* Checklist Status */}
              <div className="space-y-3">
                <h4 className="font-medium">Verification Status</h4>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Insurance (COI)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedProvider.insurance_doc_url ? (
                        <>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                            Uploaded
                          </Badge>
                          {selectedProvider.insurance_expiry && (
                            <span className="text-xs text-muted-foreground">
                              Expires: {format(new Date(selectedProvider.insurance_expiry), "PP")}
                            </span>
                          )}
                        </>
                      ) : (
                        <Badge variant="destructive">Missing</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>W-9 Form</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedProvider.w9_doc_url ? (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                          Uploaded
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Missing</Badge>
                      )}
                      {selectedProvider.ein && (
                        <span className="text-xs text-muted-foreground">
                          EIN: {selectedProvider.ein}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Stripe Connected</span>
                    </div>
                    {selectedProvider.stripe_connected ? (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Not Connected</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Terms Accepted</span>
                    </div>
                    {selectedProvider.terms_accepted ? (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                        Accepted {selectedProvider.terms_accepted_at 
                          ? format(new Date(selectedProvider.terms_accepted_at), "PP")
                          : ""}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Not Accepted</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(true);
              }}
              disabled={processing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => selectedProvider && handleApprove(selectedProvider)}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. 
              The provider will see this message.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason || processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
