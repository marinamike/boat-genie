import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, MapPin, Anchor, Waves, Fuel, ShoppingBag, Wrench, Loader2 } from "lucide-react";

interface MarinaRegistrationFormProps {
  onSubmit: (data: {
    marina_name: string;
    address: string;
    total_slips: number;
    staging_dock_linear_footage: number;
    amenities: string[];
  }) => Promise<boolean>;
  loading?: boolean;
}

const amenityOptions = [
  { id: "dry_stack", label: "Dry Stack Storage", icon: Waves },
  { id: "fuel_dock", label: "Fuel Dock", icon: Fuel },
  { id: "ship_store", label: "Ship Store", icon: ShoppingBag },
  { id: "service_yard", label: "Service Yard", icon: Wrench },
];

export function MarinaRegistrationForm({ onSubmit, loading }: MarinaRegistrationFormProps) {
  const [marinaName, setMarinaName] = useState("");
  const [address, setAddress] = useState("");
  const [totalSlips, setTotalSlips] = useState("");
  const [stagingFootage, setStagingFootage] = useState("500");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      marina_name: marinaName,
      address,
      total_slips: parseInt(totalSlips) || 0,
      staging_dock_linear_footage: parseFloat(stagingFootage) || 500,
      amenities: selectedAmenities,
    });
  };

  return (
    <Card className="animate-scale-in">
      <CardHeader className="text-center pb-2">
        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">Register Your Marina</CardTitle>
        <CardDescription>Set up your marina to start managing operations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="marinaName" className="font-medium flex items-center gap-2">
              <Anchor className="w-4 h-4" />
              Marina Name
            </Label>
            <Input
              id="marinaName"
              placeholder="Sunset Harbor Marina"
              value={marinaName}
              onChange={(e) => setMarinaName(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </Label>
            <Input
              id="address"
              placeholder="123 Marina Way, Seaside, FL 33000"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalSlips" className="font-medium">
                Total Slips
              </Label>
              <Input
                id="totalSlips"
                type="number"
                placeholder="50"
                value={totalSlips}
                onChange={(e) => setTotalSlips(e.target.value)}
                min="0"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stagingFootage" className="font-medium">
                Staging Dock (ft)
              </Label>
              <Input
                id="stagingFootage"
                type="number"
                placeholder="500"
                value={stagingFootage}
                onChange={(e) => setStagingFootage(e.target.value)}
                min="0"
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-medium">Amenities & Modules</Label>
            <div className="grid grid-cols-2 gap-3">
              {amenityOptions.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = selectedAmenities.includes(amenity.id);

                return (
                  <div
                    key={amenity.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleAmenityToggle(amenity.id)}
                  >
                    <Checkbox
                      id={amenity.id}
                      checked={isSelected}
                      onCheckedChange={() => handleAmenityToggle(amenity.id)}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor={amenity.id} className="text-sm cursor-pointer flex-1">
                      {amenity.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-gold hover:opacity-90 shadow-gold text-foreground font-semibold"
            disabled={loading || !marinaName}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
