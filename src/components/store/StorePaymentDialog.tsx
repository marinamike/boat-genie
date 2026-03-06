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
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { CartItem } from "@/hooks/useStoreInventory";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

interface StorePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  onConfirm: () => Promise<boolean>;
}

export function StorePaymentDialog({
  open,
  onOpenChange,
  cart,
  subtotal,
  taxAmount,
  total,
  paymentMethod,
  onConfirm,
}: StorePaymentDialogProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCard = paymentMethod === "card";

  const resetForm = () => {
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setName("");
    setErrors({});
    setProcessing(false);
    setSuccess(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    return cleaned.length >= 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` : cleaned;
  };

  const getCardBrand = (number: string): string => {
    const c = number.replace(/\D/g, "");
    if (c.startsWith("4")) return "Visa";
    if (c.startsWith("5")) return "Mastercard";
    if (c.startsWith("3")) return "Amex";
    if (c.startsWith("6")) return "Discover";
    return "";
  };

  const validateCard = (): boolean => {
    if (!isCard) return true;
    const newErrors: Record<string, string> = {};
    if (cardNumber.replace(/\D/g, "").length !== 16) newErrors.cardNumber = "Card number must be 16 digits";
    const [month, year] = expiry.split("/").map(Number);
    const curYear = new Date().getFullYear() % 100;
    const curMonth = new Date().getMonth() + 1;
    if (!month || !year || month < 1 || month > 12) newErrors.expiry = "Invalid expiry date";
    else if (year < curYear || (year === curYear && month < curMonth)) newErrors.expiry = "Card has expired";
    if (cvv.length < 3 || cvv.length > 4) newErrors.cvv = "CVV must be 3-4 digits";
    if (name.trim().length < 2) newErrors.name = "Please enter cardholder name";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCard()) return;
    setProcessing(true);
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1500));
    const ok = await onConfirm();
    setProcessing(false);
    if (ok) setSuccess(true);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h2 className="text-xl font-bold">Payment Successful</h2>
            <p className="text-muted-foreground text-center">
              {formatCurrency(total)} has been processed successfully.
            </p>
            <Button onClick={() => handleOpenChange(false)} className="mt-2">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const cardBrand = getCardBrand(cardNumber);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Confirm Payment
          </DialogTitle>
          <DialogDescription>
            Review your order and complete payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Order Summary */}
          <div className="rounded-lg border p-3 space-y-2 max-h-40 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="truncate flex-1">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium ml-2">{formatCurrency(item.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Card fields (only for card payment) */}
          {isCard && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="store-card">Card Number</Label>
                <div className="relative">
                  <Input
                    id="store-card"
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="store-expiry">Expiry</Label>
                  <Input
                    id="store-expiry"
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
                  <Label htmlFor="store-cvv">CVV</Label>
                  <Input
                    id="store-cvv"
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

              <div className="space-y-2">
                <Label htmlFor="store-name">Name on Card</Label>
                <Input
                  id="store-name"
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
          )}

          <Button className="w-full h-12 text-lg font-semibold" onClick={handleSubmit} disabled={processing || cart.length === 0}>
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay {formatCurrency(total)}</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Secure payment processing
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
