import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Receipt, 
  Wrench, 
  Ship, 
  Fuel, 
  ShoppingBag, 
  Calendar,
  DollarSign,
  ChevronRight,
  FileText
} from "lucide-react";
import { useCustomerInvoices, CustomerInvoice, PaymentResult } from "@/hooks/useCustomerInvoices";
import { InvoiceDetailSheet } from "./InvoiceDetailSheet";
import { PaymentModal, CardDetails } from "./PaymentModal";
import { PaymentSuccessDialog } from "./PaymentSuccessDialog";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const getSourceIcon = (sourceType: string) => {
  switch (sourceType) {
    case "service":
      return <Wrench className="w-4 h-4" />;
    case "slip_transient":
    case "slip_lease":
      return <Ship className="w-4 h-4" />;
    case "fuel":
      return <Fuel className="w-4 h-4" />;
    case "store":
      return <ShoppingBag className="w-4 h-4" />;
    default:
      return <Receipt className="w-4 h-4" />;
  }
};

const getSourceLabel = (sourceType: string) => {
  switch (sourceType) {
    case "service":
      return "Service";
    case "slip_transient":
      return "Slip Stay";
    case "slip_lease":
      return "Monthly Rent";
    case "fuel":
      return "Fuel";
    case "store":
      return "Ship Store";
    default:
      return "Invoice";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-success/10 text-success border-success/20">Paid</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function CustomerBillingTab() {
  const { invoices, loading, processPayment } = useCustomerInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceToPayFrom, setInvoiceToPayFrom] = useState<CustomerInvoice | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState<PaymentResult | null>(null);
  const [lastPaidAmount, setLastPaidAmount] = useState(0);

  const pendingInvoices = invoices.filter((i) => i.status === "pending");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const totalPending = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

  const handleViewInvoice = (invoice: CustomerInvoice) => {
    setSelectedInvoice(invoice);
    setDetailSheetOpen(true);
  };

  const handleOpenPaymentModal = (invoice: CustomerInvoice) => {
    setInvoiceToPayFrom(invoice);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (
    invoiceId: string,
    amount: number,
    cardDetails: CardDetails
  ): Promise<boolean> => {
    const result = await processPayment(invoiceId, amount, cardDetails);
    if (result.success) {
      setLastPaymentResult(result);
      setLastPaidAmount(amount);
      setPaymentModalOpen(false);
      setDetailSheetOpen(false);
      setSuccessDialogOpen(true);
    }
    return result.success;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {pendingInvoices.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{pendingInvoices.length} pending invoice{pendingInvoices.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pending Invoices
          </h3>
          {pendingInvoices.map((invoice) => (
            <InvoiceCard 
              key={invoice.id} 
              invoice={invoice} 
              onView={() => handleViewInvoice(invoice)}
              onPayNow={() => handleOpenPaymentModal(invoice)}
            />
          ))}
        </div>
      )}

      {/* Paid Invoices */}
      {paidInvoices.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-muted-foreground">
            <Receipt className="w-5 h-5" />
            Payment History
          </h3>
          {paidInvoices.map((invoice) => (
            <InvoiceCard 
              key={invoice.id} 
              invoice={invoice} 
              onView={() => handleViewInvoice(invoice)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {invoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Invoices Yet</h3>
            <p className="text-muted-foreground">
              Your billing history will appear here once you receive your first invoice.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoice Detail Sheet */}
      <InvoiceDetailSheet
        invoice={selectedInvoice}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onPayNow={handleOpenPaymentModal}
      />

      {/* Payment Modal */}
      <PaymentModal
        invoice={invoiceToPayFrom}
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onSubmit={handlePaymentSubmit}
      />

      {/* Payment Success Dialog */}
      <PaymentSuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        amount={lastPaidAmount}
        transactionId={lastPaymentResult?.transactionId}
        cardLastFour={lastPaymentResult?.cardLastFour}
      />
    </div>
  );
}

interface InvoiceCardProps {
  invoice: CustomerInvoice;
  onView: () => void;
  onPayNow?: () => void;
}

function InvoiceCard({ invoice, onView, onPayNow }: InvoiceCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Source Icon */}
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {getSourceIcon(invoice.source_type)}
          </div>

          {/* Invoice Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {getSourceLabel(invoice.source_type)}
              </span>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="font-medium truncate">
              {invoice.source_reference || `Invoice #${invoice.invoice_number || invoice.id.slice(0, 8)}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(invoice.created_at), "MMM d, yyyy")}</span>
              {invoice.business?.business_name && (
                <>
                  <span>•</span>
                  <span>{invoice.business.business_name}</span>
                </>
              )}
            </div>
          </div>

          {/* Amount & Actions */}
          <div className="text-right shrink-0">
            <p className={`font-bold text-lg ${invoice.status === "pending" ? "text-warning" : ""}`}>
              {formatCurrency(Number(invoice.amount))}
            </p>
            {invoice.status === "pending" && onPayNow && (
              <Button 
                size="sm" 
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onPayNow();
                }}
              >
                Pay Now
              </Button>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
