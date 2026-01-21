// Work Order Flow Hook
// Manages the escrow flow: Request -> Quote -> Approval -> Photo Upload -> Release Funds

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { syncStatusToChat } from "@/lib/chatUtils";
import type { Database } from "@/integrations/supabase/types";

type EscrowStatus = Database["public"]["Enums"]["escrow_status"];
type QuoteStatus = Database["public"]["Enums"]["quote_status"];

interface Quote {
  id: string;
  work_order_id: string;
  provider_id: string;
  service_type: string;
  base_price: number;
  service_fee: number;
  lead_fee: number;
  emergency_fee: number;
  total_owner_price: number;
  total_provider_receives: number;
  is_emergency: boolean;
  status: QuoteStatus;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
}

interface WorkOrder {
  id: string;
  boat_id: string;
  title: string;
  description: string | null;
  status: string;
  escrow_status: EscrowStatus;
  is_emergency: boolean;
  escrow_amount: number;
  provider_id: string | null;
  accepted_quote_id: string | null;
}

export function useWorkOrderFlow() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Create a new work order request (starts escrow flow)
  const createWorkOrderRequest = async (data: {
    boatId: string;
    title: string;
    description: string;
    isEmergency: boolean;
    serviceType: string;
  }) => {
    setLoading(true);
    try {
      const { data: workOrder, error } = await supabase
        .from("work_orders")
        .insert({
          boat_id: data.boatId,
          title: data.title,
          description: data.description,
          is_emergency: data.isEmergency,
          service_type: data.serviceType as "genie_service" | "pro_service",
          escrow_status: "pending_quote",
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Request submitted!",
        description: "Providers will review and send quotes.",
      });

      return workOrder;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not create request";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Provider submits a quote
  const submitQuote = async (data: {
    workOrderId: string;
    basePrice: number;
    serviceFee: number;
    leadFee: number;
    emergencyFee: number;
    totalOwnerPrice: number;
    totalProviderReceives: number;
    isEmergency: boolean;
    serviceType: string;
    notes?: string;
    validForDays?: number;
  }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const validUntil = data.validForDays
        ? new Date(Date.now() + data.validForDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: quote, error } = await supabase
        .from("quotes")
        .insert({
          work_order_id: data.workOrderId,
          provider_id: user.id,
          base_price: data.basePrice,
          service_fee: data.serviceFee,
          lead_fee: data.leadFee,
          emergency_fee: data.emergencyFee,
          total_owner_price: data.totalOwnerPrice,
          total_provider_receives: data.totalProviderReceives,
          is_emergency: data.isEmergency,
          service_type: data.serviceType as "genie_service" | "pro_service",
          notes: data.notes || null,
          valid_until: validUntil,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Update work order escrow status
      await supabase
        .from("work_orders")
        .update({ escrow_status: "quoted" })
        .eq("id", data.workOrderId);

      toast({
        title: "Quote submitted!",
        description: "The boat owner will review your quote.",
      });

      return quote;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not submit quote";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Owner accepts a quote
  const acceptQuote = async (quoteId: string, workOrderId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the quote details
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", quoteId)
        .single();

      if (quoteError || !quote) throw new Error("Quote not found");

      // Update quote status
      await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quoteId);

      // Reject other quotes for this work order
      await supabase
        .from("quotes")
        .update({ status: "rejected" })
        .eq("work_order_id", workOrderId)
        .neq("id", quoteId);

      // Check if there's a materials deposit to release immediately
      const materialsDeposit = quote.materials_deposit || 0;
      const laborBalance = quote.total_owner_price - materialsDeposit;

      // Update work order with accepted quote and escrow info
      const { error: workOrderError } = await supabase
        .from("work_orders")
        .update({
          accepted_quote_id: quoteId,
          provider_id: quote.provider_id,
          escrow_status: "approved",
          escrow_amount: laborBalance, // Only labor balance in escrow
          materials_deposit: materialsDeposit,
          materials_deposit_released: materialsDeposit > 0,
          materials_deposit_released_at: materialsDeposit > 0 ? new Date().toISOString() : null,
          status: "in_progress",
          retail_price: quote.total_owner_price,
          wholesale_price: quote.total_provider_receives,
          service_fee: quote.service_fee,
          lead_fee: quote.lead_fee,
          emergency_fee: quote.emergency_fee,
        })
        .eq("id", workOrderId);

      if (workOrderError) throw workOrderError;

      // Sync status to chat as system message
      await syncStatusToChat(workOrderId, "approved", user.id);

      // If there's a deposit, add a special message
      if (materialsDeposit > 0) {
        await syncStatusToChat(workOrderId, "deposit_released", user.id);
      }

      toast({
        title: "Quote accepted!",
        description: materialsDeposit > 0 
          ? `Materials deposit of $${materialsDeposit.toFixed(2)} released. Labor balance held in escrow.`
          : "The provider can now access your boat details.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not accept quote";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Provider marks work as started
  const startWork = async (workOrderId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("work_orders")
        .update({ escrow_status: "work_started" })
        .eq("id", workOrderId);

      if (error) throw error;

      // Sync status to chat as system message
      await syncStatusToChat(workOrderId, "work_started", user.id);

      toast({
        title: "Work started",
        description: "Remember to upload photos when complete.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not update status";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Provider uploads completion photos and marks pending release
  const uploadCompletionPhotos = async (
    workOrderId: string,
    boatId: string,
    title: string,
    description: string
  ) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create boat log entry for the completed work
      const { data: boatLog, error: logError } = await supabase
        .from("boat_logs")
        .insert({
          boat_id: boatId,
          work_order_id: workOrderId,
          title: title,
          description: description,
          log_type: "service",
        })
        .select()
        .single();

      if (logError) throw logError;

      // Update work order status
      const { error: workOrderError } = await supabase
        .from("work_orders")
        .update({
          escrow_status: "pending_photos",
          photos_uploaded_at: new Date().toISOString(),
        })
        .eq("id", workOrderId);

      if (workOrderError) throw workOrderError;

      // Sync status to chat as system message
      await syncStatusToChat(workOrderId, "pending_photos", user.id);

      toast({
        title: "Photos uploaded!",
        description: "Awaiting owner approval to release funds.",
      });

      return boatLog;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not upload photos";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Owner approves and releases funds
  const releaseFunds = async (workOrderId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("work_orders")
        .update({
          escrow_status: "released",
          funds_released_at: new Date().toISOString(),
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", workOrderId);

      if (error) throw error;

      // Sync status to chat as system message
      await syncStatusToChat(workOrderId, "released", user.id);

      toast({
        title: "Funds released!",
        description: "Thank you for using Boat Genie.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not release funds";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Dispute a work order
  const disputeWorkOrder = async (workOrderId: string, reason: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("work_orders")
        .update({
          escrow_status: "disputed",
          description: `DISPUTE: ${reason}`,
        })
        .eq("id", workOrderId);

      if (error) throw error;

      toast({
        title: "Dispute filed",
        description: "An admin will review your case.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not file dispute";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createWorkOrderRequest,
    submitQuote,
    acceptQuote,
    startWork,
    uploadCompletionPhotos,
    releaseFunds,
    disputeWorkOrder,
  };
}

export type { Quote, WorkOrder, EscrowStatus, QuoteStatus };
