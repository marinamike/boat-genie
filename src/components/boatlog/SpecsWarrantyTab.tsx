import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  ExternalLink,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useBoatWarranties, useWarrantyDefaults, BoatWarranty } from "@/hooks/useVesselSpecs";
import { useBoatEquipment } from "@/hooks/useBoatEquipment";
import { WarrantyEditSheet } from "./WarrantyEditSheet";
import { VesselSpecSheet } from "./VesselSpecSheet";
import { format, isAfter, parseISO, addMonths } from "date-fns";

interface SpecsWarrantyTabProps {
  boatId: string | null;
  boatName?: string | null;
  boatMake?: string | null;
  boatModel?: string | null;
  boatYear?: number | null;
}

export function SpecsWarrantyTab({ boatId, boatName, boatMake, boatModel, boatYear }: SpecsWarrantyTabProps) {
  const { warranties, loading: warrantiesLoading, createWarranty, updateWarranty, deleteWarranty, refetch } = useBoatWarranties(boatId);
  const { getWarrantyForBrand } = useWarrantyDefaults();
  const { equipment } = useBoatEquipment(boatId);
  
  const [editingWarranty, setEditingWarranty] = useState<BoatWarranty | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  if (warrantiesLoading) {
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
          <TabsTrigger value="specs">Spec Sheet</TabsTrigger>
          <TabsTrigger value="warranty">Warranty</TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="mt-4">
          <VesselSpecSheet
            boatId={boatId}
            boatName={boatName}
            boatMake={boatMake}
            boatModel={boatModel}
            boatYear={boatYear}
          />
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
