import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FuelTank, FuelDelivery } from "@/hooks/useFuelManagement";
import { Truck, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeliveryRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tanks: FuelTank[];
  onCreateRequest: (data: {
    tank_id: string;
    gallons_requested: number;
    vendor_name?: string;
    requested_date?: Date;
    next_available?: boolean;
  }) => Promise<FuelDelivery | null>;
}

export function DeliveryRequestForm({ open, onOpenChange, tanks, onCreateRequest }: DeliveryRequestFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [fuelType, setFuelType] = useState("");
  const [gallonsRequested, setGallonsRequested] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [requestedDate, setRequestedDate] = useState<Date>();
  const [nextAvailable, setNextAvailable] = useState(false);

  // Find the primary tank for selected fuel type (highest capacity active tank)
  const matchingTanks = tanks
    .filter(t => t.is_active && t.fuel_type.toLowerCase() === fuelType.toLowerCase())
    .sort((a, b) => b.total_capacity_gallons - a.total_capacity_gallons);
  
  const selectedTank = matchingTanks[0];
  const projectedVolume = (selectedTank?.current_volume_gallons || 0) + parseFloat(gallonsRequested || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTank || !gallonsRequested) return;

    setLoading(true);
    const result = await onCreateRequest({
      tank_id: selectedTank.id,
      gallons_requested: parseFloat(gallonsRequested),
      vendor_name: vendorName || undefined,
      requested_date: nextAvailable ? undefined : requestedDate,
      next_available: nextAvailable,
    });

    setLoading(false);
    
    if (result) {
      // Reset form
      setFuelType("");
      setGallonsRequested("");
      setVendorName("");
      setRequestedDate(undefined);
      setNextAvailable(false);
      onOpenChange(false);
    }
  };

  // Determine available fuel types from active tanks
  const availableFuelTypes = [...new Set(tanks.filter(t => t.is_active).map(t => t.fuel_type))];
  const hasGas = availableFuelTypes.some(ft => ft.toLowerCase() === 'gasoline' || ft.toLowerCase() === 'gas');
  const hasDiesel = availableFuelTypes.some(ft => ft.toLowerCase() === 'diesel');

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
          {/* Fuel Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="fuelType">Product Type *</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {hasGas && <SelectItem value="gasoline">Gas</SelectItem>}
                {hasDiesel && <SelectItem value="diesel">Diesel</SelectItem>}
              </SelectContent>
            </Select>
            {selectedTank && (
              <p className="text-xs text-muted-foreground">
                Tank: {selectedTank.tank_name} • Available space: {(selectedTank.total_capacity_gallons - selectedTank.current_volume_gallons).toLocaleString()} gal
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

          {/* Next Available Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="nextAvailable" 
              checked={nextAvailable}
              onCheckedChange={(checked) => {
                setNextAvailable(checked === true);
                if (checked) setRequestedDate(undefined);
              }}
            />
            <Label htmlFor="nextAvailable" className="text-sm font-normal cursor-pointer">
              Next available delivery
            </Label>
          </div>

          {/* Requested Delivery Date */}
          {!nextAvailable && (
            <div className="space-y-2">
              <Label>Requested Delivery Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !requestedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {requestedDate ? format(requestedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={requestedDate}
                    onSelect={setRequestedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !selectedTank || !gallonsRequested}>
            {loading ? "Creating..." : "Create Delivery Request"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
