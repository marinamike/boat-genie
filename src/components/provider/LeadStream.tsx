import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { WishFormItem, QuoteFormData, QuoteLineItem } from "@/hooks/useJobBoard";
import { supabase } from "@/integrations/supabase/client";

interface LeadStreamProps {
  wishes: WishFormItem[];
  pendingWishes?: WishFormItem[];
  businessId: string;
  onSubmitQuote: (wishId: string, data: QuoteFormData) => Promise<boolean>;
  submitting: boolean;
}

const urgencyColors: Record<string, string> = {
  urgent: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  normal: "bg-muted text-muted-foreground",
};

const pricingModelLabels: Record<string, string> = {
  flat_rate: "Fixed",
  per_foot: "Per Ft",
  hourly: "Hourly",
  diagnostic: "Diag",
};

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function getServiceDisplay(wish: WishFormItem): { category: string; name: string } {
  const w = wish as any;
  return {
    category: w.service_category || "",
    name: w.service_name || wish.service_type || "Service Request",
  };
}

export function LeadStream({ wishes, pendingWishes = [], businessId, onSubmitQuote, submitting }: LeadStreamProps) {
  const [selectedWish, setSelectedWish] = useState<WishFormItem | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const handleQuickQuote = (wish: WishFormItem) => {
    setSelectedWish(wish);
    setQuoteDialogOpen(true);
  };

  const handleSubmitQuote = async (data: QuoteFormData) => {
    if (!selectedWish) return;
    const success = await onSubmitQuote(selectedWish.id, data);
    if (success) {
      setQuoteDialogOpen(false);
      setSelectedWish(null);
    }
  };

  if (wishes.length === 0 && pendingWishes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Leads</h3>
          <p className="text-muted-foreground text-center">
            No leads matching your service menu right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {wishes.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                New Leads
              </h3>
              <Badge variant="secondary">{wishes.length} lead{wishes.length !== 1 ? "s" : ""}</Badge>
            </div>

            {wishes.map((wish) => {
              const { category, name } = getServiceDisplay(wish);
              return (
                <Card key={wish.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{name}</CardTitle>
                          {category && (
                            <Badge variant="outline" className="text-xs">{category}</Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Ship className="w-4 h-4" />
                          {wish.boat?.year && `${wish.boat.year} `}
                          {[wish.boat?.make, wish.boat?.model].filter(Boolean).join(" ") || "Vessel"}
                          {wish.boat?.length_ft && ` • ${wish.boat.length_ft}ft`}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {wish.is_emergency && (
                          <Badge className={urgencyColors.urgent}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Emergency
                          </Badge>
                        )}
                        {wish.urgency && wish.urgency !== "normal" && !wish.is_emergency && (
                          <Badge className={urgencyColors[wish.urgency] || urgencyColors.normal}>
                            {wish.urgency}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {wish.description}
                    </p>

                    {wish.preferred_date && (
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">
                          Requested by {format(new Date(wish.preferred_date), "MMMM d, yyyy")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{wish.boat_profile?.marina_name || "Location not specified"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Submitted {formatDistanceToNow(new Date(wish.created_at), { addSuffix: true })}</span>
                    </div>

                    <Button 
                      onClick={() => handleQuickQuote(wish)} 
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Submit Quote
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {/* Pending Quoted Leads Section */}
        {pendingWishes.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Leads
              </h3>
              <Badge variant="outline">{pendingWishes.length} pending</Badge>
            </div>

            {pendingWishes.map((wish) => {
              const { category, name } = getServiceDisplay(wish);
              return (
                <Card key={wish.id} className="opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{name}</CardTitle>
                          {category && (
                            <Badge variant="outline" className="text-xs">{category}</Badge>
                          )}
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            <Clock className="w-3 h-3 mr-1" />
                            Quote Pending
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Ship className="w-4 h-4" />
                          {wish.boat?.year && `${wish.boat.year} `}
                          {[wish.boat?.make, wish.boat?.model].filter(Boolean).join(" ") || "Vessel"}
                          {wish.boat?.length_ft && ` • ${wish.boat.length_ft}ft`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {wish.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Submitted {formatDistanceToNow(new Date(wish.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm text-amber-600 font-medium">
                      Awaiting customer response
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Quick Quote Dialog */}
      <QuickQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        wish={selectedWish}
        businessId={businessId}
        onSubmit={handleSubmitQuote}
        submitting={submitting}
      />
    </>
  );
}

// ─── Line Item State ───

interface LineItemState {
  id: string;
  name: string;
  pricingModel: string;
  quantity: number;
  unitPrice: number;
  included: boolean;
  isCustom: boolean;
}

let lineItemIdCounter = 0;
function nextId() {
  return `li-${++lineItemIdCounter}`;
}

// ─── QuickQuoteDialog ───

function QuickQuoteDialog({
  open,
  onOpenChange,
  wish,
  businessId,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wish: WishFormItem | null;
  businessId: string;
  onSubmit: (data: QuoteFormData) => void;
  submitting: boolean;
}) {
  const [lineItems, setLineItems] = useState<LineItemState[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [estimatedDate, setEstimatedDate] = useState("");
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("");
  const [notes, setNotes] = useState("");

  const boatLength = wish?.boat?.length_ft ?? null;
  const { category, name } = wish ? getServiceDisplay(wish) : { category: "", name: "" };

  // Fetch menu items when dialog opens
  useEffect(() => {
    if (!open || !wish || !businessId) return;

    const fetchMenuItems = async () => {
      setLoadingMenu(true);
      try {
        let query = supabase
          .from("business_service_menu")
          .select("id, name, pricing_model, default_price, category, description")
          .eq("business_id", businessId)
          .eq("is_active", true);

        // Filter by matching category if available
        if (category) {
          query = query.eq("category", category);
        }

        const { data } = await query.order("name");

        const items: LineItemState[] = (data || []).map((item) => {
          const isPft = item.pricing_model === "per_foot";
          const qty = isPft && boatLength ? boatLength : 1;
          return {
            id: nextId(),
            name: item.name,
            pricingModel: item.pricing_model,
            quantity: qty,
            unitPrice: Number(item.default_price) || 0,
            included: false,
            isCustom: false,
          };
        });

        setLineItems(items);
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setLineItems([]);
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchMenuItems();
    setEstimatedDate("");
    setEstimatedArrivalTime("");
    setNotes("");
  }, [open, wish?.id, businessId]);

  // Arrival time options
  const arrivalTimeOptions = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 6;
    const hour12 = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    return { value: `${hour}:00`, label: `${hour12}:00 ${ampm}` };
  });

  // Mutations
  const toggleIncluded = (id: string) => {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, included: !li.included } : li))
    );
  };

  const updateQuantity = (id: string, qty: number) => {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, quantity: Math.max(0, qty) } : li))
    );
  };

  const updateUnitPrice = (id: string, price: number) => {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, unitPrice: Math.max(0, price) } : li))
    );
  };

  const updateCustomName = (id: string, newName: string) => {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, name: newName } : li))
    );
  };

  const addCustomItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: nextId(),
        name: "",
        pricingModel: "flat_rate",
        quantity: 1,
        unitPrice: 0,
        included: true,
        isCustom: true,
      },
    ]);
  };

  const addDiagnosticFee = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: nextId(),
        name: "Diagnostic Fee",
        pricingModel: "diagnostic",
        quantity: 1,
        unitPrice: 0,
        included: true,
        isCustom: true,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  };

  // Computed
  const includedItems = lineItems.filter((li) => li.included);
  const runningTotal = includedItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quoteLineItems: QuoteLineItem[] = includedItems.map((li) => ({
      name: li.name,
      pricingModel: li.pricingModel,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      lineTotal: li.quantity * li.unitPrice,
      isCustom: li.isCustom,
    }));

    onSubmit({
      lineItems: quoteLineItems,
      totalAmount: runningTotal,
      estimatedCompletionDate: estimatedDate,
      estimatedArrivalTime: estimatedArrivalTime || undefined,
      notes: notes || undefined,
    });
  };

  if (!wish) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Submit Quote
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="flex items-center gap-2">
              <Ship className="w-4 h-4" />
              {wish.boat?.year && `${wish.boat.year} `}
              {[wish.boat?.make, wish.boat?.model].filter(Boolean).join(" ") || "Vessel"}
              {wish.boat?.length_ft && ` • ${wish.boat.length_ft}ft`}
            </span>
            <span className="flex items-center gap-2 text-xs">
              {category && <Badge variant="outline" className="text-[10px] h-5">{category}</Badge>}
              <span className="font-medium">{name}</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Owner description */}
        {wish.description && (
          <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground text-xs mb-1">Owner Notes</p>
            {wish.description}
          </div>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          <form id="quote-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Line Items */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Line Items</Label>

              {loadingMenu ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading menu items...
                </div>
              ) : lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No menu items found for this category. Add custom items below.
                </p>
              ) : (
                <div className="space-y-2">
                  {lineItems.map((li) => (
                    <div
                      key={li.id}
                      className={`border rounded-lg p-3 space-y-2 transition-colors ${
                        li.included ? "border-primary/40 bg-primary/5" : "opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={li.included}
                          onCheckedChange={() => toggleIncluded(li.id)}
                        />
                        {li.isCustom ? (
                          <Input
                            value={li.name}
                            onChange={(e) => updateCustomName(li.id, e.target.value)}
                            placeholder="Item name"
                            className="h-7 text-sm flex-1"
                          />
                        ) : (
                          <span className="text-sm font-medium flex-1">{li.name}</span>
                        )}
                        <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
                          {pricingModelLabels[li.pricingModel] || li.pricingModel}
                        </Badge>
                        {li.isCustom && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeItem(li.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pl-7">
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] text-muted-foreground">
                            {li.pricingModel === "per_foot" ? "Ft" : "Qty"}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={li.quantity}
                            onChange={(e) => updateQuantity(li.id, parseFloat(e.target.value) || 0)}
                            className="h-7 w-16 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] text-muted-foreground">×$</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={li.unitPrice}
                            onChange={(e) => updateUnitPrice(li.id, parseFloat(e.target.value) || 0)}
                            className="h-7 w-20 text-sm"
                          />
                        </div>
                        <span className="text-sm font-medium ml-auto">
                          {formatPrice(li.quantity * li.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDiagnosticFee}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Diagnostic Fee
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomItem}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Custom Item
                </Button>
              </div>
            </div>

            {/* Running Total */}
            <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
              <span className="font-semibold text-sm">Quote Total</span>
              <span className="text-lg font-bold text-primary">{formatPrice(runningTotal)}</span>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="space-y-2">
              <Label htmlFor="quote-date">Scheduled Date *</Label>
              <Input
                id="quote-date"
                type="date"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-arrival">Estimated Arrival Time</Label>
              <Select value={estimatedArrivalTime} onValueChange={setEstimatedArrivalTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select arrival time" />
                </SelectTrigger>
                <SelectContent>
                  {arrivalTimeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-notes">Notes (optional)</Label>
              <Textarea
                id="quote-notes"
                placeholder="Any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="quote-form"
            disabled={submitting || !estimatedDate || includedItems.length === 0 || runningTotal <= 0}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>Submit Quote — {formatPrice(runningTotal)}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
