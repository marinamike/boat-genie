import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  User,
  UserPlus,
  Loader2,
  Ship,
  DollarSign,
  Send,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  useProviderWorkOrder,
  ExistingCustomer,
  NewCustomerData,
  ProviderServiceOption,
  WorkOrderQuote,
} from "@/hooks/useProviderWorkOrder";
import { formatPrice } from "@/lib/pricing";

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "customer" | "service" | "quote";
type CustomerType = "existing" | "new";

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkOrderDialogProps) {
  const {
    existingCustomers,
    providerServices,
    loading,
    submitting,
    calculateQuote,
    createWorkOrderForExisting,
    createWorkOrderForNew,
  } = useProviderWorkOrder();

  // Form state
  const [step, setStep] = useState<Step>("customer");
  const [customerType, setCustomerType] = useState<CustomerType>("existing");
  
  // Existing customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedBoatId, setSelectedBoatId] = useState<string>("");
  
  // New customer
  const [newCustomer, setNewCustomer] = useState<NewCustomerData>({
    ownerName: "",
    ownerEmail: "",
    boatName: "",
    boatLengthFt: null,
  });
  
  // Service
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  
  // Quote
  const [customPrice, setCustomPrice] = useState<string>("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [materialsDeposit, setMaterialsDeposit] = useState<string>("0");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("customer");
      setCustomerType("existing");
      setSelectedCustomerId("");
      setSelectedBoatId("");
      setNewCustomer({ ownerName: "", ownerEmail: "", boatName: "", boatLengthFt: null });
      setSelectedServiceId("");
      setCustomPrice("");
      setUseCustomPrice(false);
      setMaterialsDeposit("0");
      setNotes("");
      setScheduledDate("");
    }
    onOpenChange(isOpen);
  };

  // Get selected customer and boat
  const selectedCustomer = useMemo(
    () => existingCustomers.find(c => c.ownerId === selectedCustomerId),
    [existingCustomers, selectedCustomerId]
  );

  const selectedBoat = useMemo(
    () => selectedCustomer?.boats.find(b => b.id === selectedBoatId),
    [selectedCustomer, selectedBoatId]
  );

  const selectedService = useMemo(
    () => providerServices.find(s => s.id === selectedServiceId),
    [providerServices, selectedServiceId]
  );

  // Get boat length for pricing
  const boatLength = useMemo(() => {
    if (customerType === "existing" && selectedBoat) {
      return selectedBoat.lengthFt;
    }
    return newCustomer.boatLengthFt;
  }, [customerType, selectedBoat, newCustomer.boatLengthFt]);

  // Calculate quote
  const quote: WorkOrderQuote | null = useMemo(() => {
    if (!selectedService) return null;
    return calculateQuote(
      selectedService,
      boatLength,
      parseFloat(materialsDeposit) || 0,
      useCustomPrice ? parseFloat(customPrice) || 0 : undefined
    );
  }, [selectedService, boatLength, materialsDeposit, useCustomPrice, customPrice, calculateQuote]);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, ProviderServiceOption[]> = {};
    providerServices.forEach(service => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });
    return grouped;
  }, [providerServices]);

  // Validation
  const canProceedFromCustomer = useMemo(() => {
    if (customerType === "existing") {
      return selectedCustomerId && selectedBoatId;
    }
    return newCustomer.ownerName && newCustomer.ownerEmail && newCustomer.boatName;
  }, [customerType, selectedCustomerId, selectedBoatId, newCustomer]);

  const canProceedFromService = !!selectedServiceId;

  const canSubmit = useMemo(() => {
    if (!quote) return false;
    if (quote.basePrice <= 0) return false;
    return true;
  }, [quote]);

  // Handle submit
  const handleSubmit = async () => {
    if (!quote || !selectedService) return;

    let success: boolean;
    if (customerType === "existing" && selectedBoatId && selectedCustomerId) {
      const guestId = selectedCustomer?.isGuest ? selectedCustomer.guestCustomerId : undefined;
      success = await createWorkOrderForExisting(
        selectedBoatId,
        selectedCustomerId,
        selectedServiceId,
        quote,
        notes,
        scheduledDate,
        guestId
      );
    } else {
      success = await createWorkOrderForNew(
        newCustomer,
        selectedServiceId,
        quote,
        notes,
        scheduledDate
      );
    }

    if (success) {
      handleOpenChange(false);
      onSuccess?.();
    }
  };

  // Step navigation
  const goToNext = () => {
    if (step === "customer") setStep("service");
    else if (step === "service") setStep("quote");
  };

  const goBack = () => {
    if (step === "service") setStep("customer");
    else if (step === "quote") setStep("service");
  };

  // Step indicator
  const steps = [
    { key: "customer", label: "Customer" },
    { key: "service", label: "Service" },
    { key: "quote", label: "Quote" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Create New Job
          </DialogTitle>
          <DialogDescription>
            Send a work order to a customer for approval
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 my-4">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : steps.findIndex(x => x.key === step) > i
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {steps.findIndex(x => x.key === step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 ${
                    steps.findIndex(x => x.key === step) > i
                      ? "bg-green-500"
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Step 1: Customer */}
            {step === "customer" && (
              <div className="space-y-4">
                <RadioGroup
                  value={customerType}
                  onValueChange={(v) => setCustomerType(v as CustomerType)}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="existing"
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      customerType === "existing"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="existing" id="existing" className="sr-only" />
                    <User className="w-8 h-8 text-primary" />
                    <span className="font-medium">Existing Customer</span>
                  </Label>
                  <Label
                    htmlFor="new"
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      customerType === "new"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="new" id="new" className="sr-only" />
                    <UserPlus className="w-8 h-8 text-primary" />
                    <span className="font-medium">New Customer</span>
                  </Label>
                </RadioGroup>

                <Separator />

                {customerType === "existing" ? (
                  <div className="space-y-4">
                    {existingCustomers.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            No previous customers found. Select "New Customer" to invite someone.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Select Customer</Label>
                          <Select value={selectedCustomerId} onValueChange={(v) => {
                            setSelectedCustomerId(v);
                            setSelectedBoatId("");
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a customer..." />
                            </SelectTrigger>
                            <SelectContent>
                              {existingCustomers.map(customer => (
                                <SelectItem key={customer.ownerId} value={customer.ownerId}>
                                  <span className="flex items-center gap-2">
                                    {customer.ownerName}
                                    {customer.isGuest && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600">
                                        Guest
                                      </Badge>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedCustomer && (
                          <div className="space-y-2">
                            <Label>Select Boat</Label>
                            <Select value={selectedBoatId} onValueChange={setSelectedBoatId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a boat..." />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedCustomer.boats.map(boat => (
                                  <SelectItem key={boat.id} value={boat.id}>
                                    <div className="flex items-center gap-2">
                                      <Ship className="w-4 h-4" />
                                      {boat.name}
                                      {boat.lengthFt && (
                                        <Badge variant="secondary" className="text-xs">
                                          {boat.lengthFt}ft
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name *</Label>
                      <Input
                        id="ownerName"
                        value={newCustomer.ownerName}
                        onChange={e => setNewCustomer(prev => ({ ...prev, ownerName: e.target.value }))}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">Owner Email *</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={newCustomer.ownerEmail}
                        onChange={e => setNewCustomer(prev => ({ ...prev, ownerEmail: e.target.value }))}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boatName">Boat Name *</Label>
                      <Input
                        id="boatName"
                        value={newCustomer.boatName}
                        onChange={e => setNewCustomer(prev => ({ ...prev, boatName: e.target.value }))}
                        placeholder="Sea Breeze"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boatLength">Boat Length (ft)</Label>
                      <Input
                        id="boatLength"
                        type="number"
                        value={newCustomer.boatLengthFt || ""}
                        onChange={e => setNewCustomer(prev => ({
                          ...prev,
                          boatLengthFt: e.target.value ? parseFloat(e.target.value) : null,
                        }))}
                        placeholder="32"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for per-foot pricing. Can be updated later.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Service */}
            {step === "service" && (
              <div className="space-y-4">
                {providerServices.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">No Services Configured</h3>
                      <p className="text-muted-foreground text-sm">
                        Add services to your Service Menu in Business Settings to create work orders.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {Object.entries(servicesByCategory).map(([category, services]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          {category}
                        </h4>
                        <div className="space-y-2">
                          {services.map(service => (
                            <Card
                              key={service.id}
                              className={`cursor-pointer transition-all ${
                                selectedServiceId === service.id
                                  ? "ring-2 ring-primary bg-primary/5"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => setSelectedServiceId(service.id)}
                            >
                              <CardContent className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{service.serviceName}</p>
                                    {service.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {service.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="secondary">
                                    {service.pricingModel === "per_foot"
                                      ? `$${service.price}/ft`
                                      : service.pricingModel === "hourly"
                                      ? `$${service.price}/hr`
                                      : formatPrice(service.price)}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Quote */}
            {step === "quote" && selectedService && (
              <div className="space-y-4">
                {/* Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="py-3 px-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="font-medium">
                        {customerType === "existing"
                          ? selectedCustomer?.ownerName
                          : newCustomer.ownerName}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Boat</span>
                      <span className="font-medium">
                        {customerType === "existing"
                          ? selectedBoat?.name
                          : newCustomer.boatName}
                        {boatLength && ` (${boatLength}ft)`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium">{selectedService.serviceName}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <div className="space-y-3">
                  {selectedService.pricingModel === "per_foot" && !boatLength && !useCustomPrice && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
                      <p className="text-amber-700 dark:text-amber-400">
                        Boat length not specified. Use custom price or update boat details.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomPrice"
                      checked={useCustomPrice}
                      onChange={e => setUseCustomPrice(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="useCustomPrice" className="text-sm">
                      Use custom price
                    </Label>
                  </div>

                  {useCustomPrice && (
                    <div className="space-y-2">
                      <Label>Custom Base Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={customPrice}
                          onChange={e => setCustomPrice(e.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Materials Deposit (Optional)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={materialsDeposit}
                        onChange={e => setMaterialsDeposit(e.target.value)}
                        className="pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Scheduled Date (Optional)</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Any additional details..."
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                {quote && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Price</span>
                      <span>{formatPrice(quote.basePrice)}</span>
                    </div>
                    {quote.materialsDeposit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Materials Deposit</span>
                        <span>{formatPrice(quote.materialsDeposit)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Customer Pays</span>
                      <span className="text-primary">{formatPrice(quote.totalOwnerPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              {step !== "customer" ? (
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step === "quote" ? (
                <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {customerType === "new" ? "Send Invite" : "Send Work Order"}
                </Button>
              ) : (
                <Button
                  onClick={goToNext}
                  disabled={step === "customer" ? !canProceedFromCustomer : !canProceedFromService}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
