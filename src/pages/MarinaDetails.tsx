import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Anchor,
  Ruler,
  Waves,
  Zap,
  DollarSign,
  Fuel,
  Wifi,
  UtensilsCrossed,
  ShieldCheck,
  WashingMachine,
  Star,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReservationRequestSheet } from "@/components/marina/ReservationRequestSheet";
import { MarineWeatherWidget } from "@/components/weather/MarineWeatherWidget";
import { TideChart } from "@/components/weather/TideChart";
import { useMarineWeather } from "@/hooks/useMarineWeather";

interface Marina {
  id: string;
  marina_name: string;
  address: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  max_length_ft: number | null;
  max_beam_ft: number | null;
  max_draft_ft: number | null;
  min_depth_ft: number | null;
  power_options: string[] | null;
  transient_rate_per_ft: number | null;
  monthly_base_rate: number | null;
  require_insurance_long_term: boolean;
  require_registration: boolean;
  fuel_gas: boolean;
  fuel_diesel: boolean;
  has_pool: boolean;
  has_pumpout: boolean;
  has_laundry: boolean;
  has_restaurant: boolean;
  has_security: boolean;
  has_wifi: boolean;
  photos: string[];
  accepts_transient: boolean;
  accepts_longterm: boolean;
}

interface Provider {
  id: string;
  business_name: string | null;
  service_categories: string[];
  bio: string | null;
}

export default function MarinaDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [marina, setMarina] = useState<Marina | null>(null);
  const [nearbyProviders, setNearbyProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reservationOpen, setReservationOpen] = useState(false);

  // Marine weather based on marina coordinates
  const { data: weatherData, loading: weatherLoading, refetch: refetchWeather } = useMarineWeather(
    marina?.latitude || null,
    marina?.longitude || null,
    marina?.marina_name
  );

  useEffect(() => {
    const fetchMarina = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("marinas")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        // Parse photos from JSON if needed
        const marinaData = data as any;
        setMarina({
          ...marinaData,
          photos: Array.isArray(marinaData.photos) ? marinaData.photos : [],
        });

        // Fetch nearby providers (mock - just get top providers for now)
        const { data: providers } = await supabase
          .from("provider_profiles")
          .select("id, business_name, service_categories, bio")
          .eq("onboarding_status", "approved")
          .limit(5);

        setNearbyProviders((providers || []) as Provider[]);
      } catch (error) {
        console.error("Error fetching marina:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarina();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!marina) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Anchor className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Marina not found</h1>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const amenities = [
    { key: "fuel_gas", label: "Gas", icon: Fuel, enabled: marina.fuel_gas },
    { key: "fuel_diesel", label: "Diesel", icon: Fuel, enabled: marina.fuel_diesel },
    { key: "has_pool", label: "Pool", icon: Waves, enabled: marina.has_pool },
    { key: "has_pumpout", label: "Pump-out", icon: Anchor, enabled: marina.has_pumpout },
    { key: "has_laundry", label: "Laundry", icon: WashingMachine, enabled: marina.has_laundry },
    { key: "has_restaurant", label: "Restaurant", icon: UtensilsCrossed, enabled: marina.has_restaurant },
    { key: "has_security", label: "24/7 Security", icon: ShieldCheck, enabled: marina.has_security },
    { key: "has_wifi", label: "WiFi", icon: Wifi, enabled: marina.has_wifi },
  ].filter((a) => a.enabled);

  const photos = marina.photos.length > 0 
    ? marina.photos 
    : ["/placeholder.svg"];

  const nextPhoto = () => setCurrentPhotoIndex((i) => (i + 1) % photos.length);
  const prevPhoto = () => setCurrentPhotoIndex((i) => (i - 1 + photos.length) % photos.length);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Gallery */}
      <div className="relative h-64 md:h-96 bg-muted">
        <img
          src={photos[currentPhotoIndex]}
          alt={marina.marina_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Navigation */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-black/30 text-white hover:bg-black/50"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Photo controls */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50"
              onClick={prevPhoto}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50"
              onClick={nextPhoto}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhotoIndex(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === currentPhotoIndex ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{marina.marina_name}</h1>
          {marina.address && (
            <p className="text-white/80 flex items-center gap-1 text-sm">
              <MapPin className="w-4 h-4" />
              {marina.address}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button className="flex-1" size="lg" onClick={() => setReservationOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Book Now
          </Button>
          {marina.contact_phone && (
            <Button variant="outline" size="lg" asChild>
              <a href={`tel:${marina.contact_phone}`}>
                <Phone className="w-4 h-4" />
              </a>
            </Button>
          )}
          {marina.website_url && (
            <Button variant="outline" size="lg" asChild>
              <a href={marina.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>

        {/* Marine Weather & Tides */}
        <div className="grid md:grid-cols-2 gap-4">
          <MarineWeatherWidget
            data={weatherData}
            loading={weatherLoading}
            onRefresh={refetchWeather}
          />
          <TideChart data={weatherData?.tides || null} loading={weatherLoading} />
        </div>

        {/* Description */}
        {marina.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{marina.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Specs & Rates */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Vessel Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {marina.max_length_ft && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max LOA</span>
                  <span className="font-medium">{marina.max_length_ft} ft</span>
                </div>
              )}
              {marina.max_beam_ft && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Beam</span>
                  <span className="font-medium">{marina.max_beam_ft} ft</span>
                </div>
              )}
              {marina.max_draft_ft && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Draft</span>
                  <span className="font-medium">{marina.max_draft_ft} ft</span>
                </div>
              )}
              {marina.min_depth_ft && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Depth</span>
                  <span className="font-medium">{marina.min_depth_ft} ft</span>
                </div>
              )}
              {marina.power_options && marina.power_options.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Power
                  </span>
                  <div className="flex gap-1">
                    {marina.power_options.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {marina.transient_rate_per_ft && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transient (per ft/night)</span>
                  <span className="font-medium text-primary">${marina.transient_rate_per_ft}</span>
                </div>
              )}
              {marina.monthly_base_rate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Base</span>
                  <span className="font-medium text-primary">${marina.monthly_base_rate}</span>
                </div>
              )}
              <Separator />
              <div className="flex gap-2 flex-wrap">
                {marina.accepts_transient && <Badge variant="outline">Transient</Badge>}
                {marina.accepts_longterm && <Badge variant="outline">Long-term</Badge>}
              </div>
              {marina.require_insurance_long_term && (
                <p className="text-xs text-muted-foreground">
                  * Insurance required for stays over 30 days
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {amenities.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <div key={amenity.key} className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4 text-primary" />
                      <span>{amenity.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {marina.contact_phone && (
              <a
                href={`tel:${marina.contact_phone}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-muted-foreground" />
                {marina.contact_phone}
              </a>
            )}
            {marina.contact_email && (
              <a
                href={`mailto:${marina.contact_email}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
                {marina.contact_email}
              </a>
            )}
            {marina.website_url && (
              <a
                href={marina.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Globe className="w-4 h-4 text-muted-foreground" />
                {marina.website_url.replace(/^https?:\/\//, "")}
              </a>
            )}
          </CardContent>
        </Card>

        {/* Nearby Service Providers */}
        {nearbyProviders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4" />
                Nearby Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nearbyProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Anchor className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{provider.business_name || "Service Provider"}</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {provider.service_categories.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reservation Sheet */}
      <ReservationRequestSheet
        open={reservationOpen}
        onOpenChange={setReservationOpen}
        preselectedMarinaId={marina.id}
      />
    </div>
  );
}