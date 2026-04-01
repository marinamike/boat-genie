import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Sparkles, Wrench, Paintbrush, Upload, X, ChevronLeft, Info, Loader2, MapPin, Zap, Scissors, Anchor, Settings } from "lucide-react";
import { useWishForm, SERVICE_CATEGORIES, ServiceCategory, type ServiceRate } from "@/hooks/useWishForm";
import { ProviderService } from "@/hooks/useProviderServices";
import { useServiceProviders, useProviderServicesByBusiness, ServiceProvider } from "@/hooks/useServiceProviders";
import { ProviderSearchResults } from "./ProviderSearchResults";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { ReservationRequestSheet } from "@/components/marina/ReservationRequestSheet";

interface Boat {
  id: string;
  name: string;
  length_ft: number | null;
  make: string | null;
  model: string | null;
}

interface WishFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boats?: Boat[];
  membershipTier?: "standard" | "genie";
  preselectedBoatId?: string | null;
  prefilledDescription?: string;
  onSuccess?: () => void;
}

type Step = "select-boat" | "select-category" | "select-provider" | "form" | "find-marina";

const categoryIcons: Record<string, typeof Sparkles> = {
  wash_detail: Sparkles,
  mechanical: Wrench,
  electrical: Zap,
  hull_bottom: Paintbrush,
  canvas_upholstery: Scissors,
  rigging: Anchor,
  general: Settings,
  find_marina: MapPin,
};

