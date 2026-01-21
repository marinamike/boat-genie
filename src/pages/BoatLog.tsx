import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Book,
  ArrowLeft,
  Ship,
  Sparkles,
  Loader2,
  Download,
  Plus,
} from "lucide-react";
import { useBoatLog, WorkOrderWithDetails } from "@/hooks/useBoatLog";
import { WorkOrderDetailSheet } from "@/components/boatlog/WorkOrderDetailSheet";
import { ManualLogEntrySheet } from "@/components/boatlog/ManualLogEntrySheet";
import { VesselSwitcher } from "@/components/boatlog/VesselSwitcher";
import { VesselEmptyState } from "@/components/boatlog/VesselEmptyState";
import { DigitalVault } from "@/components/boatlog/DigitalVault";
import { ServiceTimeline } from "@/components/boatlog/ServiceTimeline";
import { ManufacturerRecommendations } from "@/components/boatlog/ManufacturerRecommendations";
import { EquipmentInventory } from "@/components/boatlog/EquipmentInventory";
import { SpecsWarrantyTab } from "@/components/boatlog/SpecsWarrantyTab";
import { BoatLogTabs } from "@/components/boatlog/BoatLogTabs";
import { MaintenanceRecommendation } from "@/hooks/useEquipmentSpecs";
import { WishFormSheet } from "@/components/wish/WishFormSheet";
import { formatPrice } from "@/lib/pricing";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useVessel } from "@/contexts/VesselContext";

