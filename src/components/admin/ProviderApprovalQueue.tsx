import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CreditCard,
  Calendar,
  Mail,
  Phone,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PhoneLink } from "@/components/ui/phone-link";
import { DocumentViewer } from "./DocumentViewer";

interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  bio: string | null;
  insurance_doc_url: string | null;
  insurance_expiry: string | null;
  w9_doc_url: string | null;
  ein: string | null;
  stripe_connected: boolean;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  submitted_for_review_at: string | null;
}

interface DocumentVerification {
  coiVerified: boolean;
  w9Verified: boolean;
}

export function ProviderApprovalQueue() {
  const [pendingProviders, setPendingProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [verification, setVerification] = useState<DocumentVerification>({
    coiVerified: false,
    w9Verified: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  // Reset verification when provider changes
  useEffect(() => {
    setVerification({ coiVerified: false, w9Verified: false });
  }, [selectedProvider?.id]);

  const fetchPendingProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("onboarding_status", "pending_review")
        .order("submitted_for_review_at", { ascending: true });

      if (error) throw error;
      setPendingProviders(data as ProviderProfile[]);
    } catch (error) {
      console.error("Error fetching pending providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const canApprove = () => {
    if (!selectedProvider) return false;
    
    // Both documents must be uploaded AND verified
    const hasInsurance = !!selectedProvider.insurance_doc_url;
    const hasW9 = !!selectedProvider.w9_doc_url;
    
    // If document exists, it must be verified
    const insuranceOk = !hasInsurance || verification.coiVerified;
    const w9Ok = !hasW9 || verification.w9Verified;
    
    // At minimum, require both documents to exist and be verified
    return hasInsurance && hasW9 && verification.coiVerified && verification.w9Verified;
  };

  const handleApprove = async (provider: ProviderProfile) => {
    if (!canApprove()) {
      toast({
        title: "Verification Required",
        description: "Please verify all documents before approving.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // Get admin profile for name
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", session.user.id)
        .single();

      const adminName = adminProfile?.full_name || session.user.email || "Admin";
      const adminEmail = adminProfile?.email || session.user.email;
      
      // Update provider status
      const { error } = await supabase
        .from("provider_profiles")
        .update({
          onboarding_status: "active",
          approved_at: new Date().toISOString(),
          approved_by: session.user.id,
        })
        .eq("id", provider.id);

      if (error) throw error;

      // Create audit log entry
      const { error: logError } = await supabase
        .from("provider_approval_logs")
        .insert({
          provider_id: provider.id,
          action: "approved",
          verified_by: session.user.id,
          verified_by_name: adminName,
          verified_by_email: adminEmail,
          coi_verified: verification.coiVerified,
          w9_verified: verification.w9Verified,
          notes: `COI and W-9 verified by Admin ${adminName} on ${format(new Date(), "PPpp")}`,
        });

      if (logError) {
        console.error("Failed to create audit log:", logError);
        // Don't fail the approval, just warn
      }
      
      toast({ title: "Provider approved and activated!" });
      await fetchPendingProviders();
      setSelectedProvider(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProvider || !rejectionReason) return;
    
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // Get admin profile for name
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", session.user.id)
        .single();

      const adminName = adminProfile?.full_name || session.user.email || "Admin";
      const adminEmail = adminProfile?.email || session.user.email;

      const { error } = await supabase
        .from("provider_profiles")
        .update({
          onboarding_status: "rejected",
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedProvider.id);

      if (error) throw error;

      // Create audit log entry for rejection
      const { error: logError } = await supabase
        .from("provider_approval_logs")
        .insert({
          provider_id: selectedProvider.id,
          action: "rejected",
          verified_by: session.user.id,
          verified_by_name: adminName,
          verified_by_email: adminEmail,
          coi_verified: verification.coiVerified,
          w9_verified: verification.w9Verified,
          rejection_reason: rejectionReason,
          notes: `Application rejected by Admin ${adminName} on ${format(new Date(), "PPpp")}`,
        });

      if (logError) {
        console.error("Failed to create audit log:", logError);
      }
      
      toast({ title: "Provider application rejected" });
      await fetchPendingProviders();
      setSelectedProvider(null);
      setShowRejectDialog(false);
      setRejectionReason("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Provider Approval Queue
          </CardTitle>
          <CardDescription>
            Review and approve provider onboarding applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {pendingProviders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No pending applications</p>
              </div>
            ) : (
              <div className="space-y-3">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{provider.business_name || "Unnamed Business"}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {provider.primary_contact_email}
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
          </ScrollArea>
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
              Review and verify documentation before approving
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedProvider.primary_contact_email}</span>
                </div>
                <div className="text-sm">
                  <PhoneLink 
                    phone={selectedProvider.primary_contact_phone} 
                    fallbackText="Phone not provided"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Document Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Click "View Document" to review each file, then check "Verified" to confirm.
                </p>
                
                <div className="space-y-2">
                  <DocumentViewer
                    documentUrl={selectedProvider.insurance_doc_url}
                    label="Insurance (COI)"
                    verified={verification.coiVerified}
                    onVerifiedChange={(v) => setVerification(prev => ({ ...prev, coiVerified: v }))}
                  />

                  <DocumentViewer
                    documentUrl={selectedProvider.w9_doc_url}
                    label="W-9 Form"
                    verified={verification.w9Verified}
                    onVerifiedChange={(v) => setVerification(prev => ({ ...prev, w9Verified: v }))}
                  />

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Stripe Connected</span>
                    </div>
                    {selectedProvider.stripe_connected ? (
                      <Badge className="bg-green-500/20 text-green-700">Connected</Badge>
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
                      <Badge className="bg-green-500/20 text-green-700">Accepted</Badge>
                    ) : (
                      <Badge variant="destructive">Not Accepted</Badge>
                    )}
                  </div>
                </div>
              </div>

              {!canApprove() && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">
                    You must verify both Insurance (COI) and W-9 documents before approving.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              disabled={processing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => selectedProvider && handleApprove(selectedProvider)}
              disabled={processing || !canApprove()}
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
              Provide a reason for rejection
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
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
