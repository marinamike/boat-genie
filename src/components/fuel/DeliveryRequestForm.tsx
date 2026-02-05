import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FuelTank, FuelDelivery } from "@/hooks/useFuelManagement";
import { Truck } from "lucide-react";

interface DeliveryRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tanks: FuelTank[];
  onCreateRequest: (data: {
    tank_id: string;
    gallons_requested: number;
    vendor_name?: string;
  }) => Promise<FuelDelivery | null>;
}

export function DeliveryRequestForm({ open, onOpenChange, tanks, onCreateRequest }: DeliveryRequestFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [tankId, setTankId] = useState("");
  const [gallonsRequested, setGallonsRequested] = useState("");
  const [vendorName, setVendorName] = useState("");

  const selectedTank = tanks.find(t => t.id === tankId);
  const projectedVolume = (selectedTank?.current_volume_gallons || 0) + parseFloat(gallonsRequested || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankId || !gallonsRequested) return;

    setLoading(true);
    const result = await onCreateRequest({
      tank_id: tankId,
      gallons_requested: parseFloat(gallonsRequested),
      vendor_name: vendorName || undefined,
    });

    setLoading(false);
    
    if (result) {
      // Reset form
      setTankId("");
      setGallonsRequested("");
      setVendorName("");
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
            <Label htmlFor="tank">Product Type *</Label>
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

          <Button type="submit" className="w-full" disabled={loading || !tankId || !gallonsRequested}>
            {loading ? "Creating..." : "Create Delivery Request"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
