import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  Droplets, 
  Battery, 
  Ship,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ClipboardCheck
} from "lucide-react";
import type { LaunchCardData } from "@/hooks/useLaunchCard";

interface LaunchCardFormProps {
  boatName: string;
  operationType: "launch" | "haul_out";
  onSubmit: (data: LaunchCardData) => Promise<void>;
  loading?: boolean;
}

export function LaunchCardForm({ 
  boatName, 
  operationType, 
  onSubmit, 
  loading = false 
}: LaunchCardFormProps) {
  const [formData, setFormData] = useState<LaunchCardData>({
    visual_inspection_passed: false,
    engine_flush_confirmed: false,
    battery_off_confirmed: false,
    damage_notes: "",
    fuel_level: "",
    additional_notes: "",
  });

  const allChecksComplete = 
    formData.visual_inspection_passed && 
    formData.engine_flush_confirmed && 
    formData.battery_off_confirmed;

  const handleSubmit = async () => {
    if (!allChecksComplete) return;
    await onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Digital Launch Card</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              {operationType === "haul_out" ? "Haul-Out" : "Launch"} Inspection
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Boat Info */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Ship className="w-5 h-5 text-primary" />
          <span className="font-semibold">{boatName}</span>
        </div>

        {/* Required Toggles */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Required Checks
          </h4>

          {/* Visual Inspection */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
            formData.visual_inspection_passed ? "border-green-500 bg-green-50" : "border-border"
          }`}>
            <div className="flex items-center gap-3">
              <Eye className={`w-5 h-5 ${formData.visual_inspection_passed ? "text-green-600" : "text-muted-foreground"}`} />
              <div>
                <Label htmlFor="visual" className="font-semibold cursor-pointer">
                  Visual Inspection
                </Label>
                <p className="text-xs text-muted-foreground">
                  Checked hull, deck, and fittings
                </p>
              </div>
            </div>
            <Switch
              id="visual"
              checked={formData.visual_inspection_passed}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, visual_inspection_passed: checked })
              }
            />
          </div>

          {/* Engine Flush */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
            formData.engine_flush_confirmed ? "border-green-500 bg-green-50" : "border-border"
          }`}>
            <div className="flex items-center gap-3">
              <Droplets className={`w-5 h-5 ${formData.engine_flush_confirmed ? "text-green-600" : "text-muted-foreground"}`} />
              <div>
                <Label htmlFor="flush" className="font-semibold cursor-pointer">
                  Engine Flush Confirmed
                </Label>
                <p className="text-xs text-muted-foreground">
                  Engine flushed with fresh water
                </p>
              </div>
            </div>
            <Switch
              id="flush"
              checked={formData.engine_flush_confirmed}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, engine_flush_confirmed: checked })
              }
            />
          </div>

          {/* Battery Off */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
            formData.battery_off_confirmed ? "border-green-500 bg-green-50" : "border-border"
          }`}>
            <div className="flex items-center gap-3">
              <Battery className={`w-5 h-5 ${formData.battery_off_confirmed ? "text-green-600" : "text-muted-foreground"}`} />
              <div>
                <Label htmlFor="battery" className="font-semibold cursor-pointer">
                  Battery Off
                </Label>
                <p className="text-xs text-muted-foreground">
                  Battery switch in OFF position
                </p>
              </div>
            </div>
            <Switch
              id="battery"
              checked={formData.battery_off_confirmed}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, battery_off_confirmed: checked })
              }
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Additional Information
          </h4>

          {/* Fuel Level */}
          <div className="space-y-2">
            <Label>Fuel Level</Label>
            <Select 
              value={formData.fuel_level} 
              onValueChange={(value) => setFormData({ ...formData, fuel_level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fuel level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Empty</SelectItem>
                <SelectItem value="quarter">1/4 Tank</SelectItem>
                <SelectItem value="half">1/2 Tank</SelectItem>
                <SelectItem value="three_quarter">3/4 Tank</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Damage Notes */}
          <div className="space-y-2">
            <Label>Damage Notes (if any)</Label>
            <Textarea
              placeholder="Note any visible damage or issues..."
              value={formData.damage_notes}
              onChange={(e) => setFormData({ ...formData, damage_notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any other observations..."
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        {/* Warning if not all checks complete */}
        {!allChecksComplete && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">All required checks must be completed</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full touch-target"
          size="lg"
          onClick={handleSubmit}
          disabled={!allChecksComplete || loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Launch Card
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This record will be timestamped and linked to your staff profile
        </p>
      </CardContent>
    </Card>
  );
}

export default LaunchCardForm;
