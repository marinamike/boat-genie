import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelPump, FuelTransaction } from "@/hooks/useFuelManagement";
import { Fuel, DollarSign, Ship } from "lucide-react";

interface QuickSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pumps: FuelPump[];
  defaultPricePerGallon?: number;
  onRecordSale: (data: {
    pump_id: string;
    gallons_sold: number;
    price_per_gallon: number;
    vessel_name?: string;
    vessel_id?: string;
    reservation_id?: string;
    notes?: string;
  }) => Promise<FuelTransaction | null>;
}

export function QuickSaleForm({ open, onOpenChange, pumps, defaultPricePerGallon = 4.50, onRecordSale }: QuickSaleFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [pumpId, setPumpId] = useState("");
  const [gallonsSold, setGallonsSold] = useState("");
  const [pricePerGallon, setPricePerGallon] = useState(defaultPricePerGallon.toString());
  const [vesselName, setVesselName] = useState("");
  const [notes, setNotes] = useState("");

  const selectedPump = pumps.find(p => p.id === pumpId);
  const totalAmount = parseFloat(gallonsSold || "0") * parseFloat(pricePerGallon || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pumpId || !gallonsSold) return;

    setLoading(true);
    const result = await onRecordSale({
      pump_id: pumpId,
      gallons_sold: parseFloat(gallonsSold),
      price_per_gallon: parseFloat(pricePerGallon),
      vessel_name: vesselName || undefined,
      notes: notes || undefined,
    });

    setLoading(false);
    
    if (result) {
      // Reset form
      setPumpId("");
      setGallonsSold("");
      setVesselName("");
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Quick-Log Fuel Sale
          </SheetTitle>
          <SheetDescription>
            Record a fuel sale transaction
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Pump Selection */}
          <div className="space-y-2">
            <Label htmlFor="pump">Select Pump *</Label>
            <Select value={pumpId} onValueChange={setPumpId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a pump" />
              </SelectTrigger>
              <SelectContent>
                {pumps.filter(p => p.is_active).map(pump => (
                  <SelectItem key={pump.id} value={pump.id}>
                    {pump.pump_name} {pump.pump_number ? `(#${pump.pump_number})` : ""} 
                    - {pump.tank?.fuel_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPump?.tank && (
              <p className="text-xs text-muted-foreground">
                Tank: {selectedPump.tank.tank_name} ({selectedPump.tank.current_volume_gallons.toLocaleString()} gal available)
              </p>
            )}
          </div>

          {/* Gallons Sold */}
          <div className="space-y-2">
            <Label htmlFor="gallons">Gallons Sold *</Label>
            <div className="relative">
              <Input
                id="gallons"
                type="number"
                step="0.01"
                min="0"
                value={gallonsSold}
                onChange={(e) => setGallonsSold(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
              />
              <Fuel className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Price Per Gallon */}
          <div className="space-y-2">
            <Label htmlFor="price">Price Per Gallon</Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={pricePerGallon}
                onChange={(e) => setPricePerGallon(e.target.value)}
                placeholder="4.50"
                className="pl-8"
              />
              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Vessel Name */}
          <div className="space-y-2">
            <Label htmlFor="vessel">Vessel Name (Optional)</Label>
            <div className="relative">
              <Input
                id="vessel"
                type="text"
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
                placeholder="Enter vessel name"
                className="pl-8"
              />
              <Ship className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {/* Total Display */}
          {gallonsSold && parseFloat(gallonsSold) > 0 && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {gallonsSold} gal × ${pricePerGallon}/gal
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !pumpId || !gallonsSold}>
            {loading ? "Recording..." : "Record Sale"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
