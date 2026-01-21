import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Book,
  ArrowLeft,
  Ship,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Loader2,
  Calendar,
  Download,
  AlertTriangle,
} from "lucide-react";
import { useBoatLog, WorkOrderWithDetails } from "@/hooks/useBoatLog";
import { WorkOrderDetailSheet } from "@/components/boatlog/WorkOrderDetailSheet";
import { formatPrice } from "@/lib/pricing";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

const BoatLog = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    boats,
    selectedBoatId,
    setSelectedBoatId,
    activeWorkOrders,
    completedWorkOrders,
    loading,
  } = useBoatLog();

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithDetails | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [generatingYearReport, setGeneratingYearReport] = useState(false);

  const handleViewDetails = (workOrder: WorkOrderWithDetails) => {
    setSelectedWorkOrder(workOrder);
    setDetailSheetOpen(true);
  };

  const handleDownloadYearReport = async () => {
    setGeneratingYearReport(true);
    
    const currentYear = new Date().getFullYear();
    const selectedBoat = boats.find(b => b.id === selectedBoatId);
    
    const reportContent = `
ANNUAL SERVICE REPORT - ${currentYear}
${"=".repeat(40)}

Boat: ${selectedBoat?.name || "Unknown"}

COMPLETED SERVICES (${completedWorkOrders.length})
${"-".repeat(40)}
${completedWorkOrders.length === 0 
  ? "No completed services this year.\n" 
  : completedWorkOrders.map(wo => `
${wo.title}
  Date: ${wo.completed_at ? format(new Date(wo.completed_at), "PPP") : "N/A"}
  Provider: ${wo.provider?.business_name || "N/A"}
  Amount: ${formatPrice(wo.retail_price || 0)}
  Status: ${wo.status.toUpperCase()}
`).join("\n")}

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
      pending: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Pending" },
      approved: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" />, label: "Approved" },
      in_progress: { variant: "default", icon: <Clock className="w-3 h-3" />, label: "In Progress" },
      qc_requested: { variant: "outline", icon: <Clock className="w-3 h-3" />, label: "QC Review" },
      completed: { variant: "default", icon: <CheckCircle2 className="w-3 h-3" />, label: "Completed" },
      cancelled: { variant: "destructive", icon: <AlertTriangle className="w-3 h-3" />, label: "Cancelled" },
    };
    
    const config = statusConfig[status] || { variant: "secondary" as const, icon: null, label: status };
    
    return (
      <Badge variant={config.variant} className={status === "completed" ? "bg-green-500" : ""}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  // Empty state - no boats
  if (boats.length === 0) {
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
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>

        <BottomNav />
      </div>
    );
  }

  // Empty state - no history
  const hasNoHistory = activeWorkOrders.length === 0 && completedWorkOrders.length === 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-10 z-40 bg-background border-b border-border">
        <div className="px-4 py-4 space-y-3">
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
            
            {completedWorkOrders.length > 0 && (
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

          {/* Boat Selector */}
          {boats.length > 1 && (
            <Select value={selectedBoatId || ""} onValueChange={setSelectedBoatId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a boat" />
              </SelectTrigger>
              <SelectContent>
                {boats.map((boat) => (
                  <SelectItem key={boat.id} value={boat.id}>
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4" />
                      {boat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      <main className="px-4 py-6">
        {hasNoHistory ? (
          /* Empty History State */
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">
                Your digital service history starts here
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Post a "Wish" to request your first service and begin building your boat's complete maintenance record.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                <Sparkles className="w-4 h-4 mr-2" />
                Make a Wish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Work Orders - "The Now" */}
            {activeWorkOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Active
                </h2>
                <div className="space-y-3">
                  {activeWorkOrders.map((wo) => (
                    <Card 
                      key={wo.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
                      onClick={() => handleViewDetails(wo)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{wo.title}</h3>
                              {wo.is_emergency && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Emergency
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {wo.provider?.business_name || "Awaiting provider"}
                            </p>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(wo.status)}
                              {wo.scheduled_date && (
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {format(new Date(wo.scheduled_date), "MMM d")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Completed Work Orders - "The Past" */}
            {completedWorkOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Service History
                </h2>
                <div className="space-y-3">
                  {completedWorkOrders.map((wo) => (
                    <Card 
                      key={wo.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewDetails(wo)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{wo.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {wo.provider?.business_name || "Unknown provider"}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {wo.completed_at 
                                  ? format(new Date(wo.completed_at), "MMM d, yyyy")
                                  : format(new Date(wo.created_at), "MMM d, yyyy")
                                }
                              </span>
                              {wo.retail_price && (
                                <span className="font-medium text-foreground">
                                  {formatPrice(wo.retail_price)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {wo.qc_verified_at && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                QC'd
                              </Badge>
                            )}
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Work Order Detail Sheet */}
      <WorkOrderDetailSheet
        workOrder={selectedWorkOrder}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />

      <BottomNav />
    </div>
  );
};

export default BoatLog;
