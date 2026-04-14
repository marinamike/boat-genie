import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Flag, Loader2 } from "lucide-react";

interface LineItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  verified: boolean;
  disputed: boolean;
  dispute_note: string | null;
}

interface InvoiceData {
  id: string;
  work_order_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  business_id: string;
  businesses: { id: string; business_name: string; owner_id: string };
  work_orders: { id: string; title: string };
  invoice_line_items: LineItem[];
}

interface InvoiceReviewProps {
  invoiceId: string;
  onClose?: () => void;
}

export function InvoiceReview({ invoiceId, onClose }: InvoiceReviewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeItemId, setDisputeItemId] = useState<string | null>(null);
  const [disputeNote, setDisputeNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchInvoice = useCallback(async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        id, work_order_id, total_amount, status, created_at, business_id,
        businesses:businesses!invoices_business_id_fkey(id, business_name, owner_id),
        work_orders:work_orders!invoices_work_order_id_fkey(id, title),
        invoice_line_items(*)
      `)
      .eq("id", invoiceId)
      .single();

    if (error) {
      console.error("Error fetching invoice:", error);
      toast({ title: "Error", description: "Failed to load invoice.", variant: "destructive" });
    } else {
      setInvoice(data as unknown as InvoiceData);
    }
    setLoading(false);
  }, [invoiceId, toast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleVerify = async (itemId: string) => {
    setProcessing(true);
    const { error } = await supabase
      .from("invoice_line_items")
      .update({ verified: true, disputed: false, dispute_note: null })
      .eq("id", itemId);

    if (error) {
      toast({ title: "Error", description: "Failed to verify item.", variant: "destructive" });
    } else {
      await fetchInvoice();
    }
    setProcessing(false);
  };

  const handleDispute = async (item: LineItem) => {
    if (!disputeNote.trim() || !invoice || !user) return;
    setProcessing(true);

    // 1. Mark line item as disputed
    const { error: itemError } = await supabase
      .from("invoice_line_items")
      .update({ disputed: true, dispute_note: disputeNote.trim(), verified: false })
      .eq("id", item.id);

    if (itemError) {
      toast({ title: "Error", description: "Failed to dispute item.", variant: "destructive" });
      setProcessing(false);
      return;
    }

    // 2. Update work order status to "disputed"
    await supabase
      .from("work_orders")
      .update({ status: "disputed" })
      .eq("id", invoice.work_order_id);

    // 3. Send system message to business owner
    const recipientId = invoice.businesses?.owner_id;
    if (recipientId) {
      await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        work_order_id: invoice.work_order_id,
        content: `⚠️ Line item disputed: ${item.service_name} — ${disputeNote.trim()}`,
        message_type: "system",
      });
    }

    toast({ title: "Dispute Sent", description: "Your dispute has been sent to the provider." });
    setDisputeItemId(null);
    setDisputeNote("");
    await fetchInvoice();
    setProcessing(false);
  };

  const handleApprove = async () => {
    if (!invoice) return;
    setProcessing(true);
    const { error } = await supabase
      .from("invoices")
      .update({ status: "approved" })
      .eq("id", invoice.id);

    if (error) {
      toast({ title: "Error", description: "Failed to approve invoice.", variant: "destructive" });
      setProcessing(false);
      return;
    }

    const { error: woError } = await supabase
      .from("work_orders")
      .update({ status: "paid" })
      .eq("id", invoice.work_order_id);

    if (woError) {
      console.error("Error updating work order to paid:", woError);
    }

    toast({ title: "Invoice Approved", description: "Payment has been approved." });
    await fetchInvoice();
    onClose?.();
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return <p className="text-center text-muted-foreground py-8">Invoice not found.</p>;
  }

  const items = invoice.invoice_line_items || [];
  const allVerified = items.length > 0 && items.every((i) => i.verified);
  const hasDisputed = items.some((i) => i.disputed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{invoice.businesses?.business_name}</p>
        <h3 className="text-lg font-semibold">{invoice.work_orders?.title}</h3>
        <p className="text-xs text-muted-foreground">
          Invoice Date: {new Date(invoice.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Line Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className={
              item.verified
                ? "border-emerald-200 bg-emerald-50/50"
                : item.disputed
                ? "border-destructive/30 bg-destructive/5"
                : ""
            }
          >
            <CardContent className="py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{item.service_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × ${Number(item.unit_price).toFixed(2)} = ${Number(item.total).toFixed(2)}
                  </p>
                </div>
                {item.verified ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
                    <Check className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                ) : item.disputed ? (
                  <Badge variant="destructive" className="shrink-0">
                    <Flag className="w-3 h-3 mr-1" /> Disputed
                  </Badge>
                ) : null}
              </div>

              {item.disputed && item.dispute_note && (
                <p className="text-xs text-destructive italic">"{item.dispute_note}"</p>
              )}

              {!item.verified && !item.disputed && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    disabled={processing}
                    onClick={() => handleVerify(item.id)}
                  >
                    <Check className="w-3 h-3 mr-1" /> Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    disabled={processing}
                    onClick={() => {
                      setDisputeItemId(item.id);
                      setDisputeNote("");
                    }}
                  >
                    <Flag className="w-3 h-3 mr-1" /> Dispute
                  </Button>
                </div>
              )}

              {disputeItemId === item.id && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Reason for dispute..."
                    value={disputeNote}
                    onChange={(e) => setDisputeNote(e.target.value)}
                    className="text-sm h-8"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={processing || !disputeNote.trim()}
                    onClick={() => handleDispute(item)}
                  >
                    Submit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-lg">${Number(invoice.total_amount).toFixed(2)}</span>
        </div>

        {allVerified && invoice.status !== "approved" && (
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            disabled={processing}
            onClick={handleApprove}
          >
            {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            All Items Verified — Approve Payment
          </Button>
        )}

        {invoice.status === "approved" && (
          <Badge className="w-full justify-center py-2 bg-emerald-100 text-emerald-700 border-emerald-200">
            <Check className="w-4 h-4 mr-1" /> Invoice Approved
          </Badge>
        )}

        {hasDisputed && (
          <div className="text-center space-y-1">
            <Badge variant="destructive">Disputed</Badge>
            <p className="text-xs text-muted-foreground">Your dispute has been sent to the provider.</p>
          </div>
        )}
      </div>
    </div>
  );
}
