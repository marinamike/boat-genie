import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarIcon, Trash2, Upload, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { BoatWarranty } from "@/hooks/useVesselSpecs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WarrantyEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warranty: BoatWarranty | null;
  boatId: string;
  isCreating: boolean;
  onSave: (data: Omit<BoatWarranty, "id">) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function WarrantyEditSheet({
  open,
  onOpenChange,
  warranty,
  boatId,
  isCreating,
  onSave,
  onDelete,
}: WarrantyEditSheetProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [warrantyName, setWarrantyName] = useState("");
  const [warrantyType, setWarrantyType] = useState<string>("manufacturer");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (warranty) {
      setWarrantyName(warranty.warranty_name);
      setWarrantyType(warranty.warranty_type);
      setStartDate(parseISO(warranty.start_date));
      setEndDate(parseISO(warranty.end_date));
      setDocumentUrl(warranty.document_url || "");
      setNotes(warranty.notes || "");
    } else {
      setWarrantyName("");
      setWarrantyType("extended");
      setStartDate(undefined);
      setEndDate(undefined);
      setDocumentUrl("");
      setNotes("");
    }
  }, [warranty, open]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${boatId}/warranty-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("vessel-documents")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("vessel-documents")
        .getPublicUrl(fileName);

      setDocumentUrl(urlData.publicUrl);
      toast({ title: "Document uploaded successfully" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!warrantyName || !startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        boat_id: boatId,
        boat_equipment_id: warranty?.boat_equipment_id || null,
        warranty_type: warrantyType,
        warranty_name: warrantyName,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        is_manual_override: true,
        document_url: documentUrl || null,
        notes: notes || null,
        warranty_default_id: warranty?.warranty_default_id || null,
      });
      toast({ title: isCreating ? "Warranty added" : "Warranty updated" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isCreating ? "Add Warranty" : "Edit Warranty"}</SheetTitle>
          <SheetDescription>
            {isCreating 
              ? "Add a new warranty, extended warranty, or insurance policy."
              : "Update warranty details or upload custom documents."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="warranty-name">Warranty Name *</Label>
            <Input
              id="warranty-name"
              value={warrantyName}
              onChange={(e) => setWarrantyName(e.target.value)}
              placeholder="e.g., Extended 5-Year Coverage"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={warrantyType} onValueChange={setWarrantyType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturer">Manufacturer Warranty</SelectItem>
                <SelectItem value="extended">Extended Warranty</SelectItem>
                <SelectItem value="insurance">Insurance Policy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Policy Document</Label>
            <div className="flex gap-2">
              <Input
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="Document URL or upload"
                className="flex-1"
              />
              <Button variant="outline" size="icon" asChild disabled={uploading}>
                <label className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isCreating ? "Add Warranty" : "Save Changes"}
            </Button>
            
            {!isCreating && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Warranty?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The warranty record will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
