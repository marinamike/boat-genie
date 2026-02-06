import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type InvoiceSource = Database["public"]["Enums"]["invoice_source"];

export interface CustomerInvoice {
  id: string;
  customer_id: string;
  business_id: string;
  source_type: InvoiceSource;
  source_id: string;
  source_reference: string | null;
  invoice_number: string | null;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  business?: {
    business_name: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  cardLastFour?: string;
}

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

export interface ServiceInvoiceDetails {
  id: string;
  invoice_number: string;
  labor_hours: number;
  labor_rate: number;
  labor_total: number;
  parts_total: number;
  haul_fee: number;
  launch_fee: number;
  storage_days: number;
  storage_daily_rate: number;
  storage_total: number;
  other_fees: number;
  other_fees_description: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  work_order_id: string;
  work_order?: {
    title: string;
    description: string | null;
  };
}

export interface SlipInvoiceDetails {
  id: string;
  check_in_at: string;
  check_out_at: string;
  stay_days: number;
  vessel_length_ft: number;
  rate_tier: string;
  rate_per_day: number;
  stay_subtotal: number;
  power_start_reading: number | null;
  power_end_reading: number | null;
  power_usage: number | null;
  power_rate: number | null;
  power_total: number | null;
  water_start_reading: number | null;
  water_end_reading: number | null;
  water_usage: number | null;
  water_rate: number | null;
  water_total: number | null;
  grand_total: number;
  status: string;
}

export interface LeaseInvoiceDetails {
  id: string;
  billing_period_start: string;
  billing_period_end: string;
  base_rent: number;
  power_usage: number | null;
  power_rate: number | null;
  power_total: number | null;
  water_usage: number | null;
  water_rate: number | null;
  water_total: number | null;
  additional_charges: Record<string, number> | null;
  grand_total: number;
  status: string;
}

export interface StoreReceiptDetails {
  id: string;
  receipt_number: string;
  recorded_at: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    item_type: string;
  }[];
}

export function useCustomerInvoices() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("customer_invoices")
        .select(`
          *,
          business:businesses(business_name)
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching customer invoices:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getServiceInvoiceDetails = async (sourceId: string): Promise<ServiceInvoiceDetails | null> => {
    try {
      const { data, error } = await supabase
        .from("service_invoices")
        .select(`
          *,
          work_order:work_orders(title, description)
        `)
        .eq("id", sourceId)
        .single();

      if (error) throw error;
      return data as ServiceInvoiceDetails;
    } catch (error) {
      console.error("Error fetching service invoice details:", error);
      return null;
    }
  };

  const getSlipInvoiceDetails = async (sourceId: string): Promise<SlipInvoiceDetails | null> => {
    try {
      const { data, error } = await supabase
        .from("stay_invoices")
        .select("*")
        .eq("id", sourceId)
        .single();

      if (error) throw error;
      return data as SlipInvoiceDetails;
    } catch (error) {
      console.error("Error fetching slip invoice details:", error);
      return null;
    }
  };

  const getLeaseInvoiceDetails = async (sourceId: string): Promise<LeaseInvoiceDetails | null> => {
    try {
      const { data, error } = await supabase
        .from("recurring_invoices")
        .select("*")
        .eq("id", sourceId)
        .single();

      if (error) throw error;
      return data as LeaseInvoiceDetails;
    } catch (error) {
      console.error("Error fetching lease invoice details:", error);
      return null;
    }
  };

  const getStoreReceiptDetails = async (sourceId: string): Promise<StoreReceiptDetails | null> => {
    try {
      const { data: receipt, error: receiptError } = await supabase
        .from("sales_receipts")
        .select("*")
        .eq("id", sourceId)
        .single();

      if (receiptError) throw receiptError;

      const { data: items, error: itemsError } = await supabase
        .from("sales_receipt_items")
        .select("*")
        .eq("receipt_id", sourceId);

      if (itemsError) throw itemsError;

      return {
        ...receipt,
        items: items || [],
      } as StoreReceiptDetails;
    } catch (error) {
      console.error("Error fetching store receipt details:", error);
      return null;
    }
  };

  const markAsPaid = async (invoiceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("customer_invoices")
        .update({ 
          status: "paid", 
          paid_at: new Date().toISOString() 
        })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Payment Successful",
        description: "Your invoice has been marked as paid.",
      });

      // Refresh invoices
      await fetchInvoices();
      return true;
    } catch (error: any) {
      console.error("Error marking invoice as paid:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
      return false;
    }
  };

  const processPayment = async (
    invoiceId: string,
    amount: number,
    cardDetails: CardDetails
  ): Promise<PaymentResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get card brand from first digit
      const getCardBrand = (num: string) => {
        if (num.startsWith("4")) return "visa";
        if (num.startsWith("5")) return "mastercard";
        if (num.startsWith("3")) return "amex";
        if (num.startsWith("6")) return "discover";
        return "card";
      };

      const cardLastFour = cardDetails.number.slice(-4);
      const cardBrand = getCardBrand(cardDetails.number);

      // Create payment transaction record
      const { data: transaction, error: txError } = await supabase
        .from("payment_transactions")
        .insert({
          customer_invoice_id: invoiceId,
          customer_id: user.id,
          amount,
          payment_method: "card",
          card_last_four: cardLastFour,
          card_brand: cardBrand,
          status: "processing",
        })
        .select("id")
        .single();

      if (txError) throw txError;

      // Simulate payment processing delay (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update transaction to completed
      const { error: updateTxError } = await supabase
        .from("payment_transactions")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      if (updateTxError) throw updateTxError;

      // Update customer invoice to paid
      const { error: invoiceError } = await supabase
        .from("customer_invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (invoiceError) throw invoiceError;

      // Get invoice details to update source table
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (invoice) {
        // Update the source table status based on source_type
        switch (invoice.source_type) {
          case "slip_transient":
            await supabase
              .from("stay_invoices")
              .update({ status: "paid" })
              .eq("id", invoice.source_id);
            break;
          case "slip_lease":
            await supabase
              .from("recurring_invoices")
              .update({ status: "paid" })
              .eq("id", invoice.source_id);
            break;
          case "service":
            await supabase
              .from("service_invoices")
              .update({ status: "paid" })
              .eq("id", invoice.source_id);
            break;
          case "store":
          case "fuel":
            // Sales receipts are immediate transactions, no status update needed
            break;
        }
      }

      // Refresh invoices
      await fetchInvoices();

      return {
        success: true,
        transactionId: transaction.id,
        cardLastFour,
      };
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  useEffect(() => {
    fetchInvoices();

    // Subscribe to realtime updates
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const channel = supabase
        .channel("customer-invoices")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "customer_invoices",
            filter: `customer_id=eq.${user.id}`,
          },
          () => {
            fetchInvoices();
          }
        )
        .subscribe();

      return channel;
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    setupSubscription().then((c) => { channel = c; });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    refetch: fetchInvoices,
    getServiceInvoiceDetails,
    getSlipInvoiceDetails,
    getLeaseInvoiceDetails,
    getStoreReceiptDetails,
    markAsPaid,
    processPayment,
  };
}
