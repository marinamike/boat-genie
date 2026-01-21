import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { Fuel, Gauge, Wrench, FileText, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ManualLogEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boatId: string | null;
  onSuccess: () => void;
}

const LOG_TYPES = [
  { value: "fuel", label: "Fuel", icon: Fuel, placeholder: "e.g., 100 gallons at Shell Marina" },
  { value: "engine_hours", label: "Engine Hours", icon: Gauge, placeholder: "e.g., 450 hours" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, placeholder: "e.g., Changed oil, replaced impeller" },
  { value: "note", label: "General Note", icon: FileText, placeholder: "e.g., Noticed small scratch on starboard side" },
];

export function ManualLogEntrySheet({
  open,
  onOpenChange,
  boatId,
  onSuccess,
}: ManualLogEntrySheetProps) {
  const [logType, setLogType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const selectedLogType = LOG_TYPES.find((t) => t.value === logType);

  const handleSubmit = async () => {
    if (!boatId || !logType || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a type and enter a title.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please log in to add entries.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("boat_logs").insert({
        boat_id: boatId,
        log_type: logType,
        title: title.trim(),
        description: description.trim() || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Entry added",
        description: "Your log entry has been recorded.",
      });

      // Reset form
      setLogType("");
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error adding log entry:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add entry.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setLogType("");
      setTitle("");
      setDescription("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Log Entry
          </SheetTitle>
          <SheetDescription>
            Record fuel, engine hours, maintenance, or notes
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Log Type Selection */}
          <div className="space-y-2">
            <Label>Entry Type</Label>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {LOG_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="entry-title">Title</Label>
            <Input
              id="entry-title"
              placeholder={selectedLogType?.placeholder || "Enter a title..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="entry-description">Notes (Optional)</Label>
            <Textarea
              id="entry-description"
              placeholder="Additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !logType || !title.trim()}
            className="w-full h-12"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
