import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Lock, AlertCircle } from "lucide-react";
import { CustomerInvoice } from "@/hooks/useCustomerInvoices";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

interface PaymentModalProps {
  invoice: CustomerInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (invoiceId: string, amount: number, cardDetails: CardDetails) => Promise<boolean>;
}

export function PaymentModal({ invoice, open, onOpenChange, onSubmit }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setName("");
    setErrors({});
    setProcessing(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted;
  };

  // Format expiry as MM/YY
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  // Detect card brand
  const getCardBrand = (number: string): string => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.startsWith("4")) return "Visa";
    if (cleaned.startsWith("5")) return "Mastercard";
    if (cleaned.startsWith("3")) return "Amex";
    if (cleaned.startsWith("6")) return "Discover";
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const cleanedCardNumber = cardNumber.replace(/\D/g, "");

    if (cleanedCardNumber.length !== 16) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }

    const [month, year] = expiry.split("/").map(Number);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (!month || !year || month < 1 || month > 12) {
      newErrors.expiry = "Invalid expiry date";
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      newErrors.expiry = "Card has expired";
    }

    if (cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = "CVV must be 3-4 digits";
    }

    if (name.trim().length < 2) {
      newErrors.name = "Please enter cardholder name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!invoice || !validateForm()) return;

    setProcessing(true);
    try {
      const success = await onSubmit(invoice.id, Number(invoice.amount), {
        number: cardNumber.replace(/\D/g, ""),
        expiry,
        cvv,
        name,
      });

      if (success) {
        handleOpenChange(false);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!invoice) return null;

  const cardBrand = getCardBrand(cardNumber);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Enter your card details to pay this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Invoice Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  {invoice.business?.business_name || "Invoice"}
                </p>
                <p className="text-sm">
                  {invoice.source_reference || `#${invoice.invoice_number || invoice.id.slice(0, 8)}`}
                </p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(Number(invoice.amount))}</p>
            </div>
          </div>

          {/* Card Form */}
          <div className="space-y-4">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className={errors.cardNumber ? "border-destructive" : ""}
                  disabled={processing}
                />
                {cardBrand && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {cardBrand}
                  </span>
                )}
              </div>
              {errors.cardNumber && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.cardNumber}
                </p>
              )}
            </div>

            {/* Expiry & CVV Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className={errors.expiry ? "border-destructive" : ""}
                  disabled={processing}
                />
                {errors.expiry && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.expiry}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className={errors.cvv ? "border-destructive" : ""}
                  disabled={processing}
                />
                {errors.cvv && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.cvv}
                  </p>
                )}
              </div>
            </div>

            {/* Name on Card */}
            <div className="space-y-2">
              <Label htmlFor="cardName">Name on Card</Label>
              <Input
                id="cardName"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-destructive" : ""}
                disabled={processing}
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full h-12 text-lg font-semibold"
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay {formatCurrency(Number(invoice.amount))}</>
            )}
          </Button>

          {/* Security Note */}
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Secure payment processing
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