const BoatLog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    vessels,
    activeVessel,
    activeVesselId,
    setActiveVesselId,
    loading: vesselsLoading,
  } = useVessel();

  const {
    boats,
    selectedBoat,
    selectedBoatId,
    setSelectedBoatId,
    scheduledWorkOrders,
    activeWorkOrders,
    completedWorkOrders,
    manualEntries,
    loading,
    refetch,
  } = useBoatLog();

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithDetails | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [manualEntrySheetOpen, setManualEntrySheetOpen] = useState(false);
  const [generatingYearReport, setGeneratingYearReport] = useState(false);
  const [wishSheetOpen, setWishSheetOpen] = useState(false);
  const [prefilledWishData, setPrefilledWishData] = useState<{
    serviceType: string;
    description: string;
  } | null>(null);

  // Sync vessel context with useBoatLog
  useEffect(() => {
    if (activeVesselId && activeVesselId !== selectedBoatId) {
      setSelectedBoatId(activeVesselId);
    }
  }, [activeVesselId, selectedBoatId, setSelectedBoatId]);

  // Sync URL param with context on initial load
  useEffect(() => {
    const boatParam = searchParams.get("boat");
    if (boatParam && boatParam !== activeVesselId) {
      setActiveVesselId(boatParam);
    }
  }, [searchParams, activeVesselId, setActiveVesselId]);

  const handleVesselSelect = (vesselId: string) => {
    setActiveVesselId(vesselId);
    setSelectedBoatId(vesselId);
  };

  const handleViewDetails = (workOrder: WorkOrderWithDetails) => {
    setSelectedWorkOrder(workOrder);
    setDetailSheetOpen(true);
  };

  const handleTurnIntoWish = (recommendation: MaintenanceRecommendation) => {
    setPrefilledWishData({
      serviceType: recommendation.equipment_type === "engine" ? "Engine Service" : 
                   recommendation.equipment_type === "generator" ? "Generator Service" : 
                   "General Maintenance",
      description: `${recommendation.title}\n\n${recommendation.description || ""}`,
    });
    setWishSheetOpen(true);
  };

  const handleEquipmentWish = (description: string) => {
    setPrefilledWishData({
      serviceType: "General Maintenance",
      description,
    });
    setWishSheetOpen(true);
  };

  const handleDownloadYearReport = async () => {
    setGeneratingYearReport(true);

    const currentYear = new Date().getFullYear();

    const reportContent = `
ANNUAL SERVICE REPORT - ${currentYear}
${"=".repeat(40)}

Boat: ${selectedBoat?.name || "Unknown"}

COMPLETED SERVICES (${completedWorkOrders.length})
${"-".repeat(40)}
${
  completedWorkOrders.length === 0
    ? "No completed services this year.\n"
    : completedWorkOrders
        .map(
          (wo) => `
${wo.title}
  Date: ${wo.completed_at ? format(new Date(wo.completed_at), "PPP") : "N/A"}
  Provider: ${wo.provider?.business_name || "N/A"}
  Amount: ${formatPrice(wo.retail_price || 0)}
  Status: ${wo.status.toUpperCase()}
`
        )
        .join("\n")
}

SUMMARY
${"-".repeat(40)}
Total Services: ${completedWorkOrders.length}
Total Spent: ${formatPrice(completedWorkOrders.reduce((sum, wo) => sum + (wo.retail_price || 0), 0))}

Generated on ${format(new Date(), "PPP 'at' p")}
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annual-service-report-${selectedBoat?.name?.replace(/\s+/g, "-") || "boat"}-${currentYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setGeneratingYearReport(false);
  };

  if (loading || vesselsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  // Empty state - no boats at all
  if (vessels.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-10 z-40 bg-background border-b border-border">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-lg">Boat Log</h1>
            </div>
          </div>
        </header>

        <main className="px-4 py-12">
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Ship className="w-16 h-16 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="font-semibold text-xl mb-2">No boats yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first vessel to start tracking your service history.
              </p>
              <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>
    );
  }

  // Empty state - no vessel selected (but has vessels)
  if (!activeVesselId) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-10 z-40 bg-background border-b border-border">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-lg">Boat Log</h1>
            </div>
          </div>
        </header>

        <VesselEmptyState vessels={vessels} onSelectVessel={handleVesselSelect} />

        <BottomNav />
      </div>
    );
  }

  const hasNoHistory =
    scheduledWorkOrders.length === 0 &&
    activeWorkOrders.length === 0 &&
    completedWorkOrders.length === 0 &&
    manualEntries.length === 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-10 z-40 bg-background border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                <h1 className="font-bold text-lg">Boat Log</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setManualEntrySheetOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>

              {(completedWorkOrders.length > 0 || manualEntries.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadYearReport}
                  disabled={generatingYearReport}
                >
                  {generatingYearReport ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Vessel Switcher */}
      <VesselSwitcher
        vessels={vessels}
        activeVessel={activeVessel}
        onSelect={handleVesselSelect}
      />

      <main className="px-4 py-6">
        <BoatLogTabs
          serviceContent={
            <div className="space-y-6">
              {/* Equipment Inventory */}
              <Card>
                <CardContent className="pt-6">
                  <EquipmentInventory 
                    boatId={selectedBoatId!} 
                    onOpenWish={handleEquipmentWish}
                  />
                </CardContent>
              </Card>

              {/* Manufacturer Recommendations */}
              <ManufacturerRecommendations
                boatId={selectedBoatId}
                onTurnIntoWish={handleTurnIntoWish}
              />

              {/* Service Timeline */}
              {hasNoHistory ? (
                <Card className="border-dashed border-2">
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">
                      Your digital service history starts here
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Post a "Wish" to request your first service and begin building your boat's
                      complete maintenance record.
                    </p>
                    <Button onClick={() => navigate("/dashboard")}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Make a Wish
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ServiceTimeline
                  scheduledWorkOrders={scheduledWorkOrders}
                  activeWorkOrders={activeWorkOrders}
                  completedWorkOrders={completedWorkOrders}
                  manualEntries={manualEntries}
                  onViewWorkOrder={handleViewDetails}
                />
              )}
            </div>
          }
          vaultContent={
            <DigitalVault boatId={selectedBoatId} boatName={selectedBoat?.name} />
          }
          specsWarrantyContent={
            <SpecsWarrantyTab
              boatId={selectedBoatId}
              boatMake={selectedBoat?.make}
              boatModel={selectedBoat?.model}
              boatYear={selectedBoat?.year}
            />
          }
        />
      </main>

      {/* Work Order Detail Sheet */}
      <WorkOrderDetailSheet
        workOrder={selectedWorkOrder}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />

      {/* Manual Log Entry Sheet */}
      <ManualLogEntrySheet
        open={manualEntrySheetOpen}
        onOpenChange={setManualEntrySheetOpen}
        boatId={selectedBoatId}
        onSuccess={refetch}
      />

      {/* Wish Form Sheet for recommendations */}
      <WishFormSheet
        open={wishSheetOpen}
        onOpenChange={(open) => {
          setWishSheetOpen(open);
          if (!open) setPrefilledWishData(null);
        }}
        preselectedBoatId={selectedBoatId || undefined}
        prefilledDescription={prefilledWishData?.description}
      />

      <BottomNav />
    </div>
  );
};

export default BoatLog;
