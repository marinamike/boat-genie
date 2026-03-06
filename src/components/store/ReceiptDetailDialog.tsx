import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SalesReceipt } from "@/hooks/useStoreInventory";
import { CreditCard, Banknote, User, Anchor } from "lucide-react";
import { format } from "date-fns";

interface ReceiptDetailDialogProps {
  receipt: SalesReceipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDetailDialog({ receipt, open, onOpenChange }: ReceiptDetailDialogProps) {
  if (!receipt) return null;

  const subtotal = receipt.total_amount - receipt.tax_amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-mono text-lg">Receipt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 font-mono text-sm">
          {/* Receipt number & date */}
          <div className="text-center space-y-1">
            <p className="font-bold">{receipt.receipt_number}</p>
            <p className="text-muted-foreground text-xs">
              {format(new Date(receipt.recorded_at), "MMMM d, yyyy · h:mm a")}
            </p>
          </div>

          <Separator />

          {/* Customer info */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{receipt.is_guest_checkout ? "Guest Checkout" : (receipt.customer_name || "Unknown")}</span>
          </div>
          {receipt.boat_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Anchor className="h-4 w-4" />
              <span>{receipt.boat_name}</span>
            </div>
          )}

          <Separator />

          {/* Line items */}
          <div className="space-y-2">
            {receipt.items && receipt.items.length > 0 ? (
              receipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <div className="flex-1">
                    <span>{item.description}</span>
                    <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                  </div>
                  <span className="font-medium">${item.line_total.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">No line items</p>
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {receipt.tax_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax ({(receipt.tax_rate * 100).toFixed(2)}%)
                </span>
                <span>${receipt.tax_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span className="text-primary">${receipt.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Payment method */}
          <div className="flex items-center justify-center gap-2">
            {receipt.payment_method === "card" ? (
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Banknote className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge variant="outline" className="capitalize">{receipt.payment_method}</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
