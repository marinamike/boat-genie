import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelDelivery } from "@/hooks/useFuelManagement";
import { CheckCircle2, DollarSign, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConfirmDeliverySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: FuelDelivery | null;
  onConfirmDelivery: (deliveryId: string, data: {
    gallons_delivered: number;
    cost_per_gallon?: number;
    invoice_number?: string;
    notes?: string;
  }) => Promise<boolean>;
}

export function ConfirmDeliverySheet({ 
  open, 
  onOpenChange, 
  delivery, 
  onConfirmDelivery 
}: ConfirmDeliverySheetProps) {
  const [loading, setLoading] = useState(false);
  
  const [gallonsDelivered, setGallonsDelivered] = useState("");
  const [costPerGallon, setCostPerGallon] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Pre-fill from request when opening
  useEffect(() => {
    if (delivery && open) {
      setGallonsDelivered(delivery.gallons_requested?.toString() || "");
      setCostPerGallon(delivery.cost_per_gallon?.toString() || "");
      setInvoiceNumber(delivery.invoice_number || "");
      setNotes(delivery.notes || "");
    }
  }, [delivery, open]);

  const requestedGallons = delivery?.gallons_requested || 0;
  const deliveredGallons = parseFloat(gallonsDelivered || "0");
  const variance = deliveredGallons - requestedGallons;
  const variancePercent = requestedGallons > 0 ? (variance / requestedGallons) * 100 : 0;
  const totalCost = deliveredGallons * parseFloat(costPerGallon || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery || !gallonsDelivered) return;

    setLoading(true);
    const success = await onConfirmDelivery(delivery.id, {
      gallons_delivered: parseFloat(gallonsDelivered),
      cost_per_gallon: costPerGallon ? parseFloat(costPerGallon) : undefined,
      invoice_number: invoiceNumber || undefined,
      notes: notes || undefined,
    });

    setLoading(false);
    
    if (success) {
      // Reset form
      setGallonsDelivered("");
      setCostPerGallon("");
      setInvoiceNumber("");
      setNotes("");
      onOpenChange(false);
    }
  };

  if (!delivery) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Confirm Delivery
          </SheetTitle>
          <SheetDescription>
            Verify the actual quantity received for this delivery request.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 mt-6 pb-4">
          {/* Request Summary */}
          <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{delivery.tank?.tank_name}</p>
                <p className="text-sm text-muted-foreground">
                  {delivery.vendor_name || "Unknown vendor"}
                </p>
              </div>
              <Badge variant="outline">Requested</Badge>
            </div>
            <div className="text-2xl font-bold">
              {requestedGallons.toLocaleString()} gal
            </div>
          </div>

          {/* PO/Invoice Number */}
          <div className="space-y-2">
            <Label htmlFor="invoice">PO / Invoice Number</Label>
            <div className="relative">
              <Input
                id="invoice"
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-12345"
                className="pl-8"
              />
              <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Actual Gallons Delivered */}
          <div className="space-y-2">
            <Label htmlFor="gallons">Actual Gallons Delivered *</Label>
            <Input
              id="gallons"
              type="number"
              step="0.01"
              min="0"
              value={gallonsDelivered}
              onChange={(e) => setGallonsDelivered(e.target.value)}
              placeholder="0.00"
              required
              className="text-lg"
            />
          </div>

          {/* Variance Display */}
          {gallonsDelivered && requestedGallons > 0 && (
            <div className={`p-3 rounded-lg border flex items-center gap-3 ${
              Math.abs(variancePercent) > 5 
                ? "bg-destructive/10 border-destructive/30" 
                : "bg-muted/50"
            }`}>
              {Math.abs(variancePercent) > 5 && (
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {variance >= 0 ? "+" : ""}{variance.toFixed(1)} gal
                  ({variancePercent >= 0 ? "+" : ""}{variancePercent.toFixed(1)}%)
                </p>
                <p className="text-xs text-muted-foreground">
                  Variance from requested quantity
                </p>
              </div>
            </div>
          )}

          {/* Actual Cost Per Gallon */}
          <div className="space-y-2">
            <Label htmlFor="cost">Cost Per Gallon</Label>
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
              placeholder="Add any discrepancy notes..."
              rows={2}
            />
          </div>

          {/* Total Cost Display */}
          {costPerGallon && gallonsDelivered && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Cost</span>
                <span className="text-xl font-bold text-primary">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !gallonsDelivered}>
            {loading ? "Confirming..." : "Confirm Delivery Received"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
