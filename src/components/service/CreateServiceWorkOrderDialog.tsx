import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useServiceMenu, PRICING_MODELS } from "@/hooks/useServiceMenu";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LineItem {
  service_id: string;
  name: string;
  pricing_model: string;
  unit_price: number;
  quantity: number;
  total: number;
}

interface Boat {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  length_ft: number | null;
  owner_id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  serviceStaff: { id: string; staff_name: string }[];
}

export function CreateServiceWorkOrderDialog({ open, onOpenChange, onCreated, serviceStaff }: Props) {
  const { business } = useBusiness();
  const { activeMenuItems } = useServiceMenu();

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Client
  const [searchQuery, setSearchQuery] = useState("");
  const [boats, setBoats] = useState<Boat[]>([]);
  const [filteredBoats, setFilteredBoats] = useState<Boat[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  // Step 2: Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  // Step 3: Schedule
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [assignedStaffId, setAssignedStaffId] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Fetch boats for search
  useEffect(() => {
    if (!open || !business?.id) return;
    const fetchBoats = async () => {
      const { data } = await supabase
        .from("boats")
        .select("id, name, make, model, length_ft, owner_id")
        .order("name");
      setBoats(data || []);
      setFilteredBoats(data || []);
    };
    fetchBoats();
  }, [open, business?.id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBoats(boats);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredBoats(
        boats.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            (b.make && b.make.toLowerCase().includes(q)) ||
            (b.model && b.model.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, boats]);

  const handleAddLineItem = () => {
    if (!selectedServiceId) return;
    const service = activeMenuItems.find((s) => s.id === selectedServiceId);
    if (!service) return;

    const quantity = service.pricing_model === "per_foot" && selectedBoat?.length_ft
      ? selectedBoat.length_ft
      : 1;

    setLineItems([
      ...lineItems,
      {
        service_id: service.id,
        name: service.name,
        pricing_model: service.pricing_model,
        unit_price: service.default_price,
        quantity,
        total: service.default_price * quantity,
      },
    ]);
    setSelectedServiceId("");
  };

  const updateLineItemPrice = (index: number, price: number) => {
    const updated = [...lineItems];
    updated[index].unit_price = price;
    updated[index].total = price * updated[index].quantity;
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const runningTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async () => {
    if (!business?.id || !selectedBoat) return;
    setSubmitting(true);

    const title = lineItems.length === 1
      ? lineItems[0].name
      : `Service Order — ${lineItems.map((l) => l.name).join(", ")}`;

    const description = lineItems
      .map((l) => {
        const pricingLabel = PRICING_MODELS.find((p) => p.value === l.pricing_model)?.label || l.pricing_model;
        return `• ${l.name} (${pricingLabel}): $${l.total.toFixed(2)}`;
      })
      .join("\n");

    const { error } = await supabase.from("work_orders").insert({
      business_id: business.id,
      boat_id: selectedBoat.id,
      owner_id: selectedBoat.owner_id,
      title,
      description: `${description}\n\nTotal: $${runningTotal.toFixed(2)}`,
      status: startDate ? "assigned" : "pending",
      scheduled_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
    } as any);

    if (error) {
      toast.error("Failed to create work order: " + error.message);
    } else {
      toast.success("Work order created");
      onCreated();
      resetAndClose();
    }
    setSubmitting(false);
  };

  const resetAndClose = () => {
    setStep(1);
    setSearchQuery("");
    setSelectedBoat(null);
    setLineItems([]);
    setSelectedServiceId("");
    setStartDate(undefined);
    setAssignedStaffId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Work Order</DialogTitle>
          <DialogDescription>
            Step {step} of 3 — {step === 1 ? "Select Client & Boat" : step === 2 ? "Add Services" : "Schedule"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Client */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Search Boat / Customer</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by boat name, make, or model..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-1">
              {filteredBoats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No boats found</p>
              ) : (
                filteredBoats.map((boat) => (
                  <div
                    key={boat.id}
                    onClick={() => setSelectedBoat(boat)}
                    className={cn(
                      "p-2 rounded cursor-pointer text-sm transition-colors",
                      selectedBoat?.id === boat.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <p className="font-medium">{boat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[boat.make, boat.model, boat.length_ft && `${boat.length_ft}ft`]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Services */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-2 bg-muted/50 rounded text-sm">
              <span className="font-medium">{selectedBoat?.name}</span>
              <span className="text-muted-foreground ml-2">
                {[selectedBoat?.make, selectedBoat?.model].filter(Boolean).join(" ")}
              </span>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger><SelectValue placeholder="Select a service..." /></SelectTrigger>
                  <SelectContent>
                    {activeMenuItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} — ${item.default_price.toFixed(2)}
                        {item.pricing_model === "hourly" ? "/hr" : item.pricing_model === "per_foot" ? "/ft" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddLineItem} disabled={!selectedServiceId} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {activeMenuItems.length === 0 && (
              <p className="text-sm text-amber-600">
                No service items configured. Add them in Business Settings → Service Menu.
              </p>
            )}

            {lineItems.length > 0 && (
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {PRICING_MODELS.find((p) => p.value === item.pricing_model)?.label}
                        {item.pricing_model === "per_foot" && ` × ${item.quantity}ft`}
                      </p>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateLineItemPrice(idx, parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <p className="text-sm font-medium w-20 text-right">${item.total.toFixed(2)}</p>
                    <Button variant="ghost" size="icon" onClick={() => removeLineItem(idx)} className="shrink-0">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end pt-2 border-t">
                  <p className="font-semibold">Total: ${runningTotal.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Start Date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Assigned Technician (optional)</Label>
              <Select value={assignedStaffId} onValueChange={setAssignedStaffId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {serviceStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.staff_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 border rounded-lg bg-muted/30 space-y-1 text-sm">
              <p className="font-medium">Summary</p>
              <p>Boat: {selectedBoat?.name}</p>
              <p>Services: {lineItems.length} item(s)</p>
              <p>Total: ${runningTotal.toFixed(2)}</p>
              {startDate && <p>Start: {format(startDate, "PPP")}</p>}
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !selectedBoat : lineItems.length === 0}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Creating..." : "Create Work Order"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
