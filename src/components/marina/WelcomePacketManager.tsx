import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Image, 
  Upload, 
  Trash2, 
  ExternalLink,
  FileIcon,
  Loader2
} from "lucide-react";
import type { WelcomePacketFile } from "@/hooks/useWelcomePacket";

interface WelcomePacketManagerProps {
  files: WelcomePacketFile[];
  uploading: boolean;
  onUpload: (file: File, description?: string) => Promise<unknown>;
  onDelete: (fileId: string) => void;
  onToggleActive: (fileId: string) => void;
}

export function WelcomePacketManager({
  files,
  uploading,
  onUpload,
  onDelete,
  onToggleActive,
}: WelcomePacketManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a PDF or image file (JPEG, PNG, WebP)");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      await onUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "image":
        return <Image className="w-5 h-5 text-blue-500" />;
      default:
        return <FileIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Digital Welcome Packet
        </CardTitle>
        <CardDescription>
          Upload WiFi codes, marina rules, and other materials for boaters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Accepted formats: PDF, JPEG, PNG, WebP (max 10MB)
        </p>

        {/* Files List */}
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No files uploaded yet</p>
            <p className="text-xs">Upload PDFs or images to create your welcome packet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  file.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                }`}
              >
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file.file_type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs">
                      {file.file_type.toUpperCase()}
                    </Badge>
                    {!file.is_active && (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={file.is_active}
                    onCheckedChange={() => onToggleActive(file.id)}
                    aria-label="Toggle active"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(file.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-primary/5 rounded-lg p-3 text-sm">
          <p className="font-medium text-primary mb-1">Auto-Push on Check-In</p>
          <p className="text-muted-foreground text-xs">
            Active files are automatically shared with boaters when they check in at your marina.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default WelcomePacketManager;
