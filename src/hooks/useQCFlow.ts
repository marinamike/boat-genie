// QC Flow Hook - Manages Quality Control verification and milestone payments

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { syncStatusToChat } from "@/lib/chatUtils";

interface QCChecklistItem {
  id: string;
  work_order_id: string;
  description: string;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verifier_name: string | null;
  sort_order: number;
}

interface QCAuditLog {
  id: string;
  work_order_id: string;
  boat_id: string;
  action: string;
  performed_by: string;
  performer_name: string | null;
  performer_email: string | null;
  performer_role: string | null;
  notes: string | null;
  created_at: string;
}

export function useQCFlow() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get user info for audit logging
  const getUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    return {
      id: user.id,
      name: profile?.full_name || user.email?.split("@")[0] || "Unknown",
      email: profile?.email || user.email,
      role: roleData?.role || "boat_owner",
    };
  };

  // Create audit log entry
  const createAuditLog = async (
    workOrderId: string,
    boatId: string,
    action: string,
    notes?: string
  ) => {
    const userInfo = await getUserInfo();
    if (!userInfo) return;

    await supabase.from("qc_audit_logs").insert({
      work_order_id: workOrderId,
      boat_id: boatId,
      action,
      performed_by: userInfo.id,
      performer_name: userInfo.name,
      performer_email: userInfo.email,
      performer_role: userInfo.role,
      notes,
    });

    // Also log to boat_logs for permanent history
    await supabase.from("boat_logs").insert({
      boat_id: boatId,
      work_order_id: workOrderId,
      title: `QC: ${action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`,
      description: `${action === "qc_verified" ? "Verified" : action === "dispute_filed" ? "Dispute filed" : action === "funds_released" ? "Funds released" : action === "deposit_released" ? "Materials deposit released" : "QC Review requested"} by ${userInfo.role === "admin" ? "Admin" : userInfo.role === "marina_staff" ? "Runner" : "Owner"}: ${userInfo.name}${notes ? `. Notes: ${notes}` : ""}`,
      log_type: "qc",
      created_by: userInfo.id,
    });
  };

  // Provider requests QC review
  const requestQCReview = async (
    workOrderId: string,
    boatId: string,
    checklistItems: string[]
  ) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create checklist items for verification
      const itemsToInsert = checklistItems.map((desc, index) => ({
        work_order_id: workOrderId,
        description: desc,
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from("qc_checklist_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update work order status
      const { error: woError } = await supabase
        .from("work_orders")
        .update({
          qc_requested_at: new Date().toISOString(),
          escrow_status: "pending_release",
        })
        .eq("id", workOrderId);

      if (woError) throw woError;

      // Create audit log
      await createAuditLog(workOrderId, boatId, "qc_requested", `${checklistItems.length} items submitted for review`);

      // Sync to chat
      await syncStatusToChat(workOrderId, "pending_release", user.id);

      toast({
        title: "QC Review Requested",
        description: "The owner has been notified to verify your work.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not request QC review";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch QC checklist items
  const fetchChecklistItems = useCallback(async (workOrderId: string) => {
    const { data, error } = await supabase
      .from("qc_checklist_items")
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("sort_order");

    if (error) {
      console.error("Error fetching checklist:", error);
      return [];
    }

    return data as QCChecklistItem[];
  }, []);

  // Verify a single checklist item
  const verifyChecklistItem = async (itemId: string) => {
    setLoading(true);
    try {
      const userInfo = await getUserInfo();
      if (!userInfo) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("qc_checklist_items")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: userInfo.id,
          verifier_name: userInfo.name,
        })
        .eq("id", itemId);

      if (error) throw error;

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not verify item";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Unverify a checklist item
  const unverifyChecklistItem = async (itemId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("qc_checklist_items")
        .update({
          is_verified: false,
          verified_at: null,
          verified_by: null,
          verifier_name: null,
        })
        .eq("id", itemId);

      if (error) throw error;

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not unverify item";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verify all and release funds (Owner/Admin/Runner)
  const verifyAndReleaseFunds = async (workOrderId: string, boatId: string) => {
    setLoading(true);
    try {
      const userInfo = await getUserInfo();
      if (!userInfo) throw new Error("Not authenticated");

      // Update work order
      const { error: woError } = await supabase
        .from("work_orders")
        .update({
          escrow_status: "released",
          status: "completed",
          qc_verified_at: new Date().toISOString(),
          qc_verified_by: userInfo.id,
          qc_verifier_name: userInfo.name,
          qc_verifier_role: userInfo.role,
          funds_released_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", workOrderId);

      if (woError) throw woError;

      // Create audit log
      await createAuditLog(workOrderId, boatId, "qc_verified");
      await createAuditLog(workOrderId, boatId, "funds_released");

      // Sync to chat
      await syncStatusToChat(workOrderId, "released", userInfo.id);

      toast({
        title: "Payment Released!",
        description: "All items verified. Funds released to provider.",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not release funds";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Report issue / file dispute
  const reportIssue = async (
    workOrderId: string,
    boatId: string,
    reason: string
  ) => {
    setLoading(true);
    try {
      const userInfo = await getUserInfo();
      if (!userInfo) throw new Error("Not authenticated");

      // Freeze escrow and mark as disputed
      const { error: woError } = await supabase
        .from("work_orders")
        .update({
          escrow_status: "disputed",
          dispute_reason: reason,
          disputed_at: new Date().toISOString(),
          disputed_by: userInfo.id,
        })
        .eq("id", workOrderId);

      if (woError) throw woError;

      // Create audit log
      await createAuditLog(workOrderId, boatId, "dispute_filed", reason);

      // Sync to chat
      await syncStatusToChat(workOrderId, "disputed", userInfo.id);

      toast({
        title: "Issue Reported",
        description: "Escrow frozen. An admin will review the dispute.",
        variant: "destructive",
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not report issue";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Release materials deposit immediately (on quote acceptance)
  const releaseMaterialsDeposit = async (
    workOrderId: string,
    boatId: string,
    depositAmount: number
  ) => {
    setLoading(true);
    try {
      const userInfo = await getUserInfo();
      if (!userInfo) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("work_orders")
        .update({
          materials_deposit: depositAmount,
          materials_deposit_released: true,
          materials_deposit_released_at: new Date().toISOString(),
        })
        .eq("id", workOrderId);

      if (error) throw error;

      // Create audit log
      await createAuditLog(
        workOrderId,
        boatId,
        "deposit_released",
        `Materials deposit of $${depositAmount.toFixed(2)} released to provider`
      );

      toast({
        title: "Deposit Released",
        description: `$${depositAmount.toFixed(2)} materials deposit released to provider.`,
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not release deposit";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch QC audit logs for a work order
  const fetchAuditLogs = useCallback(async (workOrderId: string) => {
    const { data, error } = await supabase
      .from("qc_audit_logs")
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
      return [];
    }

    return data as QCAuditLog[];
  }, []);

  return {
    loading,
    requestQCReview,
    fetchChecklistItems,
    verifyChecklistItem,
    unverifyChecklistItem,
    verifyAndReleaseFunds,
    reportIssue,
    releaseMaterialsDeposit,
    fetchAuditLogs,
  };
}

export type { QCChecklistItem, QCAuditLog };
