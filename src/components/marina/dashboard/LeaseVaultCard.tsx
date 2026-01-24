import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  FileText, 
  Ship, 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  ExternalLink,
  Loader2,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";

interface LeaseTenant {
  id: string;
  boat_id: string;
  boat_name: string;
  boat_length_ft?: number;
  owner_name?: string;
  slip_number?: string;
  stay_type: string;
  insurance_url?: string;
  insurance_expiry?: string;
  registration_url?: string;
  insurance_verified: boolean;
  registration_verified: boolean;
}

export function LeaseVaultCard() {
  const [tenants, setTenants] = useState<LeaseTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<LeaseTenant | null>(null);

  useEffect(() => {
    const fetchLongTermTenants = async () => {
      // Fetch long-term reservations (checked_in with stay_type != transient)
      const { data: reservations } = await supabase
        .from("marina_reservations")
        .select(`
          id,
          boat_id,
          owner_id,
          assigned_slip,
          stay_type,
          insurance_verified,
          registration_verified,
          boats:boat_id (name, length_ft),
          profiles:owner_id (full_name)
        `)
        .eq("status", "checked_in")
        .neq("stay_type", "transient");

      if (!reservations || reservations.length === 0) {
        setTenants([]);
        setLoading(false);
        return;
      }

      // Fetch documents from vessel_documents for each boat
      const boatIds = reservations.map(r => r.boat_id);
      const { data: documents } = await supabase
        .from("vessel_documents")
        .select("boat_id, category, file_url, expiry_date")
        .in("boat_id", boatIds)
        .in("category", ["insurance", "registration"]);

      const combined: LeaseTenant[] = reservations.map((r: any) => {
        const boatDocs = documents?.filter((d: any) => d.boat_id === r.boat_id) || [];
        const insurance = boatDocs.find((d: any) => d.category === "insurance");
        const registration = boatDocs.find((d: any) => d.category === "registration");

        return {
          id: r.id,
          boat_id: r.boat_id,
          boat_name: r.boats?.name || "Unknown",
          boat_length_ft: r.boats?.length_ft,
          owner_name: r.profiles?.full_name,
          slip_number: r.assigned_slip,
          stay_type: r.stay_type,
          insurance_url: insurance?.file_url,
          insurance_expiry: insurance?.expiry_date,
          registration_url: registration?.file_url,
          insurance_verified: r.insurance_verified || false,
          registration_verified: r.registration_verified || false,
        };
      });

      setTenants(combined);
      setLoading(false);
    };

    fetchLongTermTenants();
  }, []);

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { status: "expired", label: "Expired", variant: "destructive" as const };
    if (days <= 30) return { status: "warning", label: `${days}d left`, variant: "secondary" as const };
    return { status: "valid", label: format(new Date(expiryDate), "MMM d, yyyy"), variant: "outline" as const };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Lease Vault
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Lease Vault
            {tenants.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {tenants.length} tenants
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No long-term tenants
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {tenants.map((tenant) => {
                  const insuranceStatus = getExpiryStatus(tenant.insurance_expiry);
                  const hasIssues = !tenant.insurance_url || !tenant.registration_url || 
                    insuranceStatus?.status === "expired" || insuranceStatus?.status === "warning";

                  return (
                    <div
                      key={tenant.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTenant(tenant)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Ship className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">{tenant.boat_name}</span>
                            {hasIssues && (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 ml-6">
                            {tenant.slip_number && <span>Slip {tenant.slip_number}</span>}
                            <Badge variant="outline" className="capitalize text-xs">
                              {tenant.stay_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            <div className="flex items-center gap-1">
                              <Shield className={`w-3 h-3 ${tenant.insurance_url ? "text-green-600" : "text-muted-foreground"}`} />
                              <span className="text-xs text-muted-foreground">Insurance</span>
                              {insuranceStatus && (
                                <Badge variant={insuranceStatus.variant} className="text-xs">
                                  {insuranceStatus.label}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileCheck className={`w-3 h-3 ${tenant.registration_url ? "text-green-600" : "text-muted-foreground"}`} />
                              <span className="text-xs text-muted-foreground">Reg</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ship className="w-5 h-5" />
              {selectedTenant?.boat_name} Documents
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Insurance</p>
                    {selectedTenant?.insurance_expiry && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {format(new Date(selectedTenant.insurance_expiry), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
                {selectedTenant?.insurance_url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedTenant.insurance_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </a>
                  </Button>
                ) : (
                  <Badge variant="secondary">Not uploaded</Badge>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Registration</p>
                  </div>
                </div>
                {selectedTenant?.registration_url ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedTenant.registration_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </a>
                  </Button>
                ) : (
                  <Badge variant="secondary">Not uploaded</Badge>
                )}
              </div>
            </div>

            {selectedTenant?.owner_name && (
              <p className="text-sm text-muted-foreground">
                Owner: {selectedTenant.owner_name}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
