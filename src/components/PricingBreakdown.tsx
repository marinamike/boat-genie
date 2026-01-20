import { formatPrice, PRICING_CONSTANTS } from "@/lib/pricing";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, Info } from "lucide-react";

interface PricingBreakdownProps {
  basePrice: number;
  serviceFee: number;
  emergencyFee: number;
  totalOwnerPrice: number;
  leadFee?: number;
  totalProviderReceives?: number;
  isEmergency: boolean;
  membershipTier: "standard" | "genie";
  showProviderView?: boolean;
}

export function PricingBreakdown({
  basePrice,
  serviceFee,
  emergencyFee,
  totalOwnerPrice,
  leadFee,
  totalProviderReceives,
  isEmergency,
  membershipTier,
  showProviderView = false,
}: PricingBreakdownProps) {
  const isMember = membershipTier === "genie";

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Price Breakdown</h4>
        <Badge 
          variant={isMember ? "default" : "secondary"} 
          className={isMember ? "bg-gradient-gold text-foreground" : ""}
        >
          {isMember ? (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Member
            </>
          ) : (
            "Standard"
          )}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Base Price</span>
          <span className="font-medium">{formatPrice(basePrice)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            Service Fee ({PRICING_CONSTANTS.SERVICE_FEE_RATE * 100}%)
            {isMember && (
              <Badge variant="secondary" className="text-xs py-0 px-1">
                Waived
              </Badge>
            )}
          </span>
          <span className={`font-medium ${isMember ? "text-green-600 line-through" : ""}`}>
            {formatPrice(serviceFee)}
          </span>
        </div>

        {isEmergency && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-destructive" />
              Emergency Fee
              {isMember && (
                <Badge variant="secondary" className="text-xs py-0 px-1">
                  Reduced
                </Badge>
              )}
            </span>
            <span className="font-medium text-destructive">
              {formatPrice(emergencyFee)}
            </span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between font-semibold text-base">
          <span>Your Total</span>
          <span className="text-primary">{formatPrice(totalOwnerPrice)}</span>
        </div>

        {isMember && serviceFee > 0 && (
          <div className="flex items-center gap-1.5 text-green-600 text-xs">
            <Sparkles className="w-3 h-3" />
            You saved {formatPrice(serviceFee)} with Genie Membership!
          </div>
        )}
      </div>

      {showProviderView && leadFee !== undefined && totalProviderReceives !== undefined && (
        <>
          <Separator className="my-3" />
          <div className="space-y-2 text-sm bg-muted/50 rounded-md p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Info className="w-3 h-3" />
              Provider View
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Price</span>
              <span>{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Lead Fee ({PRICING_CONSTANTS.LEAD_FEE_RATE * 100}%)</span>
              <span>-{formatPrice(leadFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>You Receive</span>
              <span className="text-green-600">{formatPrice(totalProviderReceives)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PricingBreakdown;
