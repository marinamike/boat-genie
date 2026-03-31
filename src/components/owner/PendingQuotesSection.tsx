import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Check, 
  X, 
  Calendar,
  Clock,
  AlertTriangle,
  Ship
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/pricing";
import { format } from "date-fns";

interface PendingQuote {
  id: string;
  work_order_id: string;
  base_price: number;
  service_fee: number;
  total_owner_price: number;
  materials_deposit: number | null;
  notes: string | null;
  created_at: string;
  business_id: string | null;
  work_order: {
    id: string;
    title: string;
    description: string | null;
    scheduled_date: string | null;
    estimated_arrival_time: string | null;
    is_emergency: boolean;
    boat: {
      id: string;
      name: string;
    } | null;
  } | null;
  provider: {
    business_name: string | null;
  } | null;
}

interface PendingQuotesSectionProps {
  userId: string;
  onQuoteAction?: () => void;
}

export function PendingQuotesSection({ userId, onQuoteAction }: PendingQuotesSectionProps) {
  const [pendingQuotes, setPendingQuotes] = useState<PendingQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingQuotes = useCallback(async () => {
    try {
      // 1. Get user's boat IDs
      const { data: boats } = await supabase
        .from("boats")
        .select("id")
        .eq("owner_id", userId);

      if (!boats || boats.length === 0) {
        setPendingQuotes([]);
        return;
      }

      const boatIds = boats.map(b => b.id);

      // 2. Get work orders for those boats
      const { data: workOrders, error: woError } = await supabase
        .from("work_orders")
        .select(`
          id,
          title,
          description,
          scheduled_date,
          estimated_arrival_time,
          is_emergency,
          business_id,
          boat:boats(id, name)
        `)
        .in("boat_id", boatIds);

      if (woError) throw woError;
      if (!workOrders || workOrders.length === 0) {
        setPendingQuotes([]);
        return;
      }

      const workOrderIds = workOrders.map(wo => wo.id);
      const workOrderMap = new Map(workOrders.map(wo => [wo.id, wo]));

      // 3. Get pending quotes for those work orders
      const { data: quotes, error: qError } = await supabase
        .from("quotes")
        .select(`
          id,
          work_order_id,
          base_price,
          service_fee,
          total_owner_price,
          materials_deposit,
          notes,
          created_at,
          business_id
        `)
        .in("work_order_id", workOrderIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (qError) throw qError;
      if (!quotes || quotes.length === 0) {
        setPendingQuotes([]);
        return;
      }

      // 4. Collect unique business IDs and fetch business names
      const bizIds = [...new Set(
        quotes.map(q => q.business_id).filter(Boolean) as string[]
      )];

      let bizMap = new Map<string, string | null>();
      if (bizIds.length > 0) {
        const { data: businesses } = await supabase
          .from("businesses")
          .select("id, business_name")
          .in("id", bizIds);

        for (const b of businesses || []) {
          bizMap.set(b.id, b.business_name);
        }
      }

      // 5. Assemble results
      const result: PendingQuote[] = quotes.map(quote => {
        const wo = workOrderMap.get(quote.work_order_id);
        return {
          ...quote,
          work_order: wo ? {
            id: wo.id,
            title: wo.title,
            description: wo.description,
            scheduled_date: wo.scheduled_date,
            estimated_arrival_time: wo.estimated_arrival_time,
            is_emergency: wo.is_emergency,
            boat: wo.boat as PendingQuote["work_order"] extends null ? never : NonNullable<PendingQuote["work_order"]>["boat"],
          } : null,
          provider: quote.business_id
            ? { business_name: bizMap.get(quote.business_id) || null }
            : null,
        };
      });

      setPendingQuotes(result);
    } catch (error) {
      console.error("Error fetching pending quotes:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPendingQuotes();
  }, [fetchPendingQuotes]);

  // Realtime subscription for instant quote updates
  useEffect(() => {
    const channel = supabase
      .channel('pending-quotes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
        },
        () => {
          fetchPendingQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingQuotes]);

  const handleAcceptQuote = async (quote: PendingQuote) => {
    setActionLoading(quote.id);
    try {
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quote.id);

      if (quoteError) throw quoteError;

      const { error: woError } = await supabase
        .from("work_orders")
        .update({ 
          accepted_quote_id: quote.id,
          status: "assigned",
          escrow_status: "work_started",
          escrow_amount: quote.total_owner_price,
          owner_approved_at: new Date().toISOString(),
        })
        .eq("id", quote.work_order_id);

      if (woError) throw woError;

      if (quote.work_order?.boat?.id) {
        await supabase
          .from("wish_forms")
          .update({ status: "converted" })
          .eq("boat_id", quote.work_order.boat.id)
          .in("status", ["submitted", "reviewed", "approved"]);
      }

      toast({
        title: "Quote accepted!",
        description: "The service provider has been notified and will begin work soon.",
      });

      await fetchPendingQuotes();
      onQuoteAction?.();
    } catch (error: any) {
      console.error("Error accepting quote:", error);
      toast({
        title: "Error accepting quote",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineQuote = async (quote: PendingQuote) => {
    setActionLoading(quote.id);
    try {
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ status: "rejected" })
        .eq("id", quote.id);

      if (quoteError) throw quoteError;

      const { error: woError } = await supabase
        .from("work_orders")
        .update({ 
          status: "cancelled",
          escrow_status: "pending_quote",
        })
        .eq("id", quote.work_order_id);

      if (woError) throw woError;

      toast({
        title: "Quote declined",
        description: "The provider has been notified.",
      });

      await fetchPendingQuotes();
      onQuoteAction?.();
    } catch (error: any) {
      console.error("Error declining quote:", error);
      toast({
        title: "Error declining quote",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return null;
  }

  if (pendingQuotes.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight">Pending Quotes</h2>
        <Badge variant="secondary" className="ml-auto">
          {pendingQuotes.length} awaiting review
        </Badge>
      </div>

      <div className="space-y-4">
        {pendingQuotes.map((quote) => (
          <Card key={quote.id} className="overflow-hidden border-primary/20">
            <CardHeader className="bg-primary/5 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {quote.work_order?.title}
                    {quote.work_order?.is_emergency && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Emergency
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Ship className="w-4 h-4" />
                    {quote.work_order?.boat?.name}
                    {quote.provider?.business_name && (
                      <>
                        <span>•</span>
                        <span>{quote.provider.business_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-primary border-primary">
                  Quote Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {quote.work_order?.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {quote.work_order.description}
                </p>
              )}

              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Cost</span>
                    <span>{formatPrice(quote.base_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee (10%)</span>
                    <span>{formatPrice(quote.service_fee)}</span>
                  </div>
                  {quote.materials_deposit && quote.materials_deposit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials Deposit</span>
                      <span>{formatPrice(quote.materials_deposit)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(quote.total_owner_price)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
                {quote.work_order?.scheduled_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Scheduled: {format(new Date(quote.work_order.scheduled_date), "MMM d, yyyy")}
                  </span>
                )}
                {quote.work_order?.estimated_arrival_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Arrival: {(() => {
                      const hour = parseInt(quote.work_order.estimated_arrival_time.split(':')[0]);
                      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                      const ampm = hour >= 12 ? "PM" : "AM";
                      return `${hour12}:00 ${ampm}`;
                    })()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Received: {format(new Date(quote.created_at), "MMM d")}
                </span>
              </div>

              {quote.notes && (
                <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3 mb-4">
                  <span className="font-medium">Provider Notes:</span> {quote.notes}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleAcceptQuote(quote)}
                  disabled={actionLoading === quote.id}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept Quote
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDeclineQuote(quote)}
                  disabled={actionLoading === quote.id}
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
