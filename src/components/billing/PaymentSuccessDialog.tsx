import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Receipt } from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  transactionId?: string;
  cardLastFour?: string;
}

export function PaymentSuccessDialog({
  open,
  onOpenChange,
  amount,
  transactionId,
  cardLastFour,
}: PaymentSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="space-y-4">
          {/* Success Icon with Animation */}
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <DialogTitle className="text-xl">Payment Successful!</DialogTitle>
          <DialogDescription>
            Your payment has been processed successfully
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Amount Paid */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
            <p className="text-3xl font-bold text-success">{formatCurrency(amount)}</p>
          </div>

          {/* Transaction Details */}
          <div className="text-sm text-muted-foreground space-y-1">
            {transactionId && (
              <p>
                Transaction: <span className="font-mono">{transactionId.slice(0, 8).toUpperCase()}</span>
              </p>
            )}
            {cardLastFour && (
              <p>
                Card ending in: <span className="font-medium">••••{cardLastFour}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-2">
            <Button
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // In a real app, this would download/view the receipt
                onOpenChange(false);
              }}
            >
              <Receipt className="w-4 h-4 mr-2" />
              View Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
