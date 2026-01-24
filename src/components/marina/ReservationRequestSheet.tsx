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
import { Loader2, AlertTriangle, CheckCircle, FileText, Upload, ChevronLeft, Anchor } from "lucide-react";
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
}

interface Marina {
  id: string;
  marina_name: string;
  address: string | null;
  accepts_transient: boolean;
  accepts_longterm: boolean;
  power_options: string[] | null;
}

interface ReservationRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marina?: Marina | null;
  boats?: Boat[];
  onSuccess?: () => void;
}

type Step = "select-boat" | "select-stay" | "form" | "upload-docs";

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
  marina,
  boats = [],
  onSuccess,
}: ReservationRequestSheetProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-boat");
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [selectedStayType, setSelectedStayType] = useState<StayType | null>(null);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [powerRequirements, setPowerRequirements] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [docStatus, setDocStatus] = useState<{ hasInsurance: boolean; hasRegistration: boolean } | null>(null);
  const [checkingDocs, setCheckingDocs] = useState(false);
  const [internalBoats, setInternalBoats] = useState<Boat[]>([]);

  const { createReservation, checkDocumentsVerified } = useMarinaReservations();

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
          if (data) {
            setInternalBoats(data as Boat[]);
          }
        }
      }
    };
    fetchBoats();
  }, [boats, open]);

  const effectiveBoats = boats.length > 0 ? boats : internalBoats;

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep("select-boat");
      setSelectedBoat(null);
      setSelectedStayType(null);
      setArrivalDate("");
      setDepartureDate("");
      setPowerRequirements("");
      setSpecialRequests("");
      setDocStatus(null);
    }
  }, [open]);

  // Auto-select if only one boat
  useEffect(() => {
    if (open && step === "select-boat" && effectiveBoats.length === 1) {
      setSelectedBoat(effectiveBoats[0]);
      setStep("select-stay");
    }
  }, [open, effectiveBoats, step]);

  // Check documents when selecting long-term stay
  useEffect(() => {
    const checkDocs = async () => {
      if (selectedBoat && selectedStayType && selectedStayType !== "transient") {
        setCheckingDocs(true);
        const status = await checkDocumentsVerified(selectedBoat.id);
        setDocStatus(status);
        setCheckingDocs(false);

        // If docs missing, show upload step
        if (!status.hasInsurance || !status.hasRegistration) {
          setStep("upload-docs");
        } else {
          setStep("form");
        }
      } else if (selectedStayType === "transient") {
        setStep("form");
      }
    };

    if (selectedStayType) {
      checkDocs();
    }
  }, [selectedBoat, selectedStayType, checkDocumentsVerified]);

  const handleSubmit = async () => {
    if (!selectedBoat || !selectedStayType || !arrivalDate) return;

    setSubmitting(true);
    const success = await createReservation({
      marinaId: marina?.id,
      boatId: selectedBoat.id,
      stayType: selectedStayType,
      requestedArrival: arrivalDate,
      requestedDeparture: departureDate || undefined,
      powerRequirements: powerRequirements || undefined,
      specialRequests: specialRequests || undefined,
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
              setStep("select-stay");
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

  const renderStaySelection = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep("select-boat")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <div className="flex items-center gap-2 pb-2 border-b">
        <Badge variant="secondary">{selectedBoat?.name}</Badge>
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
      <Button variant="ghost" size="sm" onClick={() => setStep("select-stay")} className="mb-2">
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
          variant="outline"
          className="w-full"
          onClick={() => navigate("/boat-log")}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Documents in Boat Log
        </Button>

        {docStatus?.hasInsurance && docStatus?.hasRegistration && (
          <Button className="w-full" onClick={() => setStep("form")}>
            Continue to Request
          </Button>
        )}
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep("select-stay")} className="mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-2 pb-2 border-b flex-wrap">
        <Badge variant="secondary">{selectedBoat?.name}</Badge>
        <Badge variant="outline">{selectedStayType}</Badge>
        {marina && <Badge>{marina.marina_name}</Badge>}
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

        {marina?.power_options && marina.power_options.length > 0 && (
          <div className="space-y-2">
            <Label>Power Requirements</Label>
            <Select value={powerRequirements} onValueChange={setPowerRequirements}>
              <SelectTrigger>
                <SelectValue placeholder="Select power needs..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No shore power needed</SelectItem>
                {marina.power_options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting || !arrivalDate}
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
            {step === "select-stay" && "Choose your stay type"}
            {step === "upload-docs" && "Upload required documents"}
            {step === "form" && "Complete your reservation details"}
          </SheetDescription>
        </SheetHeader>

        {step === "select-boat" && renderBoatSelection()}
        {step === "select-stay" && renderStaySelection()}
        {step === "upload-docs" && renderDocUpload()}
        {step === "form" && renderForm()}
      </SheetContent>
    </Sheet>
  );
}
