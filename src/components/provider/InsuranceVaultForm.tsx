import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useProviderOnboarding } from "@/hooks/useProviderOnboarding";
import { format, isAfter, addMonths } from "date-fns";

interface InsuranceVaultFormProps {
  onComplete?: () => void;
}

export function InsuranceVaultForm({ onComplete }: InsuranceVaultFormProps) {
  const { profile, loading, updateProfile, uploadDocument } = useProviderOnboarding();
  
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile?.insurance_expiry) {
      setExpiryDate(profile.insurance_expiry);
    }
  }, [profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await uploadDocument(file, "insurance");
    setUploading(false);
  };

  const handleSaveExpiry = async () => {
    if (!expiryDate) return;
    
    setSaving(true);
    const success = await updateProfile({ insurance_expiry: expiryDate });
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

  const isComplete = Boolean(profile?.insurance_doc_url && profile?.insurance_expiry);
  const isExpiringSoon = profile?.insurance_expiry && 
    !isAfter(new Date(profile.insurance_expiry), addMonths(new Date(), 1));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Insurance Vault
          </CardTitle>
          <CardDescription>
            Upload your Certificate of Insurance (COI) for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Upload */}
          <div className="space-y-3">
            <Label>Certificate of Insurance (COI) *</Label>
            
            {profile?.insurance_doc_url ? (
              <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-400">Document Uploaded</p>
                  <p className="text-sm text-muted-foreground">
                    Your insurance certificate is on file
                  </p>
                </div>
                <div>
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="insurance-upload"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("insurance-upload")?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Replace"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Upload your Certificate of Insurance
                </p>
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="insurance-upload"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("insurance-upload")?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select File
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, PNG, or JPG up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="insurance_expiry">Expiration Date *</Label>
            <Input
              id="insurance_expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
            {isExpiringSoon && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your insurance is expiring soon. Please upload updated documentation.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {profile?.insurance_doc_url && expiryDate && expiryDate !== profile.insurance_expiry && (
            <Button onClick={handleSaveExpiry} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Expiration Date"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {isComplete && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Insurance documentation is complete!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
