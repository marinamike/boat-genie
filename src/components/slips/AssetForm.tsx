import { useState } from "react";
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
import { YardAsset } from "@/hooks/useYardAssets";
import { Database } from "@/integrations/supabase/types";

type YardAssetType = Database["public"]["Enums"]["yard_asset_type"];

interface AssetFormProps {
  asset?: Partial<YardAsset>;
  onSubmit: (data: Partial<YardAsset>) => Promise<void>;
  onCancel: () => void;
}

export function AssetForm({ asset, onSubmit, onCancel }: AssetFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset_name: asset?.asset_name || "",
    asset_type: (asset?.asset_type || "wet_slip") as YardAssetType,
    dock_section: asset?.dock_section || "",
    max_loa_ft: asset?.max_loa_ft?.toString() || "",
    max_beam_ft: asset?.max_beam_ft?.toString() || "",
    max_draft_ft: asset?.max_draft_ft?.toString() || "",
    daily_rate_per_ft: asset?.daily_rate_per_ft?.toString() || "",
    weekly_rate_per_ft: asset?.weekly_rate_per_ft?.toString() || "",
    monthly_rate_per_ft: asset?.monthly_rate_per_ft?.toString() || "",
    seasonal_rate_per_ft: asset?.seasonal_rate_per_ft?.toString() || "",
    annual_rate_per_ft: asset?.annual_rate_per_ft?.toString() || "",
    notes: asset?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        asset_name: formData.asset_name,
        asset_type: formData.asset_type,
        dock_section: formData.dock_section || null,
        max_loa_ft: formData.max_loa_ft ? parseFloat(formData.max_loa_ft) : null,
        max_beam_ft: formData.max_beam_ft ? parseFloat(formData.max_beam_ft) : null,
        max_draft_ft: formData.max_draft_ft ? parseFloat(formData.max_draft_ft) : null,
        daily_rate_per_ft: formData.daily_rate_per_ft ? parseFloat(formData.daily_rate_per_ft) : null,
        weekly_rate_per_ft: formData.weekly_rate_per_ft ? parseFloat(formData.weekly_rate_per_ft) : null,
        monthly_rate_per_ft: formData.monthly_rate_per_ft ? parseFloat(formData.monthly_rate_per_ft) : null,
        seasonal_rate_per_ft: formData.seasonal_rate_per_ft ? parseFloat(formData.seasonal_rate_per_ft) : null,
        annual_rate_per_ft: formData.annual_rate_per_ft ? parseFloat(formData.annual_rate_per_ft) : null,
        notes: formData.notes || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="space-y-2">
        <Label htmlFor="asset_name">Name *</Label>
        <Input
          id="asset_name"
          placeholder="e.g., Slip A-12"
          value={formData.asset_name}
          onChange={(e) =>
            setFormData({ ...formData, asset_name: e.target.value })
          }
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="asset_type">Type *</Label>
          <Select
            value={formData.asset_type}
            onValueChange={(value: YardAssetType) =>
              setFormData({ ...formData, asset_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wet_slip">Wet Slip</SelectItem>
              <SelectItem value="dry_rack">Dry Rack</SelectItem>
              <SelectItem value="yard_block">Yard Block</SelectItem>
              <SelectItem value="mooring">Mooring</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dock_section">Dock Section</Label>
          <Input
            id="dock_section"
            placeholder="e.g., Dock A"
            value={formData.dock_section}
            onChange={(e) =>
              setFormData({ ...formData, dock_section: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="max_loa_ft">Max LOA (ft)</Label>
          <Input
            id="max_loa_ft"
            type="number"
            step="0.1"
            placeholder="50"
            value={formData.max_loa_ft}
            onChange={(e) =>
              setFormData({ ...formData, max_loa_ft: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_beam_ft">Max Beam (ft)</Label>
          <Input
            id="max_beam_ft"
            type="number"
            step="0.1"
            placeholder="16"
            value={formData.max_beam_ft}
            onChange={(e) =>
              setFormData({ ...formData, max_beam_ft: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_draft_ft">Max Draft (ft)</Label>
          <Input
            id="max_draft_ft"
            type="number"
            step="0.1"
            placeholder="5"
            value={formData.max_draft_ft}
            onChange={(e) =>
              setFormData({ ...formData, max_draft_ft: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Rates ($ per foot)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="daily_rate_per_ft" className="text-xs text-muted-foreground">Daily</Label>
            <Input
              id="daily_rate_per_ft"
              type="number"
              step="0.01"
              placeholder="2.50"
              value={formData.daily_rate_per_ft}
              onChange={(e) =>
                setFormData({ ...formData, daily_rate_per_ft: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weekly_rate_per_ft" className="text-xs text-muted-foreground">Weekly</Label>
            <Input
              id="weekly_rate_per_ft"
              type="number"
              step="0.01"
              placeholder="15.00"
              value={formData.weekly_rate_per_ft}
              onChange={(e) =>
                setFormData({ ...formData, weekly_rate_per_ft: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="monthly_rate_per_ft" className="text-xs text-muted-foreground">Monthly</Label>
            <Input
              id="monthly_rate_per_ft"
              type="number"
              step="0.01"
              placeholder="45.00"
              value={formData.monthly_rate_per_ft}
              onChange={(e) =>
                setFormData({ ...formData, monthly_rate_per_ft: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="seasonal_rate_per_ft" className="text-xs text-muted-foreground">Seasonal</Label>
            <Input
              id="seasonal_rate_per_ft"
              type="number"
              step="0.01"
              placeholder="200.00"
              value={formData.seasonal_rate_per_ft}
              onChange={(e) =>
                setFormData({ ...formData, seasonal_rate_per_ft: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="annual_rate_per_ft" className="text-xs text-muted-foreground">Annual</Label>
            <Input
              id="annual_rate_per_ft"
              type="number"
              step="0.01"
              placeholder="350.00"
              value={formData.annual_rate_per_ft}
              onChange={(e) =>
                setFormData({ ...formData, annual_rate_per_ft: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional information about this slip..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !formData.asset_name} className="flex-1">
          {loading ? "Saving..." : asset ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
