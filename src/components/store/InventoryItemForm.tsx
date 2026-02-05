import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoreItem, StoreItemCategory } from "@/hooks/useStoreInventory";
import { Package, Wrench } from "lucide-react";

interface InventoryItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StoreItem | null;
  onSave: (data: Partial<StoreItem>) => Promise<void>;
}

export function InventoryItemForm({ open, onOpenChange, item, onSave }: InventoryItemFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "retail" as StoreItemCategory,
    description: "",
    current_quantity: 0,
    reorder_point: 5,
    unit_cost: 0,
    retail_price: 0,
    is_part: false,
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        sku: item.sku || "",
        barcode: item.barcode || "",
        category: item.category,
        description: item.description || "",
        current_quantity: item.current_quantity,
        reorder_point: item.reorder_point,
        unit_cost: item.unit_cost,
        retail_price: item.retail_price,
        is_part: item.is_part,
        is_active: item.is_active,
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        category: "retail",
        description: "",
        current_quantity: 0,
        reorder_point: 5,
        unit_cost: 0,
        retail_price: 0,
        is_part: false,
        is_active: true,
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    await onSave({
      name: formData.name.trim(),
      sku: formData.sku.trim() || null,
      barcode: formData.barcode.trim() || null,
      category: formData.category,
      description: formData.description.trim() || null,
      current_quantity: formData.current_quantity,
      reorder_point: formData.reorder_point,
      unit_cost: formData.unit_cost,
      retail_price: formData.retail_price,
      is_part: formData.is_part,
      is_active: formData.is_active,
    });
    setSaving(false);
  };

  // Calculate margin
  const margin = formData.retail_price > 0 
    ? ((formData.retail_price - formData.unit_cost) / formData.retail_price * 100).toFixed(1)
    : "0";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item ? "Edit Item" : "Add Item"}
          </SheetTitle>
          <SheetDescription>
            {item ? "Update inventory item details" : "Add a new item to your store inventory"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Marine Oil Filter"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g., MOF-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g., 123456789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(v) => setFormData({ ...formData, category: v as StoreItemCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parts">Parts</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="consumables">Consumables</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost ($)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retail_price">Retail Price ($)</Label>
              <Input
                id="retail_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.retail_price}
                onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Margin: {margin}%
          </p>

          {/* Stock Levels */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="current_quantity">Current Quantity</Label>
              <Input
                id="current_quantity"
                type="number"
                min="0"
                value={formData.current_quantity}
                onChange={(e) => setFormData({ ...formData, current_quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="is_part" className="cursor-pointer">
                  Service Part
                </Label>
              </div>
              <Switch
                id="is_part"
                checked={formData.is_part}
                onCheckedChange={(checked) => setFormData({ ...formData, is_part: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-2 ml-6">
              Allow this item to be pulled for work orders
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving || !formData.name.trim()}>
              {saving ? "Saving..." : item ? "Update" : "Add Item"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
