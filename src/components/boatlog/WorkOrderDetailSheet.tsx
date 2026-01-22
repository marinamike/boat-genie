import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Camera,
  DollarSign,
  ClipboardCheck,
  Download,
  Loader2,
  Calendar,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { WorkOrderWithDetails, QCChecklistItem, useBoatLog } from "@/hooks/useBoatLog";
import { formatPrice } from "@/lib/pricing";

interface WorkOrderDetailSheetProps {
  workOrder: WorkOrderWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkOrderDetailSheet({
  workOrder,
  open,
  onOpenChange,
}: WorkOrderDetailSheetProps) {
  const { fetchQCChecklist, fetchWorkOrderPhotos } = useBoatLog();
  const [qcItems, setQcItems] = useState<QCChecklistItem[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (open && workOrder) {
      setLoading(true);
      Promise.allSettled([
        fetchQCChecklist(workOrder.id),
        fetchWorkOrderPhotos(workOrder.id),
      ]).then((results) => {
        const qc = results[0].status === "fulfilled" ? results[0].value : [];
        const ph = results[1].status === "fulfilled" ? results[1].value : [];
        setQcItems(qc);
        setPhotos(ph);
        setLoading(false);
      });
    }
  }, [open, workOrder, fetchQCChecklist, fetchWorkOrderPhotos]);

  if (!workOrder) return null;

  const totalPaid = (workOrder.retail_price || 0) + (workOrder.materials_deposit || 0);
  const isCompleted = workOrder.status === "completed";

  const handleDownloadReport = async () => {
    setGeneratingPdf(true);
    
    // Create a simple text-based report (in production, use a PDF library)
    const reportContent = `
SERVICE REPORT
==============

Boat: ${workOrder.boat.name}
${workOrder.boat.make ? `Make: ${workOrder.boat.make}` : ""}
${workOrder.boat.model ? `Model: ${workOrder.boat.model}` : ""}
${workOrder.boat.length_ft ? `Length: ${workOrder.boat.length_ft}ft` : ""}

Service: ${workOrder.title}
Description: ${workOrder.description || "N/A"}
Date: ${workOrder.completed_at ? format(new Date(workOrder.completed_at), "PPP") : format(new Date(workOrder.created_at), "PPP")}
Status: ${workOrder.status.toUpperCase()}
${workOrder.provider?.business_name ? `Provider: ${workOrder.provider.business_name}` : ""}

FINANCIAL SUMMARY
-----------------
Base Price: ${formatPrice(workOrder.wholesale_price || 0)}
Service Fee: ${formatPrice(workOrder.service_fee || 0)}
${workOrder.materials_deposit ? `Materials Deposit: ${formatPrice(workOrder.materials_deposit)}` : ""}
Total Paid: ${formatPrice(totalPaid)}

QC CHECKLIST
------------
${qcItems.length > 0 
  ? qcItems.map(item => `[${item.is_verified ? "✓" : " "}] ${item.description}${item.verifier_name ? ` - Verified by ${item.verifier_name}` : ""}`).join("\n")
  : "No checklist items recorded"}

${workOrder.qc_verified_at ? `
QC Sign-off: ${format(new Date(workOrder.qc_verified_at), "PPP 'at' p")}
Verified by: ${workOrder.qc_verifier_name || "Unknown"} (${workOrder.qc_verifier_role || "Unknown role"})
` : ""}

Generated on ${format(new Date(), "PPP 'at' p")}
    `.trim();

    // Create and download file
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service-report-${workOrder.boat.name.replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setGeneratingPdf(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {workOrder.title}
            {workOrder.is_emergency && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Emergency
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {workOrder.boat.name} • {format(new Date(workOrder.created_at), "PPP")}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-150px)] pr-4">
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={isCompleted ? "default" : "secondary"}
                  className={isCompleted ? "bg-green-500" : ""}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  {workOrder.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
                {workOrder.scheduled_date && (
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(workOrder.scheduled_date), "MMM d, yyyy")}
                  </Badge>
                )}
              </div>

              {/* Provider */}
              {workOrder.provider?.business_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium">{workOrder.provider.business_name}</span>
                </div>
              )}

              {/* Description */}
              {workOrder.description && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-sm">{workOrder.description}</p>
                </div>
              )}

              <Separator />

              {/* QC Checklist */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  QC Checklist
                </h4>
                
                {qcItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No checklist items recorded
                  </p>
                ) : (
                  <div className="space-y-2">
                    {qcItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2 p-2 rounded-lg ${
                          item.is_verified ? "bg-green-500/10" : "bg-muted/50"
                        }`}
                      >
                        {item.is_verified ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{item.description}</p>
                          {item.verifier_name && item.verified_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Verified by {item.verifier_name} on{" "}
                              {format(new Date(item.verified_at), "MMM d, p")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* QC Sign-off */}
                {workOrder.qc_verified_at && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">QC Verified</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Signed off by {workOrder.qc_verifier_name || "Unknown"}{" "}
                      ({workOrder.qc_verifier_role || "Unknown"}) on{" "}
                      {format(new Date(workOrder.qc_verified_at), "PPP 'at' p")}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Photos */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  Photos ({photos.length})
                </h4>
                
                {photos.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No photos uploaded
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`Service photo ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Financial Summary */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Financial Summary
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span>{formatPrice(workOrder.wholesale_price || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span>{formatPrice(workOrder.service_fee || 0)}</span>
                  </div>
                  {workOrder.materials_deposit && workOrder.materials_deposit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials Deposit</span>
                      <span>{formatPrice(workOrder.materials_deposit)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Paid</span>
                    <span className="text-primary">{formatPrice(totalPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Download Report Button */}
              {isCompleted && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadReport}
                  disabled={generatingPdf}
                >
                  {generatingPdf ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download Service Report
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
