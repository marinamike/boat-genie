import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Receipt,
  Plus,
  MoreHorizontal,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useRecurringBilling, RecurringInvoice } from "@/hooks/useRecurringBilling";
import { formatCurrency } from "@/lib/stayBilling";

interface LeaseWithDetails {
  id: string;
  yard_asset_id: string;
  boat_id: string;
  owner_id: string;
  monthly_rate: number;
  start_date: string;
  end_date: string | null;
  lease_status: string;
  boat?: {
    id: string;
    name: string;
    make?: string;
    model?: string;
  } | null;
  asset?: {
    id: string;
    asset_name: string;
    asset_type: string;
  } | null;
}

interface RecurringInvoiceManagerProps {
  lease: LeaseWithDetails;
  onClose?: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  draft: { label: "Draft", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
  pending: { label: "Pending", variant: "outline", icon: <Clock className="w-3 h-3" /> },
  sent: { label: "Sent", variant: "default", icon: <Send className="w-3 h-3" /> },
  paid: { label: "Paid", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  overdue: { label: "Overdue", variant: "destructive", icon: <AlertCircle className="w-3 h-3" /> },
  void: { label: "Void", variant: "secondary", icon: <AlertCircle className="w-3 h-3" /> },
};

export function RecurringInvoiceManager({ lease }: RecurringInvoiceManagerProps) {
  const {
    generateMonthlyInvoice,
    getLeaseInvoices,
    updateInvoiceStatus,
    loading,
  } = useRecurringBilling();

  const [invoices, setInvoices] = useState<RecurringInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [lease.id]);

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    const data = await getLeaseInvoices(lease.id);
    setInvoices(data);
    setLoadingInvoices(false);
  };

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    await generateMonthlyInvoice({
      leaseId: lease.id,
      yardAssetId: lease.yard_asset_id,
      boatId: lease.boat_id,
      ownerId: lease.owner_id,
      monthlyRate: lease.monthly_rate,
    });
    await loadInvoices();
    setGenerating(false);
  };

  const handleStatusChange = async (invoiceId: string, status: RecurringInvoice["status"]) => {
    await updateInvoiceStatus(invoiceId, status);
    await loadInvoices();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5" />
            Recurring Invoices
          </CardTitle>
          <Button
            size="sm"
            onClick={handleGenerateInvoice}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Generate Monthly Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lease Summary */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Vessel</p>
              <p className="font-medium">{lease.boat?.name}</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div>
              <p className="text-sm text-muted-foreground">Slip</p>
              <p className="font-medium">{lease.asset?.asset_name}</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div>
              <p className="text-sm text-muted-foreground">Monthly Rate</p>
              <p className="font-medium">{formatCurrency(lease.monthly_rate)}</p>
            </div>
          </div>

          {/* Invoices Table */}
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No invoices generated yet</p>
              <p className="text-sm">Click "Generate Monthly Invoice" to create the first one</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Base Rent</TableHead>
                    <TableHead>Utilities</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const status = statusConfig[invoice.status];
                    const utilitiesTotal = invoice.power_total + invoice.water_total;

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {format(new Date(invoice.billing_period_start), "MMM yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.base_rent)}</TableCell>
                        <TableCell>
                          {utilitiesTotal > 0 ? formatCurrency(utilitiesTotal) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.grand_total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.due_date
                            ? format(new Date(invoice.due_date), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {invoice.status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(invoice.id, "paid")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {invoice.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(invoice.id, "sent")}
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Mark as Sent
                                </DropdownMenuItem>
                              )}
                              {invoice.status !== "void" && invoice.status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(invoice.id, "void")}
                                  className="text-destructive"
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Void Invoice
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
