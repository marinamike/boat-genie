import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Sparkles, Wrench, Paintbrush, Upload, X, ChevronLeft, Info } from "lucide-react";
import { useWishForm, SERVICE_CATEGORIES, ServiceCategory, ServiceRate } from "@/hooks/useWishForm";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

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
  boats: Boat[];
  membershipTier: "standard" | "genie";
  onSuccess?: () => void;
}

type Step = "select-boat" | "select-category" | "form";

const categoryIcons = {
  wash_detail: Sparkles,
  mechanical: Wrench,
  visual_cosmetic: Paintbrush,
};

export function WishFormSheet({ open, onOpenChange, boats, membershipTier, onSuccess }: WishFormSheetProps) {
  const [step, setStep] = useState<Step>("select-boat");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const { loading, serviceRates, fetchServiceRates, calculatePrice, uploadPhotos, submitWish } = useWishForm();

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
      setSelectedService("");
      setDescription("");
      setIsEmergency(false);
      setPreferredDate("");
      setPhotos([]);
      setPhotoUrls([]);
    }
  }, [open]);

  // Auto-select boat if only one
  useEffect(() => {
    if (open && boats.length === 1 && step === "select-boat") {
      setSelectedBoat(boats[0]);
      setStep("select-category");
    }
  }, [open, boats, step]);

  // Auto-select service if only one in category
  useEffect(() => {
    if (selectedCategory && step === "form") {
      const category = SERVICE_CATEGORIES[selectedCategory];
      if (category.services.length === 1 && !selectedService) {
        setSelectedService(category.services[0]);
      }
    }
  }, [selectedCategory, step, selectedService]);

  const getMatchingServiceRate = (): ServiceRate | null => {
    if (!selectedService) return null;
    return serviceRates.find((r) => r.service_name === selectedService) || null;
  };

  const getPriceBreakdown = () => {
    const rate = getMatchingServiceRate();
    if (!rate || !selectedBoat?.length_ft) return null;
    return calculatePrice(rate, selectedBoat.length_ft, membershipTier, isEmergency);
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

    // Validate visual/cosmetic requires photos
    if (selectedCategory === "visual_cosmetic" && photos.length === 0) {
      alert("Please upload at least one photo for visual/cosmetic services");
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
      description,
      urgency: isEmergency ? "urgent" : "normal",
      isEmergency,
      preferredDate: preferredDate || undefined,
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
        {boats.map((boat) => (
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
                  setStep("form");
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
      </div>
    </div>
  );

  const renderForm = () => {
    if (!selectedCategory) return null;
    const category = SERVICE_CATEGORIES[selectedCategory];
    const priceBreakdown = getPriceBreakdown();
    const rate = getMatchingServiceRate();

    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => setStep("select-category")} className="mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <div className="flex items-center gap-2 pb-2 border-b">
          <Badge variant="secondary">{selectedBoat?.name}</Badge>
          <Badge variant="outline">{category.label}</Badge>
        </div>

        {/* Service Selection for categories with multiple services */}
        {category.services.length > 1 && (
          <div className="space-y-2">
            <Label>Select Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service..." />
              </SelectTrigger>
              <SelectContent>
                {category.services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}


        {/* Instant Price Display for Genie Services */}
        {selectedCategory === "wash_detail" && rate && priceBreakdown && (
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
                  <div>{selectedBoat?.length_ft}ft × {formatPrice(rate.rate_per_foot || 0)}/ft</div>
                  {priceBreakdown.serviceFee > 0 && (
                    <div>+ {formatPrice(priceBreakdown.serviceFee)} service fee</div>
                  )}
                  {priceBreakdown.emergencyFee > 0 && (
                    <div className="text-destructive">+ {formatPrice(priceBreakdown.emergencyFee)} emergency</div>
                  )}
                </div>
              </div>
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

        {/* Photo Upload for Visual/Cosmetic */}
        {selectedCategory === "visual_cosmetic" && (
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
          />
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
          disabled={loading || !description.trim() || (selectedCategory === "visual_cosmetic" && photos.length === 0)}
          className="w-full h-12 text-lg bg-gradient-gold hover:opacity-90"
        >
          {loading ? "Submitting..." : "Submit Wish ✨"}
        </Button>
      </div>
    );
  };

  return (
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
          {step === "form" && renderForm()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
