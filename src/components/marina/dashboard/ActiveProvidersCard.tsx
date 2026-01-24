import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Wrench, Shield, ShieldCheck, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActiveProvider {
  id: string;
  provider_id: string;
  provider_name: string;
  business_name?: string;
  service_type?: string;
  boat_name: string;
  slip_number?: string;
  started_at: string;
  work_order_id: string;
  insurance_verified: boolean;
  insurance_expiry?: string;
}

interface ActiveProvidersCardProps {
  onMessageProvider?: (workOrderId: string, providerId: string) => void;
}

export function ActiveProvidersCard({ onMessageProvider }: ActiveProvidersCardProps) {
  const [providers, setProviders] = useState<ActiveProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveProviders = async () => {
      // Fetch active dock work orders with provider details
      const { data: dockWorkOrders } = await supabase
        .from("dock_work_orders")
        .select(`
          id,
          provider_id,
          provider_name,
          service_type,
          started_at,
          work_order_id,
          dock_status:dock_status_id (
            slip_number,
            boats:boat_id (name)
          )
        `)
        .eq("is_active", true)
        .order("started_at", { ascending: false });

      if (!dockWorkOrders || dockWorkOrders.length === 0) {
        setProviders([]);
        setLoading(false);
        return;
      }

      // Get provider profiles for insurance info
      const providerIds = [...new Set(dockWorkOrders.map(wo => wo.provider_id))];
      const { data: providerProfiles } = await supabase
        .from("provider_profiles")
        .select("user_id, business_name, insurance_expiry, onboarding_status")
        .in("user_id", providerIds);

      const combined: ActiveProvider[] = dockWorkOrders.map((wo: any) => {
        const profile = providerProfiles?.find(p => p.user_id === wo.provider_id);
        const insuranceExpiry = profile?.insurance_expiry;
        const isInsuranceValid = insuranceExpiry 
          ? new Date(insuranceExpiry) > new Date() 
          : false;

        return {
          id: wo.id,
          provider_id: wo.provider_id,
          provider_name: wo.provider_name || "Unknown Provider",
          business_name: profile?.business_name,
          service_type: wo.service_type,
          boat_name: wo.dock_status?.boats?.name || "Unknown Vessel",
          slip_number: wo.dock_status?.slip_number,
          started_at: wo.started_at,
          work_order_id: wo.work_order_id,
          insurance_verified: isInsuranceValid && profile?.onboarding_status === "approved",
          insurance_expiry: insuranceExpiry,
        };
      });

      setProviders(combined);
      setLoading(false);
    };

    fetchActiveProviders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("active_providers")
      .on("postgres_changes", { event: "*", schema: "public", table: "dock_work_orders" }, () => {
        fetchActiveProviders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Providers On-Site
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Providers On-Site
          {providers.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {providers.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No providers currently on-site
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {provider.business_name || provider.provider_name}
                        </span>
                        {provider.insurance_verified ? (
                          <Badge variant="default" className="text-xs gap-1 bg-green-600">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <Shield className="w-3 h-3" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{provider.boat_name}</span>
                        {provider.slip_number && (
                          <>
                            <span>•</span>
                            <span>Slip {provider.slip_number}</span>
                          </>
                        )}
                      </div>
                      {provider.service_type && (
                        <Badge variant="outline" className="mt-1.5 text-xs">
                          {provider.service_type}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Started {formatDistanceToNow(new Date(provider.started_at), { addSuffix: true })}
                      </p>
                    </div>
                    {onMessageProvider && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMessageProvider(provider.work_order_id, provider.provider_id)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
