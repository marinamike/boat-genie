import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Loader2, Upload, User } from "lucide-react";
import { useProviderOnboarding } from "@/hooks/useProviderOnboarding";

interface BusinessProfileFormProps {
  onComplete?: () => void;
}

export function BusinessProfileForm({ onComplete }: BusinessProfileFormProps) {
  const { profile, loading, updateProfile, uploadDocument } = useProviderOnboarding();
  
  const [formData, setFormData] = useState({
    business_name: "",
    bio: "",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || "",
        bio: profile.bio || "",
        primary_contact_name: profile.primary_contact_name || "",
        primary_contact_email: profile.primary_contact_email || "",
        primary_contact_phone: profile.primary_contact_phone || "",
      });
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    await uploadDocument(file, "logo");
    setUploadingLogo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await updateProfile({
      business_name: formData.business_name || null,
      bio: formData.bio || null,
      primary_contact_name: formData.primary_contact_name || null,
      primary_contact_email: formData.primary_contact_email || null,
      primary_contact_phone: formData.primary_contact_phone || null,
    });

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

  const isComplete = Boolean(
    formData.business_name && 
    formData.primary_contact_name && 
    formData.primary_contact_email
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Profile
          </CardTitle>
          <CardDescription>
            Your company information displayed to boat owners
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.logo_url || undefined} />
              <AvatarFallback className="bg-primary/10">
                <Building2 className="w-8 h-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label className="mb-2 block">Company Logo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploadingLogo}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 5MB
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              placeholder="Your company or trade name"
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Business Description</Label>
            <Textarea
              id="bio"
              placeholder="Tell boat owners about your experience and services..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Primary Contact
          </CardTitle>
          <CardDescription>
            Main point of contact for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary_contact_name">Full Name *</Label>
            <Input
              id="primary_contact_name"
              placeholder="John Smith"
              value={formData.primary_contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary_contact_email">Email *</Label>
              <Input
                id="primary_contact_email"
                type="email"
                placeholder="john@company.com"
                value={formData.primary_contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_contact_phone">Phone</Label>
              <Input
                id="primary_contact_phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.primary_contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_phone: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={saving || !isComplete}>
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Business Profile"
        )}
      </Button>
    </form>
  );
}
