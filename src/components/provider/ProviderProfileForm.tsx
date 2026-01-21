import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Briefcase, DollarSign, FileText, Loader2, CheckCircle2, Lock, AlertCircle, Phone } from "lucide-react";
import { useProviderProfile, ProviderProfile } from "@/hooks/useProviderProfile";
import { cn } from "@/lib/utils";
import { PhoneInput, isValidPhone } from "@/components/ui/phone-input";

interface ProviderProfileFormProps {
  onComplete?: () => void;
}

export function ProviderProfileForm({ onComplete }: ProviderProfileFormProps) {
  const { profile, loading, isAdmin, areRatesLocked, createProfile, updateProfile, SERVICE_CATEGORIES } = useProviderProfile();
  
  const [formData, setFormData] = useState({
    business_name: "",
    bio: "",
    primary_contact_phone: "",
    hourly_rate: "",
    rate_per_foot: "",
    diagnostic_fee: "",
    service_categories: [] as string[],
    is_available: true,
    rates_agreed: false,
  });
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || "",
        bio: profile.bio || "",
        primary_contact_phone: profile.primary_contact_phone || "",
        hourly_rate: profile.hourly_rate?.toString() || "",
        rate_per_foot: profile.rate_per_foot?.toString() || "",
        diagnostic_fee: profile.diagnostic_fee?.toString() || "",
        service_categories: profile.service_categories || [],
        is_available: profile.is_available,
        rates_agreed: profile.rates_agreed,
      });
    }
  }, [profile]);

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      service_categories: prev.service_categories.includes(category)
        ? prev.service_categories.filter(c => c !== category)
        : [...prev.service_categories, category],
    }));
  };

  const canEditRates = !areRatesLocked || isAdmin;
  const isOnboarding = !profile;
  const hasValidPhone = formData.primary_contact_phone && isValidPhone(formData.primary_contact_phone);
  const canGoLive = formData.business_name && formData.service_categories.length > 0 && hasValidPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!formData.primary_contact_phone || !isValidPhone(formData.primary_contact_phone)) {
      setPhoneError("Please enter a valid phone number in (XXX) XXX-XXXX format");
      return;
    }
    setPhoneError("");
    
    // Validation: must agree to rates before going live
    if (!profile && formData.is_available && !formData.rates_agreed) {
      return;
    }
    
    setSaving(true);

    const profileData: Partial<ProviderProfile> = {
      business_name: formData.business_name || null,
      bio: formData.bio || null,
      primary_contact_phone: formData.primary_contact_phone || null,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      rate_per_foot: formData.rate_per_foot ? parseFloat(formData.rate_per_foot) : null,
      diagnostic_fee: formData.diagnostic_fee ? parseFloat(formData.diagnostic_fee) : null,
      service_categories: formData.service_categories,
      is_available: formData.is_available,
      rates_agreed: formData.rates_agreed,
    };

    const success = profile 
      ? await updateProfile(profileData)
      : await createProfile(profileData);

    setSaving(false);
    if (success && onComplete) {
      onComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              placeholder="Your business or trade name"
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Description</Label>
            <Textarea
              id="bio"
              placeholder="Tell boat owners about your experience and services..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_contact_phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Mobile Phone Number <span className="text-destructive">*</span>
            </Label>
            <PhoneInput
              id="primary_contact_phone"
              value={formData.primary_contact_phone}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, primary_contact_phone: value }));
                if (phoneError) setPhoneError("");
              }}
              required
            />
            {phoneError && (
              <p className="text-sm text-destructive">{phoneError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Required for job coordination. Boat owners and marina staff can contact you at this number.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Available for Work</Label>
              <p className="text-sm text-muted-foreground">Show your profile to boat owners</p>
            </div>
            <Switch
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Standard Rates
            {areRatesLocked && !isAdmin && (
              <Badge variant="secondary" className="ml-2">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isOnboarding 
              ? "Set your standard rates. These will be locked once you go live."
              : areRatesLocked && !isAdmin
                ? "Rates are locked after going live. Contact Boat Genie Support to request changes."
                : isAdmin
                  ? "Admin override: You can edit locked rates."
                  : "Set your standard rates before going live."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {areRatesLocked && !isAdmin && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To update your standard rates, please contact Boat Genie Support.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate" className="flex items-center gap-2">
                Hourly Rate ($)
              </Label>
              <Input
                id="hourly_rate"
                type="number"
                placeholder="75"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                disabled={!canEditRates}
                className={cn(!canEditRates && "bg-muted cursor-not-allowed")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_per_foot" className="flex items-center gap-2">
                Per-Foot Rate ($)
              </Label>
              <Input
                id="rate_per_foot"
                type="number"
                step="0.01"
                placeholder="2.50"
                value={formData.rate_per_foot}
                onChange={(e) => setFormData(prev => ({ ...prev, rate_per_foot: e.target.value }))}
                disabled={!canEditRates}
                className={cn(!canEditRates && "bg-muted cursor-not-allowed")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnostic_fee" className="flex items-center gap-2">
                Diagnostic Fee ($)
              </Label>
              <Input
                id="diagnostic_fee"
                type="number"
                placeholder="150"
                value={formData.diagnostic_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnostic_fee: e.target.value }))}
                disabled={!canEditRates}
                className={cn(!canEditRates && "bg-muted cursor-not-allowed")}
              />
            </div>
          </div>

          {/* Rate Agreement Checkbox - only show during onboarding or before rates are locked */}
          {canEditRates && !profile?.rates_agreed && (
            <div className="flex items-start space-x-3 pt-4 border-t">
              <Checkbox
                id="rates_agreed"
                checked={formData.rates_agreed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rates_agreed: checked === true }))}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="rates_agreed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree that these rates are locked
                </label>
                <p className="text-sm text-muted-foreground">
                  I understand that my standard rates cannot be changed without written approval from Boat Genie. 
                  This ensures pricing consistency for boat owners.
                </p>
              </div>
            </div>
          )}

          {isOnboarding && formData.is_available && !formData.rates_agreed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must agree to lock your rates before going live.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Service Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Select all services you offer
          </p>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((category) => {
              const isSelected = formData.service_categories.includes(category);
              return (
                <Badge
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5",
                    isSelected && "bg-primary"
                  )}
                  onClick={() => toggleCategory(category)}
                >
                  {isSelected && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {category}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={saving || (isOnboarding && formData.is_available && !formData.rates_agreed) || !canGoLive}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : profile ? (
          "Update Profile"
        ) : formData.rates_agreed ? (
          "Go Live"
        ) : (
          "Create Profile"
        )}
      </Button>
    </form>
  );
}
