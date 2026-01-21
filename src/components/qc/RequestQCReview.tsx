import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ClipboardCheck, Plus, X, Loader2, Send } from "lucide-react";
import { useQCFlow } from "@/hooks/useQCFlow";

interface RequestQCReviewProps {
  workOrderId: string;
  boatId: string;
  serviceDescription: string;
  onComplete?: () => void;
}

export function RequestQCReview({
  workOrderId,
  boatId,
  serviceDescription,
  onComplete,
}: RequestQCReviewProps) {
  const [open, setOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  
  const { loading, requestQCReview } = useQCFlow();

  // Pre-populate with service description items
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && checklistItems.length === 0) {
      // Parse service description into potential checklist items
      const defaultItems = parseServiceIntoChecklist(serviceDescription);
      setChecklistItems(defaultItems);
    }
    setOpen(isOpen);
  };

  const parseServiceIntoChecklist = (description: string): string[] => {
    // Try to split by common separators
    const lines = description
      .split(/[\n,;•\-]/)
      .map(line => line.trim())
      .filter(line => line.length > 3 && line.length < 200);
    
    if (lines.length === 0) {
      return [description.slice(0, 150)];
    }
    
    return lines.slice(0, 10); // Max 10 items
  };

  const addItem = () => {
    if (newItem.trim() && checklistItems.length < 15) {
      setChecklistItems([...checklistItems, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (checklistItems.length === 0) return;
    
    const success = await requestQCReview(workOrderId, boatId, checklistItems);
    if (success) {
      setOpen(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <ClipboardCheck className="w-4 h-4 mr-2" />
          Request QC Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Request QC Review
          </DialogTitle>
          <DialogDescription>
            Create a checklist of completed work items for the owner to verify.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Checklist Items */}
          <div className="space-y-2">
            <Label>Work Completed ({checklistItems.length} items)</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checklistItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded-md group"
                >
                  <span className="flex-1 text-sm truncate">{item}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-50 group-hover:opacity-100"
                    onClick={() => removeItem(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Item */}
          {checklistItems.length < 15 && (
            <div className="flex gap-2">
              <Input
                placeholder="Add another item..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <Button variant="outline" size="icon" onClick={addItem} disabled={!newItem.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            The owner will verify each item before releasing payment.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || checklistItems.length === 0}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit for Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
