import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelTank, FuelDelivery } from "@/hooks/useFuelManagement";
import { Truck, DollarSign, FileText } from "lucide-react";

interface DeliveryRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tanks: FuelTank[];
  onCreateRequest: (data: {
    tank_id: string;
    gallons_requested: number;
    vendor_name?: string;
    invoice_number?: string;
    cost_per_gallon?: number;
    notes?: string;
  }) => Promise<FuelDelivery | null>;
}

export function DeliveryRequestForm({ open, onOpenChange, tanks, onCreateRequest }: DeliveryRequestFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [tankId, setTankId] = useState("");
  const [gallonsRequested, setGallonsRequested] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [costPerGallon, setCostPerGallon] = useState("");
  const [notes, setNotes] = useState("");

  const selectedTank = tanks.find(t => t.id === tankId);
  const estimatedCost = parseFloat(gallonsRequested || "0") * parseFloat(costPerGallon || "0");
  const projectedVolume = (selectedTank?.current_volume_gallons || 0) + parseFloat(gallonsRequested || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankId || !gallonsRequested) return;

    setLoading(true);
    const result = await onCreateRequest({
      tank_id: tankId,
      gallons_requested: parseFloat(gallonsRequested),
      vendor_name: vendorName || undefined,
      invoice_number: invoiceNumber || undefined,
      cost_per_gallon: costPerGallon ? parseFloat(costPerGallon) : undefined,
      notes: notes || undefined,
    });

    setLoading(false);
    
    if (result) {
      // Reset form
      setTankId("");
      setGallonsRequested("");
      setVendorName("");
      setInvoiceNumber("");
      setCostPerGallon("");
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Request Fuel Delivery
          </SheetTitle>
          <SheetDescription>
            Create a delivery request. Confirm the actual quantity once received.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 mt-6 pb-4">
          {/* Tank Selection */}
          <div className="space-y-2">
            <Label htmlFor="tank">Select Tank *</Label>
            <Select value={tankId} onValueChange={setTankId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tank" />
              </SelectTrigger>
              <SelectContent>
                {tanks.filter(t => t.is_active).map(tank => (
                  <SelectItem key={tank.id} value={tank.id}>
                    {tank.tank_name} - {tank.fuel_type} ({tank.current_volume_gallons.toLocaleString()} gal)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTank && (
              <p className="text-xs text-muted-foreground">
                Available space: {(selectedTank.total_capacity_gallons - selectedTank.current_volume_gallons).toLocaleString()} gal
              </p>
            )}
          </div>

          {/* Gallons Requested */}
          <div className="space-y-2">
            <Label htmlFor="gallons">Gallons Requested *</Label>
            <Input
              id="gallons"
              type="number"
              step="0.01"
              min="0"
              value={gallonsRequested}
              onChange={(e) => setGallonsRequested(e.target.value)}
              placeholder="0.00"
              required
            />
            {selectedTank && gallonsRequested && (
              <p className="text-xs text-muted-foreground">
                Projected level after delivery: {projectedVolume.toLocaleString()} gal 
                ({((projectedVolume / selectedTank.total_capacity_gallons) * 100).toFixed(0)}% full)
              </p>
            )}
          </div>

          {/* Vendor Name */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor Name</Label>
            <Input
              id="vendor"
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., Fuel Distributors Inc."
            />
          </div>

          {/* Invoice Number */}
          <div className="space-y-2">
            <Label htmlFor="invoice">PO / Invoice Number</Label>
            <div className="relative">
              <Input
                id="invoice"
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="PO-12345"
                className="pl-8"
              />
              <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Expected Cost Per Gallon */}
          <div className="space-y-2">
            <Label htmlFor="cost">Expected Cost Per Gallon</Label>
            <div className="relative">
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={costPerGallon}
                onChange={(e) => setCostPerGallon(e.target.value)}
                placeholder="0.00"
                className="pl-8"
              />
              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {/* Estimated Cost Display */}
          {costPerGallon && gallonsRequested && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated Cost</span>
                <span className="text-xl font-bold">
                  ${estimatedCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !tankId || !gallonsRequested}>
            {loading ? "Creating..." : "Create Delivery Request"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
