import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Briefcase, DollarSign, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useProviderProfile, ProviderProfile } from "@/hooks/useProviderProfile";
import { cn } from "@/lib/utils";

interface ProviderProfileFormProps {
  onComplete?: () => void;
}

export function ProviderProfileForm({ onComplete }: ProviderProfileFormProps) {
  const { profile, loading, createProfile, updateProfile, SERVICE_CATEGORIES } = useProviderProfile();
  
  const [formData, setFormData] = useState({
    business_name: "",
    bio: "",
    hourly_rate: "",
    service_categories: [] as string[],
    is_available: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || "",
        bio: profile.bio || "",
        hourly_rate: profile.hourly_rate?.toString() || "",
        service_categories: profile.service_categories || [],
        is_available: profile.is_available,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const profileData: Partial<ProviderProfile> = {
      business_name: formData.business_name || null,
      bio: formData.bio || null,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      service_categories: formData.service_categories,
      is_available: formData.is_available,
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
            <Label htmlFor="hourly_rate" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Hourly Rate
            </Label>
            <Input
              id="hourly_rate"
              type="number"
              placeholder="75"
              value={formData.hourly_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
            />
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

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : profile ? (
          "Update Profile"
        ) : (
          "Create Profile"
        )}
      </Button>
    </form>
  );
}
