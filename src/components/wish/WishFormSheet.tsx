import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Sparkles, Wrench, Paintbrush, ChevronLeft, MapPin,
  Zap, Scissors, Anchor, Settings, Loader2, Droplets, Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  preselectedBoatId?: string | null;
  prefilledDescription?: string;
  onSuccess?: () => void;
}

type Step = "select-boat" | "select-category" | "select-service" | "form";

const WISH_CATEGORIES = [
  { key: "Detailing & Cleaning", label: "Detailing & Cleaning", description: "Wash, wax, and detailing services", icon: Sparkles },
  { key: "Engines & Propulsion", label: "Engines & Propulsion", description: "Engine and drive train repair", icon: Wrench },
  { key: "Electrical & Electronics", label: "Electrical & Electronics", description: "Wiring, electronics, navigation", icon: Zap },
  { key: "Hull, Bottom & Deck", label: "Hull, Bottom & Deck", description: "Bottom paint, fiberglass, gelcoat", icon: Paintbrush },
  { key: "Plumbing & Water Systems", label: "Plumbing & Water Systems", description: "Pumps, heads, watermakers", icon: Droplets },
  { key: "Canvas, Upholstery & Interior", label: "Canvas, Upholstery & Interior", description: "Covers, enclosures, cushions", icon: Scissors },
  { key: "Rigging & Sails", label: "Rigging & Sails", description: "Standing and running rigging", icon: Anchor },
  { key: "Stabilizers & Steering", label: "Stabilizers & Steering", description: "Gyros, hydraulics, steering systems", icon: Compass },
  { key: "Custom Request", label: "Custom Request", description: "Other marine services", icon: Settings },
] as const;

