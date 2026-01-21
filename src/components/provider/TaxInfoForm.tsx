import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useProviderOnboarding } from "@/hooks/useProviderOnboarding";

interface TaxInfoFormProps {
  onComplete?: () => void;
}

export function TaxInfoForm({ onComplete }: TaxInfoFormProps) {
  const { profile, loading, updateProfile, uploadDocument } = useProviderOnboarding();
  
  const [ein, setEin] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile?.ein) {
      setEin(profile.ein);
    }
  }, [profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await uploadDocument(file, "w9");
    setUploading(false);
  };

  const handleSaveEin = async () => {
    if (!ein) return;
    
    setSaving(true);
    const success = await updateProfile({ ein });
    setSaving(false);
    
    if (success && onComplete) {
      onComplete();
    }
  };

  const formatEin = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Format as XX-XXXXXXX
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isComplete = Boolean(profile?.w9_doc_url && profile?.ein);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tax Information
          </CardTitle>
          <CardDescription>
            Required for 1099 reporting and payouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* W-9 Upload */}
          <div className="space-y-3">
            <Label>W-9 Form *</Label>
            
            {profile?.w9_doc_url ? (
              <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-400">W-9 Uploaded</p>
                  <p className="text-sm text-muted-foreground">
                    Your tax document is on file
                  </p>
                </div>
                <div>
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="w9-upload"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("w9-upload")?.click()}
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
                  Upload your completed W-9 form
                </p>
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="w9-upload"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("w9-upload")?.click()}
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

          {/* EIN */}
          <div className="space-y-2">
            <Label htmlFor="ein">Employer Identification Number (EIN) *</Label>
            <Input
              id="ein"
              placeholder="XX-XXXXXXX"
              value={ein}
              onChange={(e) => setEin(formatEin(e.target.value))}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Your 9-digit federal tax ID number
            </p>
          </div>

          {ein && ein !== profile?.ein && (
            <Button onClick={handleSaveEin} disabled={saving || ein.length !== 10}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save EIN"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {isComplete && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Tax information is complete!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
