import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Briefcase, 
  Clock, 
  Ship, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Zap,
  MapPin,
  Loader2,
  Sparkles
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { WishFormItem, QuoteFormData } from "@/hooks/useJobBoard";
import { ProviderService } from "@/hooks/useProviderMetrics";

interface LeadStreamProps {
  wishes: WishFormItem[];
  providerServices: ProviderService[];
  onSubmitQuote: (wishId: string, data: QuoteFormData) => Promise<boolean>;
  submitting: boolean;
}

const urgencyColors: Record<string, string> = {
  urgent: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  normal: "bg-muted text-muted-foreground",
};

// Check if wish matches a specific provider service
function getMatchingService(wishServiceType: string, services: ProviderService[]): ProviderService | null {
  const normalizedWish = wishServiceType.toLowerCase().trim();
  
  return services.find(service => {
    const normalizedService = service.service_name.toLowerCase().trim();
    return normalizedService === normalizedWish ||
           normalizedService.includes(normalizedWish) ||
           normalizedWish.includes(normalizedService);
  }) || null;
}

export function LeadStream({ wishes, providerServices, onSubmitQuote, submitting }: LeadStreamProps) {
  const [selectedWish, setSelectedWish] = useState<WishFormItem | null>(null);
  const [matchingService, setMatchingService] = useState<ProviderService | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const handleQuickQuote = (wish: WishFormItem) => {
    const service = getMatchingService(wish.service_type, providerServices);
    setSelectedWish(wish);
    setMatchingService(service);
    setQuoteDialogOpen(true);
  };

  const handleSubmitQuote = async (data: QuoteFormData) => {
    if (!selectedWish) return;
    const success = await onSubmitQuote(selectedWish.id, data);
    if (success) {
      setQuoteDialogOpen(false);
      setSelectedWish(null);
      setMatchingService(null);
    }
  };

  if (wishes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No New Leads</h3>
          <p className="text-muted-foreground text-center">
            New leads matching your services will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            New Leads
          </h3>
          <Badge variant="secondary">{wishes.length} lead{wishes.length !== 1 ? "s" : ""}</Badge>
        </div>

        {wishes.map((wish) => {
          const matchedService = getMatchingService(wish.service_type, providerServices);
          
          return (
            <Card key={wish.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{wish.service_type}</CardTitle>
                      {matchedService && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Matches Your Menu
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Ship className="w-4 h-4" />
                      {[wish.boat?.make, wish.boat?.model].filter(Boolean).join(" ") || "Boat details hidden"}
                      {wish.boat?.length_ft && ` • ${wish.boat.length_ft}ft`}
                    </CardDescription>
                  </div>
                  {wish.urgency && wish.urgency !== "normal" && (
                    <Badge className={urgencyColors[wish.urgency] || urgencyColors.normal}>
                      {wish.urgency === "urgent" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {wish.urgency}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {wish.description}
                </p>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{wish.boat_profile?.marina_name || "Location not specified"}</span>
                </div>

                {/* Timing */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDistanceToNow(new Date(wish.created_at), { addSuffix: true })}
                  </span>
                  {wish.preferred_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(wish.preferred_date), "MMM d")}
                    </span>
                  )}
                </div>

                {/* Quick Quote Button */}
                <Button 
                  onClick={() => handleQuickQuote(wish)} 
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Quote
                  {matchedService && (
                    <span className="ml-2 text-xs opacity-80">
                      (${matchedService.price}/{matchedService.pricing_model === "per_foot" ? "ft" : "hr"})
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Quote Dialog */}
      <QuickQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        wish={selectedWish}
        matchingService={matchingService}
        onSubmit={handleSubmitQuote}
        submitting={submitting}
      />
    </>
  );
}

function QuickQuoteDialog({
  open,
  onOpenChange,
  wish,
  matchingService,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wish: WishFormItem | null;
  matchingService: ProviderService | null;
  onSubmit: (data: QuoteFormData) => void;
  submitting: boolean;
}) {
  // Auto-fill labor cost based on matching service and boat length
  const calculateAutoFill = () => {
    if (!matchingService || !wish?.boat?.length_ft) return 0;
    
    if (matchingService.pricing_model === "per_foot") {
      return matchingService.price * wish.boat.length_ft;
    }
    return matchingService.price; // hourly or flat rate
  };

  const autoFillAmount = calculateAutoFill();
  
  const [laborCost, setLaborCost] = useState(autoFillAmount > 0 ? autoFillAmount.toString() : "");
  const [materialsCost, setMaterialsCost] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens with new wish
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && matchingService) {
      setLaborCost(autoFillAmount > 0 ? autoFillAmount.toString() : "");
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      laborCost: parseFloat(laborCost) || 0,
      materialsCost: parseFloat(materialsCost) || 0,
      estimatedCompletionDate: estimatedDate,
      notes: notes || undefined,
    });
  };

  const totalCost = (parseFloat(laborCost) || 0) + (parseFloat(materialsCost) || 0);
  const leadFee = totalCost * 0.05; // 5% lead fee
  const providerReceives = totalCost - leadFee;
  const serviceFee = totalCost * 0.10;
  const ownerTotal = totalCost + serviceFee;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Quote
          </DialogTitle>
          <DialogDescription>
            {wish?.service_type} • {wish?.boat?.make} {wish?.boat?.model}
            {wish?.boat?.length_ft && ` • ${wish.boat.length_ft}ft`}
          </DialogDescription>
        </DialogHeader>

        {matchingService && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-sm text-green-600 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Auto-filled from your Service Menu
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {matchingService.service_name}: ${matchingService.price}/{matchingService.pricing_model === "per_foot" ? "ft" : "hr"}
              {matchingService.pricing_model === "per_foot" && wish?.boat?.length_ft && (
                <> × {wish.boat.length_ft}ft = ${autoFillAmount.toFixed(2)}</>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labor">Labor Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="labor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Materials Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="materials"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={materialsCost}
                  onChange={(e) => setMaterialsCost(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Estimated Completion Date</Label>
            <Input
              id="date"
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Price breakdown */}
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Quote</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Lead Fee (5%)</span>
              <span>-${leadFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t text-green-600">
              <span>You Receive</span>
              <span>${providerReceives.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>Owner Pays (incl. 10% platform fee)</span>
              <span>${ownerTotal.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !laborCost || !estimatedDate}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quote"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
