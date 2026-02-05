import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelPump, FuelTransaction } from "@/hooks/useFuelManagement";
import { useFuelPricing } from "@/hooks/useFuelPricing";
import { Fuel, DollarSign, Ship, Users } from "lucide-react";

interface QuickSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pumps: FuelPump[];
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

export function QuickSaleForm({ open, onOpenChange, pumps, onRecordSale }: QuickSaleFormProps) {
  const { getRetailPrice, getMemberPrice, prices, refresh } = useFuelPricing();
  
  // Refresh prices when sheet opens to ensure latest pricing
  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);
  const [loading, setLoading] = useState(false);
  
  const [pumpId, setPumpId] = useState("");
  const [gallonsSold, setGallonsSold] = useState("");
  const [pricePerGallon, setPricePerGallon] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [notes, setNotes] = useState("");
  const [applyMemberPrice, setApplyMemberPrice] = useState(false);

  const selectedPump = pumps.find(p => p.id === pumpId);
  const selectedFuelType = selectedPump?.tank?.fuel_type || "";
  const memberPrice = getMemberPrice(selectedFuelType);
  const hasMemberPricing = memberPrice !== null;
  const totalAmount = parseFloat(gallonsSold || "0") * parseFloat(pricePerGallon || "0");

  // Update price when pump is selected or member toggle changes
  useEffect(() => {
    if (selectedPump?.tank?.fuel_type) {
      const fuelType = selectedPump.tank.fuel_type;
      if (applyMemberPrice && memberPrice !== null) {
        setPricePerGallon(memberPrice.toString());
      } else {
        const retailPrice = getRetailPrice(fuelType);
        setPricePerGallon(retailPrice > 0 ? retailPrice.toString() : "");
      }
    }
  }, [pumpId, selectedPump, applyMemberPrice, getRetailPrice, getMemberPrice, memberPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pumpId || !gallonsSold) return;

    setLoading(true);
    const result = await onRecordSale({
      pump_id: pumpId,
      gallons_sold: parseFloat(gallonsSold),
      price_per_gallon: parseFloat(pricePerGallon),
      vessel_name: vesselName || undefined,
      notes: applyMemberPrice ? `[Member Price Applied] ${notes || ""}`.trim() : notes || undefined,
    });

    setLoading(false);
    
    if (result) {
      // Reset form
      setPumpId("");
      setGallonsSold("");
      setVesselName("");
      setNotes("");
      setApplyMemberPrice(false);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Quick-Log Fuel Sale
          </SheetTitle>
          <SheetDescription>
            Record a fuel sale transaction
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 pb-6">
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
                step="0.001"
                min="0"
                value={pricePerGallon}
                onChange={(e) => setPricePerGallon(e.target.value)}
                placeholder="0.000"
                className="pl-8"
              />
              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            {!pricePerGallon && selectedPump && (
              <p className="text-xs text-destructive">
                No pricing configured for {selectedFuelType}. Set prices in the Pricing tab.
              </p>
            )}
          </div>

          {/* Member Pricing Toggle */}
          {hasMemberPricing && selectedPump && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Apply Member Price</p>
                  <p className="text-xs text-muted-foreground">
                    ${memberPrice?.toFixed(2)}/gal (saves ${((parseFloat(pricePerGallon) || 0) - (memberPrice || 0)).toFixed(2)}/gal)
                  </p>
                </div>
              </div>
              <Switch
                checked={applyMemberPrice}
                onCheckedChange={setApplyMemberPrice}
              />
            </div>
          )}

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
