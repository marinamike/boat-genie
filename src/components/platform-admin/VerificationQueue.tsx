import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Ban, ExternalLink, Building2, Mail, MapPin, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingBusiness {
  id: string;
  business_name: string;
  address: string | null;
  website_url: string | null;
  contact_email: string | null;
  owner_id: string;
  created_at: string;
  owner_email?: string;
}

export function VerificationQueue() {
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name, address, website_url, contact_email, owner_id, created_at")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch owner emails
      if (data && data.length > 0) {
        const ownerIds = data.map(b => b.owner_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", ownerIds);

        const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
        
        setBusinesses(data.map(b => ({
          ...b,
          owner_email: emailMap.get(b.owner_id) || "Unknown"
        })));
      } else {
        setBusinesses([]);
      }
    } catch (error) {
      console.error("Error fetching pending businesses:", error);
      toast({
        title: "Error",
        description: "Failed to load verification queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBusinesses();
  }, []);

  const handleAction = async (businessId: string, action: "verified" | "rejected" | "suspended") => {
    setActionLoading(businessId);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ 
          verification_status: action,
          is_verified: action === "verified",
          verified_at: action === "verified" ? new Date().toISOString() : null
        })
        .eq("id", businessId);

      if (error) throw error;

      toast({
        title: action === "verified" ? "Business Verified" : action === "rejected" ? "Business Rejected" : "Business Suspended",
        description: `The business has been ${action}.`,
      });

      // Remove from list
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} business`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Verification Queue
        </CardTitle>
        <CardDescription>
          {businesses.length} businesses awaiting verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {businesses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>All caught up! No pending verifications.</p>
          </div>
        ) : (
          businesses.map((business) => (
            <Card key={business.id} className="border-l-4 border-l-warning">
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {business.business_name}
                      </h3>
                      <Badge variant="outline" className="mt-1">Pending</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(business.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {business.address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {business.address}
                      </p>
                    )}
                    {business.website_url && (
                      <a 
                        href={business.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        {business.website_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <p className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {business.owner_email || business.contact_email || "No email"}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(business.id, "verified")}
                      disabled={actionLoading === business.id}
                      className="flex-1"
                    >
                      {actionLoading === business.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(business.id, "rejected")}
                      disabled={actionLoading === business.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(business.id, "suspended")}
                      disabled={actionLoading === business.id}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
