import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ruler,
  Fuel,
  Droplets,
  Gauge,
  Zap,
  Anchor,
  Share2,
  Edit2,
  Sparkles,
  Loader2,
  Weight,
  Waves,
} from "lucide-react";
import { useBoatSpecs, BoatSpecData } from "@/hooks/useBoatSpecs";
import { SpecEditSheet } from "./SpecEditSheet";
import { SpecShareSheet } from "./SpecShareSheet";
import { toast } from "sonner";

interface VesselSpecSheetProps {
  boatId: string | null;
  boatName?: string | null;
  boatMake?: string | null;
  boatModel?: string | null;
  boatYear?: number | null;
}

// Utility to format feet with inches
function formatFeet(ft: number | null): string {
  if (ft === null || ft === undefined) return "—";
  const feet = Math.floor(ft);
  const inches = Math.round((ft - feet) * 12);
  if (inches === 0) return `${feet}'`;
  return `${feet}' ${inches}"`;
}

function formatNumber(val: number | null, unit: string): string {
  if (val === null || val === undefined) return "—";
  return `${val.toLocaleString()} ${unit}`;
}

interface SpecRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

function SpecRow({ icon, label, value, subValue }: SpecRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-semibold text-foreground">{value}</p>
          {subValue && <p className="text-sm text-muted-foreground">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

interface SpecCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SpecCard({ title, icon, children }: SpecCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        </div>
      </div>
      <CardContent className="p-4 pt-1">
        {children}
      </CardContent>
    </Card>
  );
}

export function VesselSpecSheet({ boatId, boatName, boatMake, boatModel, boatYear }: VesselSpecSheetProps) {
  const {
    mergedSpecs,
    loading,
    saving,
    hasCustomSpecs,
    hasMasterSpecs,
    autoPopulateFromMaster,
    saveSpecs,
  } = useBoatSpecs(boatId, boatMake, boatModel);

  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleAutoPopulate = async () => {
    const success = await autoPopulateFromMaster();
    if (success) {
      toast.success("Specs auto-populated from database");
    } else {
      toast.error("Failed to auto-populate specs");
    }
  };

  const handleSaveSpecs = async (specs: Partial<BoatSpecData>) => {
    const success = await saveSpecs(specs);
    if (success) {
      toast.success("Specs saved successfully");
      setEditOpen(false);
    } else {
      toast.error("Failed to save specs");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasAnySpecs = Object.values(mergedSpecs).some(v => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true));

  return (
    <div className="space-y-4">
      {/* Header with vessel name */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {boatName || `${boatYear || ""} ${boatMake || ""} ${boatModel || ""}`.trim() || "Vessel Specs"}
          </h2>
          {(boatMake || boatModel) && boatName && (
            <p className="text-sm text-muted-foreground">
              {boatYear} {boatMake} {boatModel}
            </p>
          )}
          {hasCustomSpecs && (
            <Badge variant="outline" className="mt-1.5 text-xs bg-accent/10 text-accent-foreground border-accent/30">
              Custom Specs
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {hasMasterSpecs && !hasCustomSpecs && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAutoPopulate}
              disabled={saving}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto-Fill
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="default" size="sm" onClick={() => setShareOpen(true)} className="gap-1.5">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {!hasAnySpecs ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Anchor className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No Specs Available</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {hasMasterSpecs 
                ? "We have specs for your vessel. Click Auto-Fill to populate them, or add custom specs."
                : "Add your vessel's specifications to create a professional spec sheet you can share."}
            </p>
            <div className="flex gap-3 justify-center">
              {hasMasterSpecs && (
                <Button onClick={handleAutoPopulate} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Auto-Fill from Database
                </Button>
              )}
              <Button variant={hasMasterSpecs ? "outline" : "default"} onClick={() => setEditOpen(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Enter Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Physical Dimensions */}
          <SpecCard title="Dimensions" icon={<Ruler className="w-4 h-4" />}>
            <SpecRow 
              icon={<Ruler className="w-4 h-4 text-primary" />}
              label="Length Overall (LOA)"
              value={formatFeet(mergedSpecs.loa_ft)}
            />
            <SpecRow 
              icon={<Ruler className="w-4 h-4 text-primary rotate-90" />}
              label="Beam"
              value={formatFeet(mergedSpecs.beam_ft)}
            />
            <SpecRow 
              icon={<Waves className="w-4 h-4 text-primary" />}
              label="Draft"
              value={mergedSpecs.draft_engines_up_ft ? formatFeet(mergedSpecs.draft_engines_up_ft) + " (up)" : "—"}
              subValue={mergedSpecs.draft_engines_down_ft ? formatFeet(mergedSpecs.draft_engines_down_ft) + " (down)" : undefined}
            />
            <SpecRow 
              icon={<Anchor className="w-4 h-4 text-primary" />}
              label="Bridge Clearance"
              value={formatFeet(mergedSpecs.bridge_clearance_ft)}
            />
            <SpecRow 
              icon={<Weight className="w-4 h-4 text-primary" />}
              label="Dry Weight"
              value={formatNumber(mergedSpecs.dry_weight_lbs, "lbs")}
            />
          </SpecCard>

          {/* Capacities */}
          <SpecCard title="Capacities" icon={<Fuel className="w-4 h-4" />}>
            <SpecRow 
              icon={<Fuel className="w-4 h-4 text-primary" />}
              label="Fuel Capacity"
              value={formatNumber(mergedSpecs.fuel_capacity_gal, "gal")}
            />
            <SpecRow 
              icon={<Droplets className="w-4 h-4 text-primary" />}
              label="Fresh Water"
              value={formatNumber(mergedSpecs.water_capacity_gal, "gal")}
            />
            <SpecRow 
              icon={<Droplets className="w-4 h-4 text-muted-foreground" />}
              label="Holding Tank"
              value={formatNumber(mergedSpecs.holding_capacity_gal, "gal")}
            />
            {mergedSpecs.livewell_capacity_gal && (
              <SpecRow 
                icon={<Waves className="w-4 h-4 text-primary" />}
                label="Livewell"
                value={formatNumber(mergedSpecs.livewell_capacity_gal, "gal")}
              />
            )}
          </SpecCard>

          {/* Performance */}
          <SpecCard title="Performance" icon={<Gauge className="w-4 h-4" />}>
            <SpecRow 
              icon={<Gauge className="w-4 h-4 text-primary" />}
              label="Cruise Speed"
              value={mergedSpecs.cruise_speed_knots ? `${mergedSpecs.cruise_speed_knots} kts` : "—"}
            />
            <SpecRow 
              icon={<Gauge className="w-4 h-4 text-accent" />}
              label="Max Speed"
              value={mergedSpecs.max_speed_knots ? `${mergedSpecs.max_speed_knots} kts` : "—"}
            />
            <SpecRow 
              icon={<Anchor className="w-4 h-4 text-primary" />}
              label="Hull Type"
              value={mergedSpecs.hull_type || "—"}
            />
            {mergedSpecs.max_hp && (
              <SpecRow 
                icon={<Zap className="w-4 h-4 text-primary" />}
                label="Max HP Rating"
                value={formatNumber(mergedSpecs.max_hp, "HP")}
              />
            )}
          </SpecCard>

          {/* Electrical */}
          <SpecCard title="Electrical" icon={<Zap className="w-4 h-4" />}>
            <SpecRow 
              icon={<Zap className="w-4 h-4 text-primary" />}
              label="Battery Type"
              value={mergedSpecs.battery_type || "—"}
            />
            <SpecRow 
              icon={<Zap className="w-4 h-4 text-primary" />}
              label="Battery Count"
              value={mergedSpecs.battery_count ? `${mergedSpecs.battery_count}` : "—"}
            />
            {mergedSpecs.battery_locations && (
              <SpecRow 
                icon={<Anchor className="w-4 h-4 text-muted-foreground" />}
                label="Locations"
                value={mergedSpecs.battery_locations}
              />
            )}
            <SpecRow 
              icon={<Zap className="w-4 h-4 text-accent" />}
              label="Shore Power"
              value={mergedSpecs.shore_power || "—"}
            />
          </SpecCard>
        </div>
      )}

      {/* Engine Options if present */}
      {mergedSpecs.engine_options && mergedSpecs.engine_options.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Engine Configurations</h4>
            <div className="flex flex-wrap gap-2">
              {mergedSpecs.engine_options.map((option, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm font-medium">
                  {option}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Sheet */}
      <SpecEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        specs={mergedSpecs}
        onSave={handleSaveSpecs}
        saving={saving}
      />

      {/* Share Sheet */}
      <SpecShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        specs={mergedSpecs}
        boatName={boatName}
        boatMake={boatMake}
        boatModel={boatModel}
        boatYear={boatYear}
      />
    </div>
  );
}
