import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Anchor, 
  Ship, 
  Zap, 
  AlertTriangle, 
  Plus, 
  ExternalLink,
  Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { YardAsset, UtilityMeter, PowerAlert, LeaseAgreement } from "@/hooks/useYardAssets";
import { SlipDetailSheet } from "./SlipDetailSheet";
import { AssetForm } from "./AssetForm";

interface DockGridProps {
  assets: Array<YardAsset & {
    meters?: UtilityMeter[];
    lease?: LeaseAgreement | null;
    alerts?: PowerAlert[];
  }>;
  assetsBySection: Record<string, YardAsset[]>;
  alerts: PowerAlert[];
  loading: boolean;
  createAsset: (asset: Partial<YardAsset>) => Promise<YardAsset | null>;
  updateAsset: (id: string, updates: Partial<YardAsset>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
  assignBoatToSlip: (assetId: string, boatId: string | null, reservationId?: string) => Promise<boolean>;
}

type OccupancyStatus = "available" | "occupied" | "reserved" | "arriving";

function getOccupancyStatus(asset: YardAsset & { 
  reservation?: { status: string; requested_arrival: string } | null 
}): OccupancyStatus {
  if (asset.current_boat_id) return "occupied";
  
  if (asset.reservation) {
    const arrivalDate = new Date(asset.reservation.requested_arrival);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    arrivalDate.setHours(0, 0, 0, 0);
    
    if (arrivalDate.getTime() === today.getTime()) return "arriving";
    if (asset.reservation.status === "approved") return "reserved";
  }
  
  return "available";
}

function getStatusColor(status: OccupancyStatus): string {
  switch (status) {
    case "available":
      return "bg-green-500/20 border-green-500 text-green-700";
    case "occupied":
      return "bg-red-500/20 border-red-500 text-red-700";
    case "reserved":
      return "bg-yellow-500/20 border-yellow-500 text-yellow-700";
    case "arriving":
      return "bg-orange-500/20 border-orange-500 text-orange-700";
    default:
      return "bg-muted border-border";
  }
}

function getStatusLabel(status: OccupancyStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "occupied":
      return "Occupied";
    case "reserved":
      return "Reserved";
    case "arriving":
      return "Arriving Today";
    default:
      return "Unknown";
  }
}

function getAssetTypeIcon(type: string) {
  switch (type) {
    case "wet_slip":
      return <Anchor className="w-4 h-4" />;
    case "dry_rack":
      return <Ship className="w-4 h-4" />;
    case "mooring":
      return <Anchor className="w-4 h-4" />;
    default:
      return <Ship className="w-4 h-4" />;
  }
}

export function DockGrid({
  assets,
  assetsBySection,
  alerts,
  loading,
  createAsset,
  updateAsset,
  deleteAsset,
  assignBoatToSlip,
}: DockGridProps) {
  const [selectedAsset, setSelectedAsset] = useState<YardAsset | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Anchor className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  const sections = Object.keys(assetsBySection).sort();

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500" />
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500" />
                <span className="text-sm">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500" />
                <span className="text-sm">Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500" />
                <span className="text-sm">Arriving Today</span>
              </div>
            </div>
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Slip/Space
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-green-600">
              {assets.filter((a) => !a.current_boat_id && a.is_available).length}
            </div>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-red-600">
              {assets.filter((a) => a.current_boat_id).length}
            </div>
            <p className="text-sm text-muted-foreground">Occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-yellow-600">
              {assets.filter((a) => a.reservation && !a.current_boat_id).length}
            </div>
            <p className="text-sm text-muted-foreground">Reserved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-destructive">
              {alerts.filter((a) => !a.is_resolved).length}
            </div>
            <p className="text-sm text-muted-foreground">Active Alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Dock Sections */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Anchor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Slips Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first slip or storage space to get started.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Slip
            </Button>
          </CardContent>
        </Card>
      ) : (
        sections.map((section) => (
          <Card key={section}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Anchor className="w-5 h-5" />
                {section}
                <Badge variant="outline" className="ml-2">
                  {assetsBySection[section].length} spaces
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {assetsBySection[section].map((asset) => {
                  const enrichedAsset = assets.find((a) => a.id === asset.id);
                  const status = getOccupancyStatus(asset as any);
                  const hasAlerts = enrichedAsset?.alerts && enrichedAsset.alerts.length > 0;
                  const hasMeters = enrichedAsset?.meters && enrichedAsset.meters.length > 0;

                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(enrichedAsset || asset)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md text-left",
                        getStatusColor(status)
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {getAssetTypeIcon(asset.asset_type)}
                        <div className="flex gap-1">
                          {hasMeters && (
                            <Zap className="w-3 h-3 text-yellow-600" />
                          )}
                          {hasAlerts && (
                            <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="font-semibold text-sm truncate">
                        {asset.asset_name}
                      </div>
                      {asset.boat && (
                        <div className="text-xs mt-1 truncate opacity-80">
                          {asset.boat.name}
                        </div>
                      )}
                      {asset.max_loa_ft && (
                        <div className="text-xs mt-1 opacity-60">
                          Max: {asset.max_loa_ft}ft
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Slip Detail Sheet */}
      <SlipDetailSheet
        asset={selectedAsset}
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
        onUpdate={updateAsset}
        onDelete={deleteAsset}
        onAssignBoat={assignBoatToSlip}
      />

      {/* Add Asset Form */}
      <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Slip / Storage Space</SheetTitle>
          </SheetHeader>
          <AssetForm
            onSubmit={async (data) => {
              await createAsset(data);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
