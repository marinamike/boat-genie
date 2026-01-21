import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ruler,
  Droplets,
  Zap,
  Shield,
  FileText,
  ExternalLink,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useVesselSpecs, useBoatWarranties, useWarrantyDefaults, BoatWarranty } from "@/hooks/useVesselSpecs";
import { useBoatEquipment } from "@/hooks/useBoatEquipment";
import { WarrantyEditSheet } from "./WarrantyEditSheet";
import { format, isAfter, parseISO, addMonths } from "date-fns";

interface SpecsWarrantyTabProps {
  boatId: string | null;
  boatMake?: string | null;
  boatModel?: string | null;
  boatYear?: number | null;
}

export function SpecsWarrantyTab({ boatId, boatMake, boatModel, boatYear }: SpecsWarrantyTabProps) {
  const { specs, loading: specsLoading } = useVesselSpecs(boatMake, boatModel);
  const { warranties, loading: warrantiesLoading, createWarranty, updateWarranty, deleteWarranty, refetch } = useBoatWarranties(boatId);
  const { defaults, getWarrantyForBrand } = useWarrantyDefaults();
  const { equipment } = useBoatEquipment(boatId);
  
  const [editingWarranty, setEditingWarranty] = useState<BoatWarranty | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loading = specsLoading || warrantiesLoading;

  // Calculate purchase date from boat year (assume January 1st of that year)
  const purchaseDate = boatYear ? new Date(boatYear, 0, 1) : new Date();

  // Auto-generate warranties for equipment that doesn't have them
  const handleAutoGenerateWarranties = async () => {
    if (!boatId || !boatYear) return;

    // Get boat manufacturer warranty
    if (boatMake) {
      const boatWarranty = getWarrantyForBrand(boatMake, "boat");
      const hasBoatWarranty = warranties.some(w => w.warranty_type === "manufacturer" && !w.boat_equipment_id);
      
      if (boatWarranty && !hasBoatWarranty) {
        const startDate = new Date(boatYear, 0, 1);
        const endDate = addMonths(startDate, boatWarranty.warranty_months);
        
        await createWarranty({
          boat_id: boatId,
          boat_equipment_id: null,
          warranty_type: "manufacturer",
          warranty_name: `${boatMake} ${boatWarranty.warranty_name}`,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          is_manual_override: false,
          document_url: boatWarranty.warranty_pdf_url,
          notes: boatWarranty.warranty_description,
          warranty_default_id: boatWarranty.id,
        });
      }
    }

    // Get warranties for each equipment item
    for (const eq of equipment) {
      const existingWarranty = warranties.find(w => w.boat_equipment_id === eq.id);
      if (existingWarranty) continue;

      const productType = eq.equipment_type as "engine" | "generator" | "seakeeper";
      const warrantyDefault = getWarrantyForBrand(eq.brand, productType);
      
      if (warrantyDefault) {
        const startDate = new Date(boatYear, 0, 1);
        const endDate = addMonths(startDate, warrantyDefault.warranty_months);
        
        await createWarranty({
          boat_id: boatId,
          boat_equipment_id: eq.id,
          warranty_type: "manufacturer",
          warranty_name: `${eq.brand} ${warrantyDefault.warranty_name}`,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          is_manual_override: false,
          document_url: warrantyDefault.warranty_pdf_url,
          notes: `${eq.position_label || eq.equipment_type}: ${eq.brand} ${eq.model}`,
          warranty_default_id: warrantyDefault.id,
        });
      }
    }

    await refetch();
  };

  const getWarrantyStatus = (endDate: string): "active" | "expiring" | "expired" => {
    const end = parseISO(endDate);
    const now = new Date();
    const thirtyDaysFromNow = addMonths(now, 1);

    if (isAfter(now, end)) return "expired";
    if (isAfter(thirtyDaysFromNow, end)) return "expiring";
    return "active";
  };

  const handleEditWarranty = (warranty: BoatWarranty) => {
    setEditingWarranty(warranty);
    setIsCreating(false);
    setSheetOpen(true);
  };

  const handleAddWarranty = () => {
    setEditingWarranty(null);
    setIsCreating(true);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="specs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="specs">Vessel Specs</TabsTrigger>
          <TabsTrigger value="warranty">Warranty</TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="space-y-4 mt-4">
          {specs ? (
            <>
              {/* Dimensions Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-primary" />
                    Vessel Dimensions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Length</p>
                      <p className="font-medium">{specs.length_ft ? `${specs.length_ft} ft` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Beam</p>
                      <p className="font-medium">{specs.beam_ft ? `${specs.beam_ft} ft` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Draft</p>
                      <p className="font-medium">{specs.draft_ft ? `${specs.draft_ft} ft` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bridge Clearance</p>
                      <p className="font-medium">{specs.bridge_clearance_ft ? `${specs.bridge_clearance_ft} ft` : "—"}</p>
                    </div>
                    {specs.dry_weight_lbs && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Dry Weight</p>
                        <p className="font-medium">{specs.dry_weight_lbs.toLocaleString()} lbs</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Capacities Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" />
                    Tank Capacities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Fuel</p>
                      <p className="font-medium">{specs.fuel_capacity_gal ? `${specs.fuel_capacity_gal} gal` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Water</p>
                      <p className="font-medium">{specs.water_capacity_gal ? `${specs.water_capacity_gal} gal` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Holding</p>
                      <p className="font-medium">{specs.holding_capacity_gal ? `${specs.holding_capacity_gal} gal` : "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Electrical Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Electrical System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Battery Type</span>
                      <span className="font-medium">{specs.battery_type || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Battery Count</span>
                      <span className="font-medium">{specs.battery_count || "—"}</span>
                    </div>
                    {specs.battery_locations && (
                      <div>
                        <p className="text-muted-foreground mb-1">Locations</p>
                        <p className="font-medium text-xs">{specs.battery_locations}</p>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shore Power</span>
                      <span className="font-medium">{specs.shore_power || "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engine Options */}
              {specs.engine_options && specs.engine_options.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Available Engine Configurations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {specs.engine_options.map((option, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {option}
                        </Badge>
                      ))}
                    </div>
                    {specs.max_hp && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Max rated HP: {specs.max_hp}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Specs Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {boatMake && boatModel 
                    ? `We don't have specs for ${boatMake} ${boatModel} yet.`
                    : "Enter your boat's make and model to see specifications."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="warranty" className="space-y-4 mt-4">
          {/* Auto-generate button */}
          {warranties.length === 0 && equipment.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleAutoGenerateWarranties}
            >
              <Shield className="w-4 h-4 mr-2" />
              Auto-Generate Warranty Cards
            </Button>
          )}

          {/* Add warranty button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAddWarranty}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Warranty / Insurance
          </Button>

          {/* Warranty Cards */}
          {warranties.length > 0 ? (
            <div className="space-y-3">
              {warranties.map((warranty) => {
                const status = getWarrantyStatus(warranty.end_date);
                
                return (
                  <Card key={warranty.id} className="relative overflow-hidden">
                    {/* Status indicator bar */}
                    <div 
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        status === "active" ? "bg-green-500" :
                        status === "expiring" ? "bg-yellow-500" :
                        "bg-muted"
                      }`}
                    />
                    
                    <CardContent className="pl-5 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{warranty.warranty_name}</h4>
                            <Badge 
                              variant={status === "active" ? "default" : status === "expiring" ? "secondary" : "outline"}
                              className={`text-xs ${
                                status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                status === "expiring" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                "bg-muted text-muted-foreground"
                              }`}
                            >
                              {status === "active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {status === "expiring" && <AlertCircle className="w-3 h-3 mr-1" />}
                              {status === "active" ? "Active" : status === "expiring" ? "Expiring Soon" : "Expired"}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(warranty.start_date), "MMM d, yyyy")} – {format(parseISO(warranty.end_date), "MMM d, yyyy")}
                          </p>
                          
                          {warranty.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{warranty.notes}</p>
                          )}
                          
                          {warranty.is_manual_override && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              Custom Override
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {warranty.document_url && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => window.open(warranty.document_url!, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditWarranty(warranty)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Warranties Tracked</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your boat and equipment to automatically generate warranty cards.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Warranty Edit Sheet */}
      <WarrantyEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        warranty={editingWarranty}
        boatId={boatId!}
        isCreating={isCreating}
        onSave={async (data) => {
          if (isCreating) {
            await createWarranty(data);
          } else if (editingWarranty) {
            await updateWarranty(editingWarranty.id, data);
          }
          setSheetOpen(false);
        }}
        onDelete={async () => {
          if (editingWarranty) {
            await deleteWarranty(editingWarranty.id);
            setSheetOpen(false);
          }
        }}
      />
    </div>
  );
}
