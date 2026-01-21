import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Building2, Mail, Phone, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, parseISO } from "date-fns";

interface ProviderWithInsurance {
  id: string;
  user_id: string;
  business_name: string | null;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  insurance_expiry: string | null;
  onboarding_status: string;
}

export function InsuranceExpiryAlerts() {
  const [expiringProviders, setExpiringProviders] = useState<ProviderWithInsurance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringProviders();
  }, []);

  const fetchExpiringProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("id, user_id, business_name, logo_url, primary_contact_name, primary_contact_phone, primary_contact_email, insurance_expiry, onboarding_status")
        .eq("onboarding_status", "active")
        .not("insurance_expiry", "is", null)
        .order("insurance_expiry", { ascending: true });

      if (error) throw error;

      // Filter to only those expiring within 30 days
      const now = new Date();
      const filtered = (data || []).filter((provider) => {
        if (!provider.insurance_expiry) return false;
        const expiryDate = parseISO(provider.insurance_expiry);
        const daysUntilExpiry = differenceInDays(expiryDate, now);
        return daysUntilExpiry <= 30;
      });

      setExpiringProviders(filtered);
    } catch (error) {
      console.error("Error fetching providers with expiring insurance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    return differenceInDays(parseISO(expiryDate), new Date());
  };

  const getExpiryBadge = (daysLeft: number) => {
    if (daysLeft < 0) {
      return <Badge variant="destructive">EXPIRED</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge variant="destructive">Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</Badge>;
    } else {
      return <Badge className="bg-orange-500/20 text-orange-700">Expires in {daysLeft} days</Badge>;
    }
  };

  if (loading) {
    return null;
  }

  if (expiringProviders.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-red-500/50 bg-red-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Insurance Expiry Alerts
        </CardTitle>
        <CardDescription className="text-red-600/80">
          {expiringProviders.length} provider{expiringProviders.length !== 1 ? 's' : ''} with insurance expiring within 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-4">
          <div className="space-y-3">
            {expiringProviders.map((provider) => {
              const daysLeft = provider.insurance_expiry 
                ? getDaysUntilExpiry(provider.insurance_expiry) 
                : 0;
              const isExpired = daysLeft < 0;
              const isCritical = daysLeft <= 7;

              return (
                <div
                  key={provider.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                    isExpired 
                      ? "border-red-500 bg-red-500/10" 
                      : isCritical 
                        ? "border-red-400 bg-red-500/5" 
                        : "border-orange-400 bg-orange-500/5"
                  }`}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={provider.logo_url || undefined} />
                    <AvatarFallback className={isExpired ? "bg-red-500/20" : ""}>
                      <Building2 className={`w-6 h-6 ${isExpired ? "text-red-600" : ""}`} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold truncate ${isExpired ? "text-red-600" : ""}`}>
                        {provider.business_name || "Unnamed Business"}
                      </p>
                      {getExpiryBadge(daysLeft)}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {provider.primary_contact_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {provider.primary_contact_email}
                        </span>
                      )}
                      {provider.primary_contact_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {provider.primary_contact_phone}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Insurance expires: {provider.insurance_expiry 
                        ? format(parseISO(provider.insurance_expiry), "PPP")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
