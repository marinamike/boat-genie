import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Anchor,
  Ship,
  Zap,
  Droplets,
  AlertTriangle,
  Trash2,
  ExternalLink,
  UserX,
  Search,
} from "lucide-react";
import { YardAsset, UtilityMeter, PowerAlert, LeaseAgreement } from "@/hooks/useYardAssets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SlipDetailSheetProps {
  asset: (YardAsset & {
    meters?: UtilityMeter[];
    lease?: LeaseAgreement | null;
    alerts?: PowerAlert[];
  }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<YardAsset>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignBoat: (assetId: string, boatId: string | null, reservationId?: string) => Promise<boolean>;
}

export function SlipDetailSheet({
  asset,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onAssignBoat,
}: SlipDetailSheetProps) {
  const [boatSearch, setBoatSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  if (!asset) return null;

  const handleSearchBoat = async () => {
    if (!boatSearch.trim()) return;
    setSearching(true);

    try {
      const { data, error } = await supabase
        .from("boats")
        .select("id, name, make, model, length_ft, owner_id")
        .or(`name.ilike.%${boatSearch}%,make.ilike.%${boatSearch}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAssignBoat = async (boatId: string) => {
    await onAssignBoat(asset.id, boatId);
    setBoatSearch("");
    setSearchResults([]);
  };

  const handleClearSlip = async () => {
    await onAssignBoat(asset.id, null);
  };

  const handleDelete = async () => {
    await onDelete(asset.id);
    onOpenChange(false);
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case "wet_slip":
        return "Wet Slip";
      case "dry_rack":
        return "Dry Rack";
      case "yard_block":
        return "Yard Block";
      case "mooring":
        return "Mooring";
      default:
        return type;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Anchor className="w-5 h-5" />
            {asset.asset_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status & Type */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={asset.is_available ? "default" : "secondary"}>
              {asset.is_available ? "Available" : "Unavailable"}
            </Badge>
            <Badge variant="outline">{getAssetTypeLabel(asset.asset_type)}</Badge>
            {asset.dock_section && (
              <Badge variant="outline">{asset.dock_section}</Badge>
            )}
          </div>

          {/* Alerts */}
          {asset.alerts && asset.alerts.length > 0 && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">Active Alerts</span>
                </div>
                {asset.alerts.map((alert) => (
                  <div key={alert.id} className="text-sm">
                    {alert.alert_message || alert.alert_type.replace("_", " ")}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Current Occupant */}
          <div>
            <h3 className="font-semibold mb-3">Current Occupant</h3>
            {asset.boat ? (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{asset.boat.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {asset.boat.make} {asset.boat.model}
                        {asset.boat.length_ft && ` • ${asset.boat.length_ft}ft`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/boat-log?boat=${asset.boat?.id}`, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearSlip}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-4">
                  <p className="text-muted-foreground text-sm mb-3">
                    No boat currently assigned
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by boat name..."
                      value={boatSearch}
                      onChange={(e) => setBoatSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchBoat()}
                    />
                    <Button onClick={handleSearchBoat} disabled={searching}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {searchResults.map((boat) => (
                        <button
                          key={boat.id}
                          onClick={() => handleAssignBoat(boat.id)}
                          className="w-full p-2 text-left rounded border hover:bg-accent transition-colors"
                        >
                          <div className="font-medium">{boat.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {boat.make} {boat.model}
                            {boat.length_ft && ` • ${boat.length_ft}ft`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Specifications */}
          <div>
            <h3 className="font-semibold mb-3">Specifications</h3>
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="py-3 text-center">
                  <div className="text-lg font-bold">
                    {asset.max_loa_ft || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Max LOA (ft)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-center">
                  <div className="text-lg font-bold">
                    {asset.max_beam_ft || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Max Beam (ft)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-center">
                  <div className="text-lg font-bold">
                    {asset.max_draft_ft || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Max Draft (ft)</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Rates */}
          {(asset.daily_rate_per_ft || asset.weekly_rate_per_ft || asset.monthly_rate_per_ft || asset.seasonal_rate_per_ft || asset.annual_rate_per_ft) && (
            <div>
              <h3 className="font-semibold mb-3">Rates (per foot)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {asset.daily_rate_per_ft && (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <div className="text-lg font-bold">
                        ${asset.daily_rate_per_ft}
                      </div>
                      <div className="text-xs text-muted-foreground">Daily</div>
                    </CardContent>
                  </Card>
                )}
                {asset.weekly_rate_per_ft && (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <div className="text-lg font-bold">
                        ${asset.weekly_rate_per_ft}
                      </div>
                      <div className="text-xs text-muted-foreground">Weekly</div>
                    </CardContent>
                  </Card>
                )}
                {asset.monthly_rate_per_ft && (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <div className="text-lg font-bold">
                        ${asset.monthly_rate_per_ft}
                      </div>
                      <div className="text-xs text-muted-foreground">Monthly</div>
                    </CardContent>
                  </Card>
                )}
                {asset.seasonal_rate_per_ft && (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <div className="text-lg font-bold">
                        ${asset.seasonal_rate_per_ft}
                      </div>
                      <div className="text-xs text-muted-foreground">Seasonal</div>
                    </CardContent>
                  </Card>
                )}
                {asset.annual_rate_per_ft && (
                  <Card>
                    <CardContent className="py-3 text-center">
                      <div className="text-lg font-bold">
                        ${asset.annual_rate_per_ft}
                      </div>
                      <div className="text-xs text-muted-foreground">Annual</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Meters */}
          {asset.meters && asset.meters.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Utility Meters</h3>
              <div className="space-y-2">
                {asset.meters.map((meter) => (
                  <Card key={meter.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {meter.meter_type === "power" ? (
                            <Zap className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <Droplets className="w-4 h-4 text-blue-600" />
                          )}
                          <span className="font-medium">{meter.meter_name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">
                            {meter.current_reading.toLocaleString()} {meter.meter_type === "power" ? "kWh" : "gal"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${meter.rate_per_unit}/{meter.meter_type === "power" ? "kWh" : "gal"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active Lease */}
          {asset.lease && (
            <div>
              <h3 className="font-semibold mb-3">Active Lease</h3>
              <Card>
                <CardContent className="py-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date</span>
                      <span>{new Date(asset.lease.start_date).toLocaleDateString()}</span>
                    </div>
                    {asset.lease.end_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date</span>
                        <span>{new Date(asset.lease.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Rate</span>
                      <span className="font-semibold">${asset.lease.monthly_rate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auto-Renew</span>
                      <Badge variant={asset.lease.auto_renew ? "default" : "outline"}>
                        {asset.lease.auto_renew ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notes */}
          {asset.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{asset.notes}</p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Slip
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {asset.asset_name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this slip/space and all associated data.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
