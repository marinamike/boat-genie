import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Eye, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  FileWarning
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  documentUrl: string | null;
  label: string;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
}

type FileStatus = "idle" | "loading" | "success" | "error";

export function DocumentViewer({ 
  documentUrl, 
  label, 
  verified, 
  onVerifiedChange 
}: DocumentViewerProps) {
  const [fileStatus, setFileStatus] = useState<FileStatus>("idle");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const isImageFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const isPdfFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'pdf';
  };

  const getSignedUrl = async (): Promise<string | null> => {
    if (!documentUrl) return null;

    setFileStatus("loading");
    setErrorMessage(null);

    try {
      // Extract the file path from the URL
      // The URL format is typically: https://project.supabase.co/storage/v1/object/public/bucket/path
      // or just the path: bucket/path
      let filePath = documentUrl;
      
      // If it's a full URL, extract just the path part
      if (documentUrl.includes('/storage/v1/object/')) {
        const pathMatch = documentUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/(.+)/);
        if (pathMatch) {
          filePath = pathMatch[1];
        }
      }

      // Get the bucket and file path
      const parts = filePath.split('/');
      const bucket = parts[0];
      const path = parts.slice(1).join('/');

      // Create signed URL (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from(bucket || 'provider-documents')
        .createSignedUrl(path || filePath, 3600);

      if (error) {
        console.error("Signed URL error:", error);
        throw new Error("File not found in storage. Request re-upload.");
      }

      if (!data?.signedUrl) {
        throw new Error("File not found in storage. Request re-upload.");
      }

      setSignedUrl(data.signedUrl);
      setFileStatus("success");
      return data.signedUrl;
    } catch (error: any) {
      console.error("Error getting signed URL:", error);
      setFileStatus("error");
      setErrorMessage(error.message || "File not found in storage. Request re-upload.");
      return null;
    }
  };

  const handleViewDocument = async () => {
    const url = await getSignedUrl();
    
    if (!url) {
      toast({
        title: "Document Error",
        description: errorMessage || "File not found in storage. Request re-upload.",
        variant: "destructive",
      });
      return;
    }

    if (isImageFile(documentUrl!)) {
      // Open image in modal
      setShowImageModal(true);
    } else {
      // Open PDF or other files in new tab
      window.open(url, '_blank');
    }
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
    <>
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          {verified ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <div className="w-4 h-4" />
          )}
          <span>{label}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {fileStatus === "error" ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              File Error
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDocument}
              disabled={fileStatus === "loading"}
            >
              {fileStatus === "loading" ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : isPdfFile(documentUrl) ? (
                <ExternalLink className="w-4 h-4 mr-1" />
              ) : (
                <Eye className="w-4 h-4 mr-1" />
              )}
              View Document
            </Button>
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

      {fileStatus === "error" && (
        <div className="ml-7 mt-1 text-sm text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {errorMessage}
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center overflow-auto max-h-[70vh]">
            {signedUrl && (
              <img 
                src={signedUrl} 
                alt={label}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={() => {
                  setFileStatus("error");
                  setErrorMessage("Failed to load image. Request re-upload.");
                  setShowImageModal(false);
                  toast({
                    title: "Image Load Error",
                    description: "Failed to load image. Request re-upload.",
                    variant: "destructive",
                  });
                }}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => signedUrl && window.open(signedUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
