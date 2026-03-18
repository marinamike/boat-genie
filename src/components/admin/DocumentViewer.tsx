import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface DocumentViewerProps {
  documentUrl: string | null;
  label: string;
  expiryDate?: string | null;
  verified?: boolean;
  onVerifiedChange?: (v: boolean) => void;
}

export const DocumentViewer = ({ documentUrl, label, expiryDate }: DocumentViewerProps) => {
  if (!documentUrl) {
    return (
      <div className="flex items-center justify-between p-2 rounded border border-border bg-muted/50">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">Not uploaded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 rounded border border-border">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {expiryDate && (
          <span className="text-xs text-muted-foreground ml-2">Exp: {expiryDate}</span>
        )}
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href={documentUrl} target="_blank" rel="noopener noreferrer">
          <Eye className="w-4 h-4 mr-1" />
          View
        </a>
      </Button>
    </div>
  );
};
