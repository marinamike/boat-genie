import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowLeft } from "lucide-react";
import { LeaseVaultCard } from "@/components/marina/dashboard/LeaseVaultCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ship, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";

interface LongTermTenant {
  id: string;
  boat_name: string;
  boat_length_ft?: number;
  owner_name?: string;
  slip_number?: string;
  stay_type: string;
  checked_in_date: string;
  insurance_expiry?: string;
  registration_expiry?: string;
}

const MarinaLeasesPage = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<LongTermTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      const { data: reservations } = await supabase
        .from("marina_reservations")
        .select(`
          id,
          assigned_slip,
          stay_type,
          actual_arrival,
          requested_arrival,
          boats:boat_id (name, length_ft),
          profiles:owner_id (full_name)
        `)
        .eq("status", "checked_in")
        .neq("stay_type", "transient")
        .order("actual_arrival", { ascending: false });

      if (reservations) {
        const mapped: LongTermTenant[] = reservations.map((r: any) => ({
          id: r.id,
          boat_name: r.boats?.name || "Unknown",
          boat_length_ft: r.boats?.length_ft,
          owner_name: r.profiles?.full_name,
          slip_number: r.assigned_slip,
          stay_type: r.stay_type,
          checked_in_date: r.actual_arrival || r.requested_arrival,
        }));
        setTenants(mapped);
      }
      setLoading(false);
    };

    fetchTenants();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Anchor className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground" 
            onClick={() => navigate("/marina")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">Lease Management</h1>
            <p className="text-sm text-primary-foreground/80">Long-Term Tenants</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Document Vault Summary */}
        <LeaseVaultCard />

        {/* All Long-Term Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              All Long-Term Tenants
              {tenants.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {tenants.length} tenants
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ship className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No long-term tenants</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {tenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Ship className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{tenant.boat_name}</span>
                            {tenant.boat_length_ft && (
                              <span className="text-sm text-muted-foreground">
                                {tenant.boat_length_ft}ft
                              </span>
                            )}
                          </div>
                          {tenant.owner_name && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Owner: {tenant.owner_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            {tenant.slip_number && (
                              <Badge variant="outline">Slip {tenant.slip_number}</Badge>
                            )}
                            <Badge variant="secondary" className="capitalize">
                              {tenant.stay_type}
                            </Badge>
                          </div>
                          {tenant.checked_in_date && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Since: {format(new Date(tenant.checked_in_date), "MMM d, yyyy")}
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
      </main>
    </div>
  );
};

export default MarinaLeasesPage;
