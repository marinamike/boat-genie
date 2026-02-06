import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, CheckCircle, FileText, Upload, ChevronLeft, Anchor, Ship, Ruler, Waves, Zap, MapPin, Search } from "lucide-react";
import { useMarinaReservations, StayType } from "@/hooks/useMarinaReservations";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Boat {
  id: string;
  name: string;
  length_ft: number | null;
  make: string | null;
  model: string | null;
  image_url?: string | null;
}

interface BoatSpecs {
  loa_ft: number | null;
  beam_ft: number | null;
  draft_engines_down_ft: number | null;
  shore_power: string | null;
}

interface Marina {
  id: string;
  marina_name: string;
  address: string | null;
  accepts_transient: boolean | null;
  accepts_longterm: boolean | null;
  power_options: string[] | null;
  max_length_ft?: number | null;
  transient_rate_per_ft?: number | null;
}

interface ReservationRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marina?: Marina | null;
  preselectedMarinaId?: string;
  boats?: Boat[];
  onSuccess?: () => void;
}

type Step = "select-boat" | "select-marina" | "select-stay" | "vessel-specs" | "form" | "upload-docs";

const SHORE_POWER_OPTIONS = [
  { value: "none", label: "No shore power needed" },
  { value: "30A", label: "30 Amp (120V)" },
  { value: "50A-125V", label: "50 Amp (125V)" },
  { value: "50A-250V", label: "50 Amp (250V)" },
  { value: "100A-1P", label: "100 Amp (single phase)" },
  { value: "100A-3P", label: "100 Amp (3-phase)" },
];

const STAY_TYPES: { value: StayType; label: string; description: string; requiresDocs: boolean }[] = [
  {
    value: "transient",
    label: "Transient",
    description: "Short-term stay (days to weeks)",
    requiresDocs: false,
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "One month or more",
    requiresDocs: true,
  },
  {
    value: "seasonal",
    label: "Seasonal",
    description: "Seasonal contract",
    requiresDocs: true,
  },
  {
    value: "annual",
    label: "Annual",
    description: "Year-round agreement",
    requiresDocs: true,
  },
];

