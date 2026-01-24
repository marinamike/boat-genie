import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  FileCheck, 
  CheckCircle, 
  XCircle, 
  Eye,
  ExternalLink,
  Loader2,
  History,
  User,
  Ship,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

interface ProviderDoc {
  id: string;
  user_id: string;
  business_name: string;
  insurance_doc_url?: string;
  insurance_expiry?: string;
  w9_doc_url?: string;
  onboarding_status: string;
  submitted_for_review_at?: string;
}

interface OwnerDoc {
  id: string;
  reservation_id: string;
  boat_name: string;
  owner_name?: string;
  insurance_url?: string;
  registration_url?: string;
  insurance_verified: boolean;
  registration_verified: boolean;
  stay_type: string;
}

interface AuditLog {
  id: string;
  provider_id: string;
  provider_name?: string;
  action: string;
  verified_by_name?: string;
  verified_by_email?: string;
  coi_verified: boolean;
  w9_verified: boolean;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
}

export function ComplianceQueue() {
  const [providerDocs, setProviderDocs] = useState<ProviderDoc[]>([]);
  const [ownerDocs, setOwnerDocs] = useState<OwnerDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderDoc | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // Fetch pending provider reviews
      const { data: providers } = await supabase
        .from("provider_profiles")
        .select("id, user_id, business_name, insurance_doc_url, insurance_expiry, w9_doc_url, onboarding_status, submitted_for_review_at")
        .eq("onboarding_status", "pending_review")
        .order("submitted_for_review_at", { ascending: true });

      setProviderDocs((providers as ProviderDoc[]) || []);

      // Fetch long-term reservations needing document verification
      const { data: reservations } = await supabase
        .from("marina_reservations")
        .select(`
          id,
          stay_type,
          insurance_verified,
          registration_verified,
          boats:boat_id (name),
          profiles:owner_id (full_name)
        `)
        .neq("stay_type", "transient")
        .in("status", ["approved", "checked_in"])
        .or("insurance_verified.eq.false,registration_verified.eq.false");

      const ownerDocsData: OwnerDoc[] = (reservations || []).map((r: any) => ({
        id: r.id,
        reservation_id: r.id,
        boat_name: r.boats?.name || "Unknown",
        owner_name: r.profiles?.full_name,
        insurance_verified: r.insurance_verified || false,
        registration_verified: r.registration_verified || false,
        stay_type: r.stay_type,
      }));

      setOwnerDocs(ownerDocsData);

      // Fetch audit logs
      const { data: logs } = await supabase
        .from("provider_approval_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      // Get provider names for logs
      if (logs && logs.length > 0) {
        const providerIds = [...new Set(logs.map(l => l.provider_id))];
        const { data: providerNames } = await supabase
          .from("provider_profiles")
          .select("id, business_name")
          .in("id", providerIds);

        const nameMap = new Map((providerNames || []).map(p => [p.id, p.business_name]));

        setAuditLogs(logs.map(l => ({
          ...l,
          provider_name: nameMap.get(l.provider_id) || "Unknown",
        })));
      }
    } catch (error) {
      console.error("Error fetching compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async () => {
    if (!selectedProvider) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update provider status
      const { error: updateError } = await supabase
        .from("provider_profiles")
        .update({
          onboarding_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", selectedProvider.id);

      if (updateError) throw updateError;

      // Create audit log
      await supabase.from("provider_approval_logs").insert({
        provider_id: selectedProvider.id,
        action: "approved",
        verified_by: user?.id,
        verified_by_name: user?.user_metadata?.full_name || "Admin",
        verified_by_email: user?.email,
        coi_verified: !!selectedProvider.insurance_doc_url,
        w9_verified: !!selectedProvider.w9_doc_url,
        notes,
      });

      toast({ title: "Provider approved successfully" });
      setSelectedProvider(null);
      setActionType(null);
      setNotes("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProvider || !notes) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update provider status
      const { error: updateError } = await supabase
        .from("provider_profiles")
        .update({
          onboarding_status: "rejected",
          rejection_reason: notes,
        })
        .eq("id", selectedProvider.id);

      if (updateError) throw updateError;

      // Create audit log
      await supabase.from("provider_approval_logs").insert({
        provider_id: selectedProvider.id,
        action: "rejected",
        verified_by: user?.id,
        verified_by_name: user?.user_metadata?.full_name || "Admin",
        verified_by_email: user?.email,
        coi_verified: false,
        w9_verified: false,
        rejection_reason: notes,
      });

      toast({ title: "Provider rejected" });
      setSelectedProvider(null);
      setActionType(null);
      setNotes("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const verifyOwnerDoc = async (reservationId: string, docType: "insurance" | "registration") => {
    try {
      const field = docType === "insurance" ? "insurance_verified" : "registration_verified";
      await supabase
        .from("marina_reservations")
        .update({ [field]: true })
        .eq("id", reservationId);

      toast({ title: `${docType.charAt(0).toUpperCase() + docType.slice(1)} verified` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    <>
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers" className="gap-2">
            <Shield className="w-4 h-4" />
            Provider Docs
            {providerDocs.length > 0 && (
              <Badge variant="destructive" className="ml-1">{providerDocs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="owners" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Owner Docs
            {ownerDocs.length > 0 && (
              <Badge variant="secondary" className="ml-1">{ownerDocs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Provider Insurance & Certification Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {providerDocs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No pending provider reviews</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {providerDocs.map((provider) => (
                      <div
                        key={provider.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold">{provider.business_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Shield className={provider.insurance_doc_url ? "w-4 h-4 text-green-500" : "w-4 h-4 text-muted-foreground"} />
                                <span>COI</span>
                                {provider.insurance_doc_url && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                    <a href={provider.insurance_doc_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <FileCheck className={provider.w9_doc_url ? "w-4 h-4 text-green-500" : "w-4 h-4 text-muted-foreground"} />
                                <span>W-9</span>
                                {provider.w9_doc_url && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                    <a href={provider.w9_doc_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                            {provider.submitted_for_review_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Submitted {formatDistanceToNow(new Date(provider.submitted_for_review_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => { setSelectedProvider(provider); setActionType("approve"); }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => { setSelectedProvider(provider); setActionType("reject"); }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Owner Documents for Long-Term Stays
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ownerDocs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>All owner documents verified</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {ownerDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Ship className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{doc.boat_name}</span>
                              <Badge variant="outline" className="capitalize">{doc.stay_type}</Badge>
                            </div>
                            {doc.owner_name && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Owner: {doc.owner_name}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Shield className={doc.insurance_verified ? "w-4 h-4 text-green-500" : "w-4 h-4 text-amber-500"} />
                                <span className="text-sm">Insurance</span>
                                {!doc.insurance_verified && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => verifyOwnerDoc(doc.id, "insurance")}
                                  >
                                    Verify
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <FileCheck className={doc.registration_verified ? "w-4 h-4 text-green-500" : "w-4 h-4 text-amber-500"} />
                                <span className="text-sm">Registration</span>
                                {!doc.registration_verified && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => verifyOwnerDoc(doc.id, "registration")}
                                  >
                                    Verify
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Approval Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No audit history yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={log.action === "approved" ? "default" : "destructive"}>
                                {log.action}
                              </Badge>
                              <span className="font-medium">{log.provider_name}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.verified_by_name || log.verified_by_email || "Unknown"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </div>
                            </div>
                            {log.coi_verified && (
                              <Badge variant="outline" className="mt-2 mr-1 text-xs">COI ✓</Badge>
                            )}
                            {log.w9_verified && (
                              <Badge variant="outline" className="mt-2 text-xs">W-9 ✓</Badge>
                            )}
                            {log.rejection_reason && (
                              <p className="text-sm text-destructive mt-2">
                                Reason: {log.rejection_reason}
                              </p>
                            )}
                            {log.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Notes: {log.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={actionType === "approve"} onOpenChange={() => { setActionType(null); setNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Approve <strong>{selectedProvider?.business_name}</strong> to join the marketplace?
            </p>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any verification notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={actionType === "reject"} onOpenChange={() => { setActionType(null); setNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for Rejection *</Label>
              <Textarea
                placeholder="Explain why this provider is being rejected..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !notes}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
