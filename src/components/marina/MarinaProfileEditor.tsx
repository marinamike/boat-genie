import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Shield, 
  Settings, 
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
  Fuel,
  Wifi,
  UtensilsCrossed,
  Waves,
  ShieldCheck,
  WashingMachine,
  Anchor,
  Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Marina {
  id: string;
  marina_name: string;
  address: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  max_length_ft: number | null;
  max_beam_ft: number | null;
  max_draft_ft: number | null;
  min_depth_ft: number | null;
  power_options: string[] | null;
  transient_rate_per_ft: number | null;
  monthly_base_rate: number | null;
  require_insurance_long_term: boolean;
  require_registration: boolean;
  auto_approve_transient: boolean;
  fuel_gas: boolean;
  fuel_diesel: boolean;
  has_pool: boolean;
  has_pumpout: boolean;
  has_laundry: boolean;
  has_restaurant: boolean;
  has_security: boolean;
  has_wifi: boolean;
  photos: string[];
  accepts_transient: boolean;
  accepts_longterm: boolean;
}

interface MarinaProfileEditorProps {
  marina: Marina;
  onSave: () => void;
}

const POWER_OPTIONS = ["30A", "50A", "100A", "3-Phase"];

export function MarinaProfileEditor({ marina, onSave }: MarinaProfileEditorProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    marina_name: marina.marina_name || "",
    address: marina.address || "",
    description: marina.description || "",
    latitude: marina.latitude?.toString() || "",
    longitude: marina.longitude?.toString() || "",
    contact_email: marina.contact_email || "",
    contact_phone: marina.contact_phone || "",
    website_url: marina.website_url || "",
    max_length_ft: marina.max_length_ft?.toString() || "",
    max_beam_ft: marina.max_beam_ft?.toString() || "",
    max_draft_ft: marina.max_draft_ft?.toString() || "",
    min_depth_ft: marina.min_depth_ft?.toString() || "",
    power_options: marina.power_options || [],
    transient_rate_per_ft: marina.transient_rate_per_ft?.toString() || "",
    monthly_base_rate: marina.monthly_base_rate?.toString() || "",
    require_insurance_long_term: marina.require_insurance_long_term ?? true,
    require_registration: marina.require_registration ?? true,
    auto_approve_transient: marina.auto_approve_transient ?? false,
    fuel_gas: marina.fuel_gas ?? false,
    fuel_diesel: marina.fuel_diesel ?? false,
    has_pool: marina.has_pool ?? false,
    has_pumpout: marina.has_pumpout ?? false,
    has_laundry: marina.has_laundry ?? false,
    has_restaurant: marina.has_restaurant ?? false,
    has_security: marina.has_security ?? false,
    has_wifi: marina.has_wifi ?? false,
    photos: marina.photos || [],
    accepts_transient: marina.accepts_transient ?? true,
    accepts_longterm: marina.accepts_longterm ?? true,
  });

  const togglePowerOption = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      power_options: prev.power_options.includes(option)
        ? prev.power_options.filter((o) => o !== option)
        : [...prev.power_options, option],
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${marina.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("marina-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("marina-photos")
          .getPublicUrl(fileName);

        newPhotos.push(urlData.publicUrl);
      }

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));

      toast({ title: "Photos Uploaded", description: `${newPhotos.length} photo(s) added` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", description: "Could not upload photos", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!formData.marina_name.trim()) {
      toast({ title: "Error", description: "Marina name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        marina_name: formData.marina_name,
        address: formData.address || null,
        description: formData.description || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website_url: formData.website_url || null,
        max_length_ft: formData.max_length_ft ? parseFloat(formData.max_length_ft) : null,
        max_beam_ft: formData.max_beam_ft ? parseFloat(formData.max_beam_ft) : null,
        max_draft_ft: formData.max_draft_ft ? parseFloat(formData.max_draft_ft) : null,
        min_depth_ft: formData.min_depth_ft ? parseFloat(formData.min_depth_ft) : null,
        power_options: formData.power_options.length > 0 ? formData.power_options : null,
        transient_rate_per_ft: formData.transient_rate_per_ft ? parseFloat(formData.transient_rate_per_ft) : null,
        monthly_base_rate: formData.monthly_base_rate ? parseFloat(formData.monthly_base_rate) : null,
        require_insurance_long_term: formData.require_insurance_long_term,
        require_registration: formData.require_registration,
        auto_approve_transient: formData.auto_approve_transient,
        fuel_gas: formData.fuel_gas,
        fuel_diesel: formData.fuel_diesel,
        has_pool: formData.has_pool,
        has_pumpout: formData.has_pumpout,
        has_laundry: formData.has_laundry,
        has_restaurant: formData.has_restaurant,
        has_security: formData.has_security,
        has_wifi: formData.has_wifi,
        photos: formData.photos,
        accepts_transient: formData.accepts_transient,
        accepts_longterm: formData.accepts_longterm,
      };

      const { error } = await supabase
        .from("marinas")
        .update(updateData)
        .eq("id", marina.id);

      if (error) throw error;

      toast({ title: "Profile Updated", description: "Your marina profile has been saved" });
      onSave();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save marina profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Marina Profile
        </CardTitle>
        <CardDescription>Edit your marina's public listing and settings</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="specs">Specs</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="rates">Rates</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Marina Name *</Label>
              <Input
                id="name"
                value={formData.marina_name}
                onChange={(e) => setFormData({ ...formData, marina_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  className="pl-10"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full street address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Public Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your marina..."
                rows={4}
              />
            </div>
          </TabsContent>

          {/* Technical Specs */}
          <TabsContent value="specs" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxLength">Max LOA (ft)</Label>
                <Input
                  id="maxLength"
                  type="number"
                  value={formData.max_length_ft}
                  onChange={(e) => setFormData({ ...formData, max_length_ft: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBeam">Max Beam (ft)</Label>
                <Input
                  id="maxBeam"
                  type="number"
                  value={formData.max_beam_ft}
                  onChange={(e) => setFormData({ ...formData, max_beam_ft: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDraft">Max Draft (ft)</Label>
                <Input
                  id="maxDraft"
                  type="number"
                  value={formData.max_draft_ft}
                  onChange={(e) => setFormData({ ...formData, max_draft_ft: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minDepth">Min Depth (ft)</Label>
                <Input
                  id="minDepth"
                  type="number"
                  value={formData.min_depth_ft}
                  onChange={(e) => setFormData({ ...formData, min_depth_ft: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Power Availability</Label>
              <div className="flex flex-wrap gap-2">
                {POWER_OPTIONS.map((option) => (
                  <Badge
                    key={option}
                    variant={formData.power_options.includes(option) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePowerOption(option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Requirement Settings
              </h4>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Require Insurance (Long-term)</p>
                  <p className="text-sm text-muted-foreground">Require proof of insurance for stays over 30 days</p>
                </div>
                <Switch
                  checked={formData.require_insurance_long_term}
                  onCheckedChange={(checked) => setFormData({ ...formData, require_insurance_long_term: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Require Registration</p>
                  <p className="text-sm text-muted-foreground">Require hull registration on file</p>
                </div>
                <Switch
                  checked={formData.require_registration}
                  onCheckedChange={(checked) => setFormData({ ...formData, require_registration: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Auto-approve Transient</p>
                  <p className="text-sm text-muted-foreground">Instantly approve short-stay bookings</p>
                </div>
                <Switch
                  checked={formData.auto_approve_transient}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_approve_transient: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Amenities */}
          <TabsContent value="amenities" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <Checkbox
                  checked={formData.fuel_gas}
                  onCheckedChange={(checked) => setFormData({ ...formData, fuel_gas: !!checked })}
                />
                <Fuel className="w-4 h-4 text-muted-foreground" />
                <span>Fuel (Gas)</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <Checkbox
                  checked={formData.fuel_diesel}
                  onCheckedChange={(checked) => setFormData({ ...formData, fuel_diesel: !!checked })}
                />
                <Fuel className="w-4 h-4 text-muted-foreground" />
                <span>Fuel (Diesel)</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <Checkbox
                  checked={formData.has_pool}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_pool: !!checked })}
                />
                <Waves className="w-4 h-4 text-muted-foreground" />
                <span>Pool</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <Checkbox
                  checked={formData.has_pumpout}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_pumpout: !!checked })}
                />
                <Anchor className="w-4 h-4 text-muted-foreground" />
                <span>Pump-out</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <Checkbox
                  checked={formData.has_laundry}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_laundry: !!checked })}
                />
                <WashingMachine className="w-4 h-4 text-muted-foreground" />
                <span>Laundry</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <Checkbox
                  checked={formData.has_restaurant}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_restaurant: !!checked })}
                />
                <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                <span>Restaurant</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <Checkbox
                  checked={formData.has_security}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_security: !!checked })}
                />
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <span>24/7 Security</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50">
                <Checkbox
                  checked={formData.has_wifi}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_wifi: !!checked })}
                />
                <Wifi className="w-4 h-4 text-muted-foreground" />
                <span>WiFi</span>
              </label>
            </div>

            <Separator />

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Accepts Transient Stays</span>
              <Switch
                checked={formData.accepts_transient}
                onCheckedChange={(checked) => setFormData({ ...formData, accepts_transient: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Accepts Long-term Stays</span>
              <Switch
                checked={formData.accepts_longterm}
                onCheckedChange={(checked) => setFormData({ ...formData, accepts_longterm: checked })}
              />
            </div>
          </TabsContent>

          {/* Rates */}
          <TabsContent value="rates" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transientRate" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Transient Rate (per foot/night)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="transientRate"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  value={formData.transient_rate_per_ft}
                  onChange={(e) => setFormData({ ...formData, transient_rate_per_ft: e.target.value })}
                  placeholder="e.g., 3.50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyRate" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Monthly Base Rate
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="monthlyRate"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  value={formData.monthly_base_rate}
                  onChange={(e) => setFormData({ ...formData, monthly_base_rate: e.target.value })}
                  placeholder="e.g., 1500"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Rates shown on your public profile help boaters estimate costs before requesting a reservation.
            </p>
          </TabsContent>

          {/* Photos */}
          <TabsContent value="photos" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden border group">
                  <img src={photo} alt={`Marina photo ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add Photos</span>
                  </>
                )}
              </label>
            </div>

            <p className="text-sm text-muted-foreground">
              High-quality photos help attract boaters. Upload marina views, docks, amenities, and facilities.
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}