import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Loader2, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boatId: string;
  boatName?: string;
  defaultCategory: "manuals" | "warranty" | "documentation";
  onSuccess: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "manuals", label: "Manuals & Technical" },
  { value: "warranty", label: "Warranty & Insurance" },
  { value: "documentation", label: "Documentation" },
];

export function DocumentUploadSheet({
  open,
  onOpenChange,
  boatId,
  boatName,
  defaultCategory,
  onSuccess,
}: DocumentUploadSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [expiryDate, setExpiryDate] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-fill title from filename
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !boatId || !title.trim()) return;

    setUploading(true);
    try {
      // Upload file to storage (vessel-vault bucket)
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const filePath = `${user.id}/${boatId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("vessel-vault")
        .upload(filePath, file, {
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Save document record with file PATH (not signed URL)
      // Signed URLs are generated on-demand when viewing
      const { error: dbError } = await supabase.from("vessel_documents").insert({
        boat_id: boatId,
        owner_id: user.id,
        category,
        title: title.trim(),
        description: description.trim() || null,
        file_url: filePath, // Store the path, not a signed URL
        file_type: fileExt,
        file_size_bytes: file.size,
        expiry_date: expiryDate || null,
      });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded",
        description: `${title} has been added to your vault.`,
      });

      // Reset form
      setFile(null);
      setPreview(null);
      setTitle("");
      setDescription("");
      setExpiryDate("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Add Document</SheetTitle>
          <SheetDescription>
            Upload a document for {boatName || "your vessel"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Document File</Label>
            {file ? (
              <div className="relative border rounded-lg p-4 bg-muted/30">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={clearFile}
                >
                  <X className="w-4 h-4" />
                </Button>
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-32 mx-auto rounded"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <FileText className="w-10 h-10 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Choose file</p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG up to 50MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Take Photo</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Engine Service Manual"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this document..."
              rows={2}
            />
          </div>

          {/* Expiry Date */}
          {category === "warranty" && (
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiration Date</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!file || !title.trim() || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
