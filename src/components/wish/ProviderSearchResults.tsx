import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Star, Building2 } from "lucide-react";
import { ServiceProvider } from "@/hooks/useServiceProviders";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface ProviderSearchResultsProps {
  providers: ServiceProvider[];
  loading: boolean;
  categoryLabel: string;
  onBack: () => void;
  onSelectProvider: (provider: ServiceProvider) => void;
}

export function ProviderSearchResults({
  providers,
  loading,
  categoryLabel,
  onBack,
  onSelectProvider,
}: ProviderSearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Finding providers for {categoryLabel}...</p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Providers Available</h3>
            <p className="text-muted-foreground text-sm">
              There are no verified providers offering {categoryLabel} services in your area yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      
      <div>
        <h3 className="font-semibold text-lg">Select a Provider</h3>
        <p className="text-sm text-muted-foreground">
          {providers.length} provider{providers.length !== 1 ? "s" : ""} offer {categoryLabel} services
        </p>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary hover:shadow-md",
            )}
            onClick={() => onSelectProvider(provider)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Provider Logo/Avatar */}
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {provider.logo_url ? (
                    <img
                      src={provider.logo_url}
                      alt={provider.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                {/* Provider Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{provider.business_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {provider.rating !== null ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{provider.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">New provider</span>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {provider.service_count} service{provider.service_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                {/* Base Price */}
                <div className="text-right shrink-0">
                  <div className="text-sm text-muted-foreground">From</div>
                  <div className="font-semibold text-primary">
                    {formatPrice(provider.base_price || 0)}
                    {provider.pricing_model === "per_foot" && (
                      <span className="text-xs font-normal text-muted-foreground">/ft</span>
                    )}
                    {provider.pricing_model === "per_hour" && (
                      <span className="text-xs font-normal text-muted-foreground">/hr</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