export function ReservationRequestSheet({
  open,
  onOpenChange,
  marina: marinaProp,
  preselectedMarinaId,
  boats = [],
  onSuccess,
}: ReservationRequestSheetProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-boat");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [selectedMarina, setSelectedMarina] = useState<Marina | null>(null);
  const [selectedStayType, setSelectedStayType] = useState<StayType | null>(null);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [powerRequirements, setPowerRequirements] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [docStatus, setDocStatus] = useState<{ hasInsurance: boolean; hasRegistration: boolean } | null>(null);
  const [checkingDocs, setCheckingDocs] = useState(false);
  const [internalBoats, setInternalBoats] = useState<Boat[]>([]);
  const [fetchedMarina, setFetchedMarina] = useState<Marina | null>(null);
  const [boatSpecs, setBoatSpecs] = useState<BoatSpecs | null>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  
  // Marina search state
  const [marinaSearch, setMarinaSearch] = useState("");
  const [availableMarinas, setAvailableMarinas] = useState<Marina[]>([]);
  const [loadingMarinas, setLoadingMarinas] = useState(false);

  const { createReservation, checkDocumentsVerified } = useMarinaReservations();

  // Use prop marina, selected marina, or fetched marina
  const marina = marinaProp || selectedMarina || fetchedMarina;

  // Fetch marina if preselectedMarinaId provided (from unified businesses table)
  useEffect(() => {
    const fetchMarina = async () => {
      if (preselectedMarinaId && !marinaProp && open) {
        const { data } = await supabase
          .from("businesses")
          .select("id, business_name, address, accepts_transient, accepts_longterm, power_options, max_length_ft, transient_rate_per_ft")
          .eq("id", preselectedMarinaId)
          .contains("enabled_modules", ["slips"])
          .single();
        if (data) {
          // Map business_name to marina_name for component compatibility
          setFetchedMarina({
            id: data.id,
            marina_name: data.business_name,
            address: data.address,
            accepts_transient: data.accepts_transient,
            accepts_longterm: data.accepts_longterm,
            power_options: data.power_options,
            max_length_ft: data.max_length_ft,
            transient_rate_per_ft: data.transient_rate_per_ft,
          });
        }
      }
    };
    fetchMarina();
  }, [preselectedMarinaId, marinaProp, open]);

  // Fetch available marinas for search (from unified businesses table)
  useEffect(() => {
    const fetchMarinas = async () => {
      if (open && step === "select-marina") {
        setLoadingMarinas(true);
        // Fetch businesses with slips module that accept reservations
        const { data } = await supabase
          .from("businesses")
          .select("id, business_name, address, accepts_transient, accepts_longterm, power_options, max_length_ft, transient_rate_per_ft")
          .contains("enabled_modules", ["slips"])
          .or("accepts_transient.eq.true,accepts_longterm.eq.true")
          .order("business_name");
        if (data) {
          // Map business_name to marina_name for component compatibility
          setAvailableMarinas(data.map(b => ({
            id: b.id,
            marina_name: b.business_name,
            address: b.address,
            accepts_transient: b.accepts_transient,
            accepts_longterm: b.accepts_longterm,
            power_options: b.power_options,
            max_length_ft: b.max_length_ft,
            transient_rate_per_ft: b.transient_rate_per_ft,
          })));
        }
        setLoadingMarinas(false);
      }
    };
    fetchMarinas();
  }, [open, step]);

  // Fetch boats if not provided
  useEffect(() => {
    const fetchBoats = async () => {
      if (boats.length === 0 && open) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("boats")
            .select("id, name, length_ft, make, model, image_url")
            .eq("owner_id", user.id);
          if (data) {
            setInternalBoats(data as Boat[]);
          }
        }
      }
    };
    fetchBoats();
  }, [boats, open]);

  // Fetch boat specs when boat is selected
  useEffect(() => {
    const fetchSpecs = async () => {
      if (selectedBoat && open) {
        setLoadingSpecs(true);
        const { data } = await supabase
          .from("boat_specs")
          .select("loa_ft, beam_ft, draft_engines_down_ft, shore_power")
          .eq("boat_id", selectedBoat.id)
          .maybeSingle();
        
        if (data) {
          setBoatSpecs(data as BoatSpecs);
          // Pre-populate power requirements from boat specs if available
          if (data.shore_power && !powerRequirements) {
            setPowerRequirements(data.shore_power);
          }
        } else {
          // Use boat length as fallback for LOA
          setBoatSpecs({
            loa_ft: selectedBoat.length_ft,
            beam_ft: null,
            draft_engines_down_ft: null,
            shore_power: null,
          });
        }
        setLoadingSpecs(false);
      }
    };
    fetchSpecs();
  }, [selectedBoat, open]);

  const effectiveBoats = boats.length > 0 ? boats : internalBoats;

  // Filter marinas by search
  const filteredMarinas = marinaSearch
    ? availableMarinas.filter(m => 
        m.marina_name.toLowerCase().includes(marinaSearch.toLowerCase()) ||
        m.address?.toLowerCase().includes(marinaSearch.toLowerCase())
      )
    : availableMarinas;

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep("select-boat");
      setSelectedBoat(null);
      setSelectedMarina(null);
      setSelectedStayType(null);
      setArrivalDate("");
      setDepartureDate("");
      setPowerRequirements("");
      setSpecialRequests("");
      setDocStatus(null);
      setBoatSpecs(null);
      setMarinaSearch("");
    }
  }, [open]);

  // Auto-select if only one boat and no marina pre-selected
  useEffect(() => {
    if (open && step === "select-boat" && effectiveBoats.length === 1) {
      setSelectedBoat(effectiveBoats[0]);
      // If marina is already set, go to stay selection; otherwise go to marina selection
      if (marinaProp || fetchedMarina) {
        setStep("select-stay");
      } else {
        setStep("select-marina");
      }
    }
  }, [open, effectiveBoats, step, marinaProp, fetchedMarina]);

  // Check documents ONLY when the user is on the stay selection step.
  // Otherwise this effect can override manual navigation (e.g. clicking "Continue to Dates").
  useEffect(() => {
    const checkDocs = async () => {
      if (!open) return;
      if (step !== "select-stay") return;
      if (!selectedBoat || !selectedStayType) return;

      if (selectedStayType !== "transient") {
        setCheckingDocs(true);
        const status = await checkDocumentsVerified(selectedBoat.id);
        setDocStatus(status);
        setCheckingDocs(false);

        // If docs missing, show upload step
        if (!status.hasInsurance || !status.hasRegistration) {
          setStep("upload-docs");
        } else {
          setStep("vessel-specs");
        }
      } else {
        setStep("vessel-specs");
      }
    };

    void checkDocs();
  }, [open, step, selectedBoat, selectedStayType, checkDocumentsVerified]);

  const handleSubmit = async () => {
    if (!selectedBoat || !selectedStayType || !arrivalDate) return;

    setSubmitting(true);
    const success = await createReservation({
      marinaId: marina?.id,
      boatId: selectedBoat.id,
      stayType: selectedStayType,
      requestedArrival: arrivalDate,
      requestedDeparture: departureDate || undefined,
      powerRequirements: powerRequirements || boatSpecs?.shore_power || undefined,
      specialRequests: specialRequests || undefined,
      vesselSpecs: {
        loa: boatSpecs?.loa_ft || selectedBoat.length_ft,
        beam: boatSpecs?.beam_ft,
        draft: boatSpecs?.draft_engines_down_ft,
        power: powerRequirements || boatSpecs?.shore_power,
        vesselType: `${selectedBoat.make || ""} ${selectedBoat.model || ""}`.trim() || "Vessel",
        imageUrl: selectedBoat.image_url || null,
      },
    });

    setSubmitting(false);

    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const renderBoatSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Which boat is this reservation for?</p>
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
              // If marina is already set, go to stay selection; otherwise go to marina selection
              if (marinaProp || fetchedMarina) {
                setStep("select-stay");
              } else {
                setStep("select-marina");
              }
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

  const renderMarinaSelection = () => (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => setStep("select-boat")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <div className="flex items-center gap-2 pb-2 border-b">
        <Badge variant="secondary">{selectedBoat?.name}</Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">Where would you like to dock?</p>
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search marinas..."
          value={marinaSearch}
          onChange={(e) => setMarinaSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loadingMarinas ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredMarinas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No marinas found</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-4">
            {filteredMarinas.map((m) => {
              const boatLength = selectedBoat?.length_ft || 0;
              const fitsLength = !m.max_length_ft || boatLength <= m.max_length_ft;
              
              return (
                <Card
                  key={m.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    selectedMarina?.id === m.id && "border-primary bg-primary/5",
                    !fitsLength && "opacity-60"
                  )}
                  onClick={() => {
                    setSelectedMarina(m);
                    setStep("select-stay");
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{m.marina_name}</div>
                        {m.address && (
                          <div className="text-sm text-muted-foreground truncate">{m.address}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {m.accepts_transient && (
                            <Badge variant="outline" className="text-xs">Transient</Badge>
                          )}
                          {m.accepts_longterm && (
                            <Badge variant="outline" className="text-xs">Long-term</Badge>
                          )}
                          {m.transient_rate_per_ft && (
                            <span className="text-xs text-muted-foreground">
                              ${m.transient_rate_per_ft}/ft/night
                            </span>
                          )}
                        </div>
                      </div>
                      {!fitsLength && (
                        <Badge variant="destructive" className="shrink-0 text-xs">
                          Max {m.max_length_ft}ft
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const renderStaySelection = () => (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => {
        // Go back to marina selection if we selected one, otherwise back to boat
        if (selectedMarina && !marinaProp && !fetchedMarina) {
          setStep("select-marina");
        } else {
          setStep("select-boat");
        }
      }} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <div className="flex items-center gap-2 pb-2 border-b flex-wrap">
        <Badge variant="secondary">{selectedBoat?.name}</Badge>
        {marina && <Badge>{marina.marina_name}</Badge>}
      </div>
      <p className="text-sm text-muted-foreground">What type of stay are you requesting?</p>
      <div className="space-y-2">
        {STAY_TYPES.filter(st => {
          if (!marina) return true;
          if (st.value === "transient") return marina.accepts_transient;
          return marina.accepts_longterm;
        }).map((stayType) => (
          <Card
            key={stayType.value}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              selectedStayType === stayType.value && "border-primary bg-primary/5"
            )}
            onClick={() => setSelectedStayType(stayType.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{stayType.label}</div>
                  <div className="text-sm text-muted-foreground">{stayType.description}</div>
                </div>
                {stayType.requiresDocs && (
                  <Badge variant="outline" className="shrink-0">
                    <FileText className="w-3 h-3 mr-1" />
                    Docs Required
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDocUpload = () => (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => setStep("select-stay")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Long-term reservations require verified insurance and registration documents.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span>Insurance Document</span>
          </div>
          {checkingDocs ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : docStatus?.hasInsurance ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Badge variant="destructive">Missing</Badge>
          )}
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span>Registration Document</span>
          </div>
          {checkingDocs ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : docStatus?.hasRegistration ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Badge variant="destructive">Missing</Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate("/boat-log")}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Documents in Boat Log
        </Button>

        {docStatus?.hasInsurance && docStatus?.hasRegistration && (
          <Button type="button" className="w-full" onClick={() => setStep("vessel-specs")}>
            Continue to Request
          </Button>
        )}
      </div>
    </div>
  );

  const renderVesselSpecs = () => (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => setStep("select-stay")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-2 pb-2 border-b flex-wrap">
        <Badge variant="secondary">{selectedBoat?.name}</Badge>
        <Badge variant="outline">{selectedStayType}</Badge>
      </div>

      {loadingSpecs ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Vessel Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">LOA:</span>
                  <span className="font-medium">
                    {boatSpecs?.loa_ft || selectedBoat?.length_ft || "—"}ft
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Beam:</span>
                  <span className="font-medium">
                    {boatSpecs?.beam_ft || "—"}ft
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Draft:</span>
                  <span className="font-medium">
                    {boatSpecs?.draft_engines_down_ft || "—"}ft
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Power:</span>
                  <span className="font-medium">
                    {boatSpecs?.shore_power || "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              These specs will be shared with the marina for slip compatibility.
            </AlertDescription>
          </Alert>

          <Button type="button" className="w-full" onClick={() => setStep("form")}>
            Continue to Dates
          </Button>
        </>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => setStep("vessel-specs")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-2 pb-2 border-b flex-wrap">
        <Badge variant="secondary">{selectedBoat?.name}</Badge>
        <Badge variant="outline">{selectedStayType}</Badge>
        {marina && <Badge>{marina.marina_name}</Badge>}
        <Badge variant="outline" className="text-xs">
          {boatSpecs?.loa_ft || selectedBoat?.length_ft || "?"}ft LOA
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="arrival">Arrival Date</Label>
            <Input
              id="arrival"
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departure">Departure Date</Label>
            <Input
              id="departure"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={arrivalDate || new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Shore Power Needed *</Label>
          <Select value={powerRequirements} onValueChange={setPowerRequirements}>
            <SelectTrigger>
              <SelectValue placeholder="Select power needs..." />
            </SelectTrigger>
            <SelectContent>
              {SHORE_POWER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requests">Special Requests</Label>
          <Textarea
            id="requests"
            placeholder="Any special requirements or notes..."
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <Button
        type="button"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting || !arrivalDate || !powerRequirements}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Reservation Request"
        )}
      </Button>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Anchor className="w-5 h-5" />
            {marina ? `Request Slip at ${marina.marina_name}` : "Request Marina Reservation"}
          </SheetTitle>
          <SheetDescription>
            {step === "select-boat" && "Select your vessel"}
            {step === "select-marina" && "Choose a marina"}
            {step === "select-stay" && "Choose your stay type"}
            {step === "upload-docs" && "Upload required documents"}
            {step === "vessel-specs" && "Confirm vessel specifications"}
            {step === "form" && "Complete your reservation details"}
          </SheetDescription>
        </SheetHeader>

        {step === "select-boat" && renderBoatSelection()}
        {step === "select-marina" && renderMarinaSelection()}
        {step === "select-stay" && renderStaySelection()}
        {step === "upload-docs" && renderDocUpload()}
        {step === "vessel-specs" && renderVesselSpecs()}
        {step === "form" && renderForm()}
      </SheetContent>
    </Sheet>
  );
}
