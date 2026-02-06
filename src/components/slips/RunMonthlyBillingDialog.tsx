import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays,
  Receipt,
  Loader2,
  CheckCircle2,
  FileText,
  DollarSign,
  Zap,
  Droplets,
} from "lucide-react";
import { formatCurrency } from "@/lib/stayBilling";
import { format } from "date-fns";

interface InvoiceSummary {
  leaseId: string;
  boatName: string;
  assetName: string;
  baseRent: number;
  powerTotal: number;
  waterTotal: number;
  grandTotal: number;
}

interface RunMonthlyBillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunBilling: () => Promise<InvoiceSummary[]>;
  activeLeaseCount: number;
}

export function RunMonthlyBillingDialog({
  open,
  onOpenChange,
  onRunBilling,
  activeLeaseCount,
}: RunMonthlyBillingDialogProps) {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<InvoiceSummary[]>([]);

  const handleRunBilling = async () => {
    setProcessing(true);
    try {
      const invoices = await onRunBilling();
      setResults(invoices);
      setCompleted(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCompleted(false);
    setResults([]);
    onOpenChange(false);
  };

  const totalGenerated = results.length;
  const grandTotalAmount = results.reduce((sum, r) => sum + r.grandTotal, 0);
  const totalRent = results.reduce((sum, r) => sum + r.baseRent, 0);
  const totalPower = results.reduce((sum, r) => sum + r.powerTotal, 0);
  const totalWater = results.reduce((sum, r) => sum + r.waterTotal, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {completed ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Billing Complete
              </>
            ) : (
              <>
                <CalendarDays className="w-5 h-5" />
                Generate Monthly Invoices
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {completed
              ? `Successfully generated ${totalGenerated} invoices for ${format(new Date(), "MMMM yyyy")}.`
              : `Generate invoices for all active long-term leases (Annual/Seasonal) for ${format(new Date(), "MMMM yyyy")}.`}
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <div className="text-3xl font-bold text-primary">{totalGenerated}</div>
                <div className="text-sm text-muted-foreground">Invoices Generated</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(grandTotalAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Total Billed</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="p-3 rounded-lg border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Base Rent
                </span>
                <span className="font-medium">{formatCurrency(totalRent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  Power Charges
                </span>
                <span className="font-medium">{formatCurrency(totalPower)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  Water Charges
                </span>
                <span className="font-medium">{formatCurrency(totalWater)}</span>
              </div>
            </div>

            <Separator />

            {/* Invoice List */}
            {results.length > 0 && (
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {results.map((invoice, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{invoice.boatName}</div>
                          <div className="text-xs text-muted-foreground">
                            {invoice.assetName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {formatCurrency(invoice.grandTotal)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Draft
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Leases</span>
                <Badge variant="secondary">{activeLeaseCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billing Period</span>
                <span className="font-medium">{format(new Date(), "MMMM yyyy")}</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Generate invoice for fixed monthly rent</li>
                <li>Include any unbilled meter readings from the past 30 days</li>
                <li>Create invoices with "Draft" status for review</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          {completed ? (
            <Button onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleRunBilling} disabled={processing || activeLeaseCount === 0}>
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" />
                    Generate {activeLeaseCount} Invoice{activeLeaseCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