export function WishFormSheet({ open, onOpenChange, boats = [], preselectedBoatId, prefilledDescription, onSuccess }: WishFormSheetProps) {
  const [step, setStep] = useState<Step>("select-boat");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [catalogServices, setCatalogServices] = useState<string[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [earliestAvailability, setEarliestAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [internalBoats, setInternalBoats] = useState<Boat[]>([]);
  const [showMarinaReservation, setShowMarinaReservation] = useState(false);

  const { toast } = useToast();

  // Fetch boats if not provided
  useEffect(() => {
    const fetchBoats = async () => {
      if (boats.length === 0 && open) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("boats")
            .select("id, name, length_ft, make, model")
            .eq("owner_id", user.id);
          if (data) setInternalBoats(data as Boat[]);
        }
      }
    };
    fetchBoats();
  }, [boats, open]);

  const effectiveBoats = boats.length > 0 ? boats : internalBoats;

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setStep("select-boat");
      setSelectedBoat(null);
      setSelectedCategory(null);
      setSelectedService("");
      setCatalogServices([]);
      setDescription("");
      setIsEmergency(false);
      setPreferredDate("");
      setEarliestAvailability(false);
    } else if (prefilledDescription) {
      setDescription(prefilledDescription);
    }
  }, [open, prefilledDescription]);

  // Auto-select boat
  useEffect(() => {
    if (open && step === "select-boat" && effectiveBoats.length > 0) {
      if (preselectedBoatId) {
        const preselectedBoat = effectiveBoats.find((b) => b.id === preselectedBoatId);
        if (preselectedBoat) {
          setSelectedBoat(preselectedBoat);
          setStep("select-category");
          return;
        }
      }
      if (effectiveBoats.length === 1) {
        setSelectedBoat(effectiveBoats[0]);
        setStep("select-category");
      }
    }
  }, [open, effectiveBoats, step, preselectedBoatId]);

  const fetchCatalogServices = useCallback(async (category: string) => {
    setLoadingCatalog(true);
    const { data, error } = await supabase
      .from("service_catalog")
      .select("name")
      .eq("category", category)
      .order("name");

    if (error) {
      console.error("Error fetching catalog services:", error);
      setCatalogServices([]);
    } else {
      setCatalogServices((data || []).map((d) => d.name));
    }
    setLoadingCatalog(false);
  }, []);

  const handleCategorySelect = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setSelectedService("");

    if (categoryKey === "Custom Request") {
      setSelectedService("Custom Request");
      setStep("form");
    } else {
      fetchCatalogServices(categoryKey);
      setStep("select-service");
    }
  };

  const handleSubmit = async () => {
    if (!selectedBoat || !selectedCategory || !description.trim()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to submit a service request.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("wish_forms").insert({
        requester_id: user.id,
        boat_id: selectedBoat.id,
        service_category: selectedCategory,
        service_name: selectedService,
        service_type: selectedService, // backward compat
        description: earliestAvailability ? `[Earliest availability requested] ${description}` : description,
        urgency: isEmergency ? "urgent" : "normal",
        is_emergency: isEmergency,
        preferred_date: earliestAvailability ? null : (preferredDate || null),
        status: "open",
      });

      if (error) {
        console.error("Error submitting wish:", error);
        toast({ title: "Submission Failed", description: "There was an error submitting your request.", variant: "destructive" });
        return;
      }

      toast({ title: "Wish Submitted! ✨", description: "Your service request has been sent. Providers will start quoting soon!" });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error in submitWish:", err);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderBoatSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Which boat needs service?</p>
      <div className="space-y-2">
        {effectiveBoats.map((boat) => (
          <Card
            key={boat.id}
            className={cn("cursor-pointer transition-all hover:border-primary", selectedBoat?.id === boat.id && "border-primary bg-primary/5")}
            onClick={() => { setSelectedBoat(boat); setStep("select-category"); }}
          >
            <CardContent className="p-4">
              <div className="font-medium">{boat.name}</div>
              <div className="text-sm text-muted-foreground">{boat.make} {boat.model} • {boat.length_ft}ft</div>
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
        {WISH_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.key}
              className={cn("cursor-pointer transition-all hover:border-primary", selectedCategory === cat.key && "border-primary bg-primary/5")}
              onClick={() => handleCategorySelect(cat.key)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-sm text-muted-foreground">{cat.description}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Find Marina Option */}
        <Card className="cursor-pointer transition-all hover:border-primary border-dashed" onClick={() => setShowMarinaReservation(true)}>
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

  const renderServiceSelection = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep("select-category")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <div className="flex items-center gap-2 pb-2 border-b">
        <Badge variant="secondary">{selectedBoat?.name}</Badge>
        <Badge variant="outline">{selectedCategory}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">Select a service</p>

      {loadingCatalog ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : catalogServices.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No services found for this category.</p>
      ) : (
        <div className="space-y-2">
          {catalogServices.map((serviceName) => (
            <Card
              key={serviceName}
              className="cursor-pointer transition-all hover:border-primary"
              onClick={() => { setSelectedService(serviceName); setStep("form"); }}
            >
              <CardContent className="p-4">
                <div className="font-medium">{serviceName}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => setStep(selectedCategory === "Custom Request" ? "select-category" : "select-service")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-2 pb-2 border-b flex-wrap">
        <Badge variant="secondary">{selectedBoat?.name}</Badge>
        <Badge variant="outline">{selectedCategory}</Badge>
        {selectedService && selectedService !== "Custom Request" && (
          <Badge>{selectedService}</Badge>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description / Notes <span className="text-destructive">*</span></Label>
        <Textarea
          id="description"
          placeholder="Describe what you need done..."
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
                <div className="text-sm text-muted-foreground">Priority service</div>
              </div>
            </div>
            <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || !description.trim()}
        className="w-full h-12 text-lg bg-gradient-gold hover:opacity-90"
      >
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Wish ✨"}
      </Button>
    </div>
  );

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
            {step === "select-service" && renderServiceSelection()}
            {step === "form" && renderForm()}
          </div>
        </SheetContent>
      </Sheet>

      <ReservationRequestSheet
        open={showMarinaReservation}
        onOpenChange={(open) => setShowMarinaReservation(open)}
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