export function WishFormSheet({ open, onOpenChange, boats = [], membershipTier = "standard", preselectedBoatId, prefilledDescription, onSuccess }: WishFormSheetProps) {
  const [step, setStep] = useState<Step>("select-boat");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedProviderService, setSelectedProviderService] = useState<(ProviderService & { provider?: { business_name: string | null } }) | null>(null);
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [earliestAvailability, setEarliestAvailability] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [internalBoats, setInternalBoats] = useState<Boat[]>([]);
  const [showMarinaReservation, setShowMarinaReservation] = useState(false);

  const { loading, serviceRates, fetchServiceRates, calculatePrice, uploadPhotos, submitWish } = useWishForm();
  
  // Fetch providers for the selected category
  const { providers, loading: loadingProviders } = useServiceProviders(selectedCategory || undefined);
  
  // Fetch services for the selected provider
  const { services: providerServices, loading: loadingServices } = useProviderServicesByBusiness(
    selectedProvider?.id,
    selectedCategory || undefined
  );

  // Fetch boats if not provided
  useEffect(() => {
    const fetchBoats = async () => {
      if (boats.length === 0 && open) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("boats")
            .select("id, name, length_ft, make, model")
            .eq("owner_id", user.id);
          if (data) {
            setInternalBoats(data as Boat[]);
          }
        }
      }
    };
    fetchBoats();
  }, [boats, open]);

  const effectiveBoats = boats.length > 0 ? boats : internalBoats;

  useEffect(() => {
    if (open) {
      fetchServiceRates();
    }
  }, [open, fetchServiceRates]);

  useEffect(() => {
    if (!open) {
      // Reset form when closed
      setStep("select-boat");
      setSelectedBoat(null);
      setSelectedCategory(null);
      setSelectedProvider(null);
      setSelectedService("");
      setSelectedProviderService(null);
      setDescription("");
      setIsEmergency(false);
      setPreferredDate("");
      setEarliestAvailability(false);
      setPhotos([]);
      setPhotoUrls([]);
    } else if (prefilledDescription) {
      // Pre-fill description if provided
      setDescription(prefilledDescription);
    }
  }, [open, prefilledDescription]);

  // Reset provider and service when category changes
  useEffect(() => {
    setSelectedProvider(null);
    setSelectedService("");
    setSelectedProviderService(null);
  }, [selectedCategory]);

  // Auto-select boat if only one, or use preselected boat
  useEffect(() => {
    if (open && step === "select-boat" && effectiveBoats.length > 0) {
      // If a boat is preselected, use that
      if (preselectedBoatId) {
        const preselectedBoat = effectiveBoats.find((b) => b.id === preselectedBoatId);
        if (preselectedBoat) {
          setSelectedBoat(preselectedBoat);
          setStep("select-category");
          return;
        }
      }
      // Otherwise auto-select if only one boat
      if (effectiveBoats.length === 1) {
        setSelectedBoat(effectiveBoats[0]);
        setStep("select-category");
      }
    }
  }, [open, effectiveBoats, step, preselectedBoatId]);

  // Reset selected service when provider changes
  useEffect(() => {
    setSelectedService("");
    setSelectedProviderService(null);
  }, [selectedProvider]);

  const getMatchingServiceRate = (): ServiceRate | null => {
    if (!selectedService) return null;
    return serviceRates.find((r) => r.service_name === selectedService) || null;
  };

  // Calculate price from provider service
  const calculateProviderServicePrice = (): { basePrice: number; serviceFee: number; emergencyFee: number; totalPrice: number } | null => {
    if (!selectedProviderService || !selectedBoat?.length_ft) return null;
    
    let basePrice = 0;
    if (selectedProviderService.pricing_model === "per_foot") {
      basePrice = selectedProviderService.price * selectedBoat.length_ft;
    } else {
      basePrice = selectedProviderService.price;
    }

    const serviceFee = membershipTier === "genie" ? 0 : basePrice * 0.05;
    const emergencyFee = isEmergency ? (membershipTier === "genie" ? 50 : 150) : 0;
    const totalPrice = basePrice + serviceFee + emergencyFee;

    return { basePrice, serviceFee, emergencyFee, totalPrice };
  };

  const getPriceBreakdown = () => {
    // First try provider service pricing
    if (selectedProviderService) {
      return calculateProviderServicePrice();
    }
    
    // Fallback to system service rates
    const rate = getMatchingServiceRate();
    if (!rate || !selectedBoat?.length_ft) return null;
    return calculatePrice(rate, selectedBoat.length_ft, membershipTier, isEmergency);
  };

  const handleProviderServiceSelect = (serviceId: string) => {
    const service = providerServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedProviderService({
        ...service,
        provider_id: selectedProvider?.id || "",
        is_active: true,
        is_locked: false,
        locked_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: service.description || null,
        provider: { business_name: selectedProvider?.business_name || null }
      });
      setSelectedService(service.service_name);
    } else {
      setSelectedProviderService(null);
      setSelectedService("");
    }
  };

  const handleSelectProvider = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setStep("form");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      alert("Maximum 5 photos allowed");
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPhotoUrls((prev) => [...prev, url]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!selectedBoat || !selectedCategory || !description.trim()) return;

    // Validate hull_bottom requires photos
    if (selectedCategory === "hull_bottom" && photos.length === 0) {
      alert("Please upload at least one photo for hull & bottom services");
      return;
    }

    // Upload photos if any
    let uploadedPhotoUrls: string[] = [];
    if (photos.length > 0) {
      const { data: { user } } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
      if (user) {
        uploadedPhotoUrls = await uploadPhotos(photos, user.id);
      }
    }

    const priceBreakdown = getPriceBreakdown();

    const success = await submitWish({
      boatId: selectedBoat.id,
      serviceCategory: selectedCategory,
      serviceType: selectedService || selectedCategory,
      description: earliestAvailability ? `[Earliest availability requested] ${description}` : description,
      urgency: isEmergency ? "urgent" : "normal",
      isEmergency,
      preferredDate: earliestAvailability ? undefined : (preferredDate || undefined),
      calculatedPrice: priceBreakdown?.totalPrice,
      photos: uploadedPhotoUrls,
      
    });

    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const renderBoatSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Which boat needs service?</p>
      <div className="space-y-2">
        {effectiveBoats.map((boat) => (
          <Card
            key={boat.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              selectedBoat?.id === boat.id && "border-primary bg-primary/5"
            )}
            onClick={() => {
              setSelectedBoat(boat);
              setStep("select-category");
            }}
          >
            <CardContent className="p-4">
              <div className="font-medium">{boat.name}</div>
              <div className="text-sm text-muted-foreground">
                {boat.make} {boat.model} • {boat.length_ft}ft
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCategorySelection = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep("select-boat")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <p className="text-sm text-muted-foreground">What type of service do you need?</p>
      <div className="space-y-3">
        {(Object.entries(SERVICE_CATEGORIES) as [ServiceCategory, typeof SERVICE_CATEGORIES.wash_detail][]).map(
          ([key, category]) => {
            const Icon = categoryIcons[key];
            return (
              <Card
                key={key}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary",
                  selectedCategory === key && "border-primary bg-primary/5"
                )}
                onClick={() => {
                  setSelectedCategory(key);
                  // All categories go through provider selection
                  setStep("select-provider");
                }}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{category.label}</div>
                    <div className="text-sm text-muted-foreground">{category.description}</div>
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}

        {/* Find Marina Option */}
        <Card
          className="cursor-pointer transition-all hover:border-primary border-dashed"
          onClick={() => setShowMarinaReservation(true)}
        >
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-medium">Find a Marina</div>
              <div className="text-sm text-muted-foreground">Request a slip for transient or long-term stays</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderForm = () => {
    if (!selectedCategory) return null;
    const category = SERVICE_CATEGORIES[selectedCategory];
    const priceBreakdown = getPriceBreakdown();

    // Use provider services when provider is selected
    const useProviderServicesDropdown = selectedProvider && providerServices.length > 0;

    // Determine back button behavior
    const handleBackFromForm = () => {
      if (selectedProvider) {
        setStep("select-provider");
      } else {
        setStep("select-category");
      }
    };

    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={handleBackFromForm} className="mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {/* Header with provider context */}
        {selectedProvider ? (
          <div className="space-y-2 pb-2 border-b">
            <h3 className="font-semibold text-lg">
              Requesting {category.label} from {selectedProvider.business_name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedBoat?.name}</Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pb-2 border-b">
            <Badge variant="secondary">{selectedBoat?.name}</Badge>
            <Badge variant="outline">{category.label}</Badge>
          </div>
        )}

        {/* Service Selection - Provider Services */}
        <div className="space-y-2">
          <Label>Select Service</Label>
          {loadingServices ? (
            <div className="flex items-center gap-2 p-3 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading available services...</span>
            </div>
          ) : useProviderServicesDropdown ? (
            <Select value={selectedProviderService?.id || ""} onValueChange={handleProviderServiceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service..." />
              </SelectTrigger>
              <SelectContent>
                {providerServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{service.service_name}</span>
                      <span className="text-muted-foreground">
                        ${service.price.toFixed(2)}
                        {service.pricing_model === "per_foot" ? "/ft" : ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">No services available for this provider in this category.</p>
          )}
        </div>

        {/* Instant Price Display */}
        {priceBreakdown && (selectedProviderService || getMatchingServiceRate()) && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">Instant Price</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(priceBreakdown.totalPrice)}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {selectedProviderService ? (
                    <>
                      {selectedProviderService.pricing_model === "per_foot" ? (
                        <div>{selectedBoat?.length_ft}ft × {formatPrice(selectedProviderService.price)}/ft</div>
                      ) : (
                        <div>Flat rate: {formatPrice(selectedProviderService.price)}</div>
                      )}
                    </>
                  ) : (
                    <div>{selectedBoat?.length_ft}ft × {formatPrice(getMatchingServiceRate()?.rate_per_foot || 0)}/ft</div>
                  )}
                  {priceBreakdown.serviceFee > 0 && (
                    <div>+ {formatPrice(priceBreakdown.serviceFee)} service fee</div>
                  )}
                  {priceBreakdown.emergencyFee > 0 && (
                    <div className="text-destructive">+ {formatPrice(priceBreakdown.emergencyFee)} emergency</div>
                  )}
                </div>
              </div>
              {selectedProviderService?.provider && (
                <div className="mt-2 pt-2 border-t border-primary/20">
                  <span className="text-xs text-muted-foreground">
                    Provider: {selectedProviderService.provider.business_name || "Service Provider"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Broker Model Info for Mechanical */}
        {selectedCategory === "mechanical" && (
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-700 dark:text-blue-300">Custom Quote Service</div>
                <div className="text-blue-600 dark:text-blue-400">
                  Describe your issue and providers will submit quotes. A 5% service fee applies upon job approval.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Upload for Hull & Bottom */}
        {selectedCategory === "hull_bottom" && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Photos <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground">(Required - at least 1)</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {selectedCategory === "mechanical" ? "Describe the Issue" : "Special Requests / Notes"}
          </Label>
          <Textarea
            id="description"
            placeholder={
              selectedCategory === "mechanical"
                ? "Please describe what's happening with your boat..."
                : "Any special instructions or requests..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Preferred Date */}
        <div className="space-y-2">
          <Label htmlFor="preferred-date">Preferred Date (Optional)</Label>
          <Input
            id="preferred-date"
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            disabled={earliestAvailability}
            className={cn(earliestAvailability && "opacity-50")}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="earliest-availability"
              checked={earliestAvailability}
              onCheckedChange={(checked) => {
                setEarliestAvailability(!!checked);
                if (checked) setPreferredDate("");
              }}
            />
            <Label htmlFor="earliest-availability" className="text-sm font-normal cursor-pointer">
              Earliest availability
            </Label>
          </div>
        </div>

        {/* Emergency Toggle */}
        <Card className={cn("border-2 transition-colors", isEmergency && "border-destructive bg-destructive/5")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className={cn("w-5 h-5", isEmergency ? "text-destructive" : "text-muted-foreground")} />
                <div>
                  <div className="font-medium">Emergency Request</div>
                  <div className="text-sm text-muted-foreground">
                    Priority service • +{formatPrice(membershipTier === "genie" ? 50 : 150)}
                  </div>
                </div>
              </div>
              <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !description.trim() || (selectedCategory === "hull_bottom" && photos.length === 0)}
          className="w-full h-12 text-lg bg-gradient-gold hover:opacity-90"
        >
          {loading ? "Submitting..." : "Submit Wish ✨"}
        </Button>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Make a Wish
            </SheetTitle>
            <SheetDescription>Request service for your boat</SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {step === "select-boat" && renderBoatSelection()}
            {step === "select-category" && renderCategorySelection()}
            {step === "select-provider" && selectedCategory && (
              <ProviderSearchResults
                providers={providers}
                loading={loadingProviders}
                categoryLabel={SERVICE_CATEGORIES[selectedCategory].label}
                onBack={() => setStep("select-category")}
                onSelectProvider={handleSelectProvider}
              />
            )}
            {step === "form" && renderForm()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Marina Reservation Sheet */}
      <ReservationRequestSheet
        open={showMarinaReservation}
        onOpenChange={(open) => {
          setShowMarinaReservation(open);
          if (!open) {
            // Close main sheet when reservation is done
          }
        }}
        boats={effectiveBoats}
        onSuccess={() => {
          setShowMarinaReservation(false);
          onOpenChange(false);
          onSuccess?.();
        }}
      />
    </>
  );
}
