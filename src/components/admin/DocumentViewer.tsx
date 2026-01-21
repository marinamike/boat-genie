import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  FileWarning,
  Download,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  documentUrl: string | null;
  label: string;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  showDiagnostics?: boolean;
}

type FileStatus = "idle" | "loading" | "success" | "error";

export function DocumentViewer({ 
  documentUrl, 
  label, 
  verified, 
  onVerifiedChange,
  showDiagnostics = true
}: DocumentViewerProps) {
  const [fileStatus, setFileStatus] = useState<FileStatus>("idle");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedPath, setExtractedPath] = useState<string | null>(null);
  const { toast } = useToast();

  // Extract the file path from various URL formats
  const extractFilePath = (url: string): string => {
    let filePath = url;
    
    // Handle full Supabase Storage URL format
    // Example: https://project.supabase.co/storage/v1/object/public/provider-documents/user-id/file.pdf
    if (url.includes('/storage/v1/object/')) {
      const pathMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/provider-documents\/(.+)/);
      if (pathMatch) {
        filePath = pathMatch[1];
      }
    } 
    // Handle bucket-prefixed path
    // Example: provider-documents/user-id/file.pdf
    else if (url.startsWith('provider-documents/')) {
      filePath = url.replace('provider-documents/', '');
    }
    // Otherwise assume it's already the relative path: user-id/file.pdf
    
    return filePath;
  };

  const getSignedUrl = async (): Promise<string | null> => {
    if (!documentUrl) return null;

    setFileStatus("loading");
    setErrorMessage(null);

    try {
      const filePath = extractFilePath(documentUrl);
      setExtractedPath(filePath);
      
      console.log("[DocumentViewer] Creating signed URL for path:", filePath);
      console.log("[DocumentViewer] Original documentUrl:", documentUrl);

      // Create signed URL (valid for 300 seconds / 5 minutes)
      const { data, error } = await supabase.storage
        .from('provider-documents')
        .createSignedUrl(filePath, 300);

      if (error) {
        console.error("[DocumentViewer] Signed URL error:", error, "Path attempted:", filePath);
        throw new Error(`Storage error: ${error.message}. Path: ${filePath}`);
      }

      if (!data?.signedUrl) {
        throw new Error(`No signed URL returned. Path: ${filePath}`);
      }

      console.log("[DocumentViewer] Signed URL created successfully");
      setSignedUrl(data.signedUrl);
      setFileStatus("success");
      return data.signedUrl;
    } catch (error: any) {
      console.error("[DocumentViewer] Error getting signed URL:", error);
      setFileStatus("error");
      setErrorMessage(error.message || "Failed to access file");
      return null;
    }
  };

  const handleViewDocument = async () => {
    const url = await getSignedUrl();
    
    if (!url) {
      toast({
        title: "Document Error",
        description: errorMessage || "Failed to access file. Check the diagnostic path below.",
        variant: "destructive",
      });
      return;
    }

    // Open in new tab - append ?download as fallback for stubborn PDF viewers
    const downloadUrl = `${url}&download=`;
    window.open(url, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Document opened",
      description: "If the document doesn't load, try the download link.",
    });
  };

  const handleDownloadFallback = async () => {
    const url = signedUrl || await getSignedUrl();
    
    if (!url) {
      toast({
        title: "Download Error",
        description: errorMessage || "Failed to generate download link.",
        variant: "destructive",
      });
      return;
    }

    // Force download by adding download parameter
    const downloadUrl = `${url}&download=`;
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const copyPathToClipboard = () => {
    const pathToCopy = extractedPath || documentUrl || "";
    navigator.clipboard.writeText(pathToCopy);
    toast({
      title: "Path copied",
      description: "File path copied to clipboard for debugging.",
    });
  };

  if (!documentUrl) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <FileWarning className="w-4 h-4 text-destructive" />
          <span>{label}</span>
        </div>
        <Badge variant="destructive">Missing</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          {verified ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <div className="w-4 h-4" />
          )}
          <span>{label}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {fileStatus === "error" ? (
            <>
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Error
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDocument}
              >
                Retry
              </Button>
            </>
          ) : (
            <>
              {/* Primary: Open in new tab */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDocument}
                disabled={fileStatus === "loading"}
              >
                {fileStatus === "loading" ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-1" />
                )}
                View
              </Button>

              {/* Secondary: Download fallback */}
              {signedUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadFallback}
                  title="Download file directly"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </>
          )}

          <div className="flex items-center gap-2 border-l pl-3">
            <Checkbox
              id={`verify-${label}`}
              checked={verified}
              onCheckedChange={(checked) => onVerifiedChange(checked === true)}
            />
            <label 
              htmlFor={`verify-${label}`}
              className="text-sm font-medium cursor-pointer"
            >
              Verified
            </label>
          </div>
        </div>
      </div>

      {/* Error message */}
      {fileStatus === "error" && errorMessage && (
        <div className="ml-7 text-sm text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="break-all">{errorMessage}</span>
        </div>
      )}

      {/* Diagnostic info - always show in God Mode */}
      {showDiagnostics && (
        <div className="ml-7 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="truncate max-w-[300px]" title={extractedPath || documentUrl}>
            Path: {extractedPath || documentUrl}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={copyPathToClipboard}
            title="Copy path"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
