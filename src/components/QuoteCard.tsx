import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/pricing";
import { Check, X, Clock, User, AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type QuoteStatus = Database["public"]["Enums"]["quote_status"];

interface QuoteCardProps {
  quote: {
    id: string;
    provider_id: string;
    base_price: number;
    service_fee: number;
    emergency_fee: number;
    total_owner_price: number;
    is_emergency: boolean;
    status: QuoteStatus;
    notes: string | null;
    valid_until: string | null;
    created_at: string;
  };
  providerName?: string;
  isOwner: boolean;
  onAccept?: (quoteId: string) => void;
  onReject?: (quoteId: string) => void;
  loading?: boolean;
}

const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800",
  },
  accepted: {
    label: "Accepted",
    className: "bg-green-100 text-green-800",
  },
  declined: {
    label: "Declined",
    className: "bg-red-100 text-red-800",
  },
};

export function QuoteCard({
  quote,
  providerName = "Service Provider",
  isOwner,
  onAccept,
  onReject,
  loading = false,
}: QuoteCardProps) {
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();
  const status = isExpired && quote.status === "pending" ? "expired" : quote.status;
  const config = statusConfig[status];

  const validUntilDate = quote.valid_until 
    ? new Date(quote.valid_until).toLocaleDateString()
    : null;

  return (
    <Card className={`overflow-hidden ${quote.status === "accepted" ? "ring-2 ring-green-500" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{providerName}</CardTitle>
              <CardDescription className="text-xs">
                Submitted {new Date(quote.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <Badge className={config.className}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Price</span>
            <span>{formatPrice(quote.base_price)}</span>
          </div>
          {quote.service_fee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Fee</span>
              <span>{formatPrice(quote.service_fee)}</span>
            </div>
          )}
          {quote.is_emergency && quote.emergency_fee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                Emergency Fee
              </span>
              <span className="text-destructive">{formatPrice(quote.emergency_fee)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span className="text-primary">{formatPrice(quote.total_owner_price)}</span>
          </div>
        </div>

        {quote.notes && (
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-sm text-muted-foreground italic">"{quote.notes}"</p>
          </div>
        )}

        {validUntilDate && status === "pending" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Valid until {validUntilDate}
          </div>
        )}

        {/* Actions for owner */}
        {isOwner && status === "pending" && onAccept && onReject && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onReject(quote.id)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary"
              onClick={() => onAccept(quote.id)}
              disabled={loading}
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuoteCard;
