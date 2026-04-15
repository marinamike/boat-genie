import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Plus, Play, Pause, ChevronRight, FilePlus, User, Pencil, PlusCircle, Package, Loader2, CheckCircle, ClipboardCheck, ChevronDown, Wrench } from "lucide-react";
import { EditWorkOrderSheet } from "@/components/service/EditWorkOrderSheet";
import { useStoreInventory } from "@/hooks/useStoreInventory";
import { CreateWorkOrderDialog } from "@/components/provider/CreateWorkOrderDialog";
import { WorkTimer } from "@/components/provider/WorkTimer";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useServiceMenu } from "@/hooks/useServiceMenu";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { formatPrice } from "@/lib/pricing";
import type { useServiceManagement } from "@/hooks/useServiceManagement";

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  status: string;
  boat_id: string;
  provider_checked_in_at: string | null;
  guest_customer_id: string | null;
  boats?: { name: string; make: string | null; model: string | null; owner_id: string };
  guest_customers?: { owner_name: string; owner_email: string | null } | null;
  owner_profile?: { full_name: string | null; email: string | null } | null;
}

interface LineItem {
  id: string;
  work_order_id: string;
  service_name: string;
  unit_price: number;
  quantity: number;
  total: number;
  created_at: string;
}

type ServiceManagementProps = ReturnType<typeof useServiceManagement>;

export function ServiceWorkOrders({
  serviceStaff,
  phases,
  timeEntries,
  activeTimeEntry,
  fetchPhases,
  fetchTimeEntries,
  createPhase,
  updatePhase,
  punchIn,
  punchOut,
  getActiveEntry,
}: ServiceManagementProps) {
  const { business, enabledModules } = useBusiness();
  const { activeMenuItems } = useServiceMenu();
  const { inventory, pullPartForWorkOrder, refreshInventory } = useStoreInventory();
  const storeEnabled = enabledModules.includes("store");
  const activeInventory = inventory.filter(i => i.is_active && i.current_quantity > 0);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhaseSheet, setShowPhaseSheet] = useState(false);
  const [phaseForm, setPhaseForm] = useState({
    phase_name: "",
    description: "",
    estimated_hours: "",
    assigned_staff_id: "",
    requires_haul_out: false,
  });
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showManualTimeSheet, setShowManualTimeSheet] = useState(false);
  const [manualTimeForm, setManualTimeForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showAddServiceSheet, setShowAddServiceSheet] = useState(false);
  const [addServiceForm, setAddServiceForm] = useState({ menuItemId: "", quantity: "1", unitPrice: "" });
  const [addingService, setAddingService] = useState(false);
  const [showReapprovalDialog, setShowReapprovalDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Parts tracking state
  const [partsByLineItem, setPartsByLineItem] = useState<Record<string, any[]>>({});
  const [addingPartForLineItem, setAddingPartForLineItem] = useState<string | null>(null);
  const [partForm, setPartForm] = useState({ itemId: "", quantity: "1", chargePrice: "" });
  const [submittingPart, setSubmittingPart] = useState(false);

  const fetchPartsForWorkOrder = useCallback(async (workOrderId: string) => {
    const { data, error } = await supabase
      .from("parts_pull_log" as any)
      .select("*, store_inventory:inventory_item_id(name)")
      .eq("work_order_id", workOrderId);
    if (error) {
      console.error("Error fetching parts:", error);
      return;
    }
    const grouped: Record<string, any[]> = {};
    for (const row of (data as any[]) || []) {
      const key = row.line_item_id || "__unlinked__";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }
    setPartsByLineItem(grouped);
  }, []);

  useEffect(() => {
    fetchWorkOrders();
  }, [business?.id]);

  useEffect(() => {
    if (selectedWorkOrder) {
      fetchPhases(selectedWorkOrder.id);
      fetchTimeEntries(selectedWorkOrder.id);
      fetchLineItems(selectedWorkOrder.id);
      if (storeEnabled) fetchPartsForWorkOrder(selectedWorkOrder.id);
    }
  }, [selectedWorkOrder?.id]);

  useEffect(() => {
    const findStaff = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const staff = serviceStaff.find(s => s.user_id === user.id);
        setCurrentStaffId(staff?.id || null);
        if (staff) {
          await getActiveEntry(staff.id);
        }
      }
    };
    findStaff();
  }, [serviceStaff]);

  const handleStatusProgression = useCallback(async (newStatus: string) => {
    if (!selectedWorkOrder || !business?.id) return;
    setUpdatingStatus(true);
    const { error, data } = await supabase
      .from("work_orders")
      .update({ status: newStatus } as any)
      .eq("id", selectedWorkOrder.id)
      .eq("business_id", business.id);
    if (error) {
      toast.error("Failed to update status");
      console.error("Status update error:", error, { workOrderId: selectedWorkOrder.id, businessId: business.id, newStatus });
    } else {
      const labels: Record<string, string> = {
        assigned: "Status set to Assigned",
        in_progress: "Work started",
        qc_review: "QC review requested",
        completed: "Work order completed",
        paid: "Marked as paid",
      };
      toast.success(labels[newStatus] || "Status updated");
      setSelectedWorkOrder({ ...selectedWorkOrder, status: newStatus });

      // Auto-generate invoice when completed
      if (newStatus === "completed") {
        try {
          // Fetch work order line items
          const { data: woLineItems, error: liError } = await supabase
            .from("work_order_line_items" as any)
            .select("*")
            .eq("work_order_id", selectedWorkOrder.id);

          if (liError) {
            console.error("Error fetching line items for invoice:", liError);
            throw liError;
          }

          const items = (woLineItems as any[]) || [];
          const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0);

          const ownerId = (selectedWorkOrder as any).boats?.owner_id || null;
          const guestCustomerId = (selectedWorkOrder as any).guest_customer_id || null;

          // Create invoice
          const { data: invoice, error: invError } = await supabase
            .from("invoices")
            .insert({
              work_order_id: selectedWorkOrder.id,
              business_id: business.id,
              boat_id: selectedWorkOrder.boat_id,
              owner_id: ownerId,
              guest_customer_id: guestCustomerId,
              status: "pending_review",
              total_amount: totalAmount,
            })
            .select("id")
            .single();

          if (invError) {
            console.error("Error creating invoice:", invError);
            throw invError;
          }

          // Insert invoice line items
          if (items.length > 0 && invoice) {
            const invoiceLines = items.map((item: any) => ({
              invoice_id: invoice.id,
              service_name: item.service_name,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
              total: Number(item.total),
              verified: false,
            }));

            const { error: linesError } = await supabase
              .from("invoice_line_items")
              .insert(invoiceLines);

            if (linesError) {
              console.error("Error creating invoice line items:", linesError);
              throw linesError;
            }
          }

          toast.success("Invoice generated and sent to customer for review.");
        } catch (invoiceErr) {
          console.error("Invoice generation failed:", invoiceErr);
          toast.error("Work order completed but invoice generation failed.");
        }
      }

      await fetchWorkOrders();
    }
    setUpdatingStatus(false);
  }, [selectedWorkOrder, business]);

  const fetchLineItems = useCallback(async (workOrderId: string) => {
    const { data, error } = await supabase
      .from("work_order_line_items" as any)
      .select("*")
      .eq("work_order_id", workOrderId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching line items:", error);
      return;
    }
    setLineItems((data as any[] || []).map((d: any) => ({
      id: d.id,
      work_order_id: d.work_order_id,
      service_name: d.service_name,
      unit_price: Number(d.unit_price),
      quantity: Number(d.quantity),
      total: Number(d.total),
      created_at: d.created_at,
    })));
  }, []);

  const fetchWorkOrders = async () => {
    if (!business?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("work_orders")
      .select("id, title, description, status, boat_id, provider_checked_in_at, guest_customer_id, boats(name, make, model, owner_id)")
      .eq("business_id", business.id)
      .in("status", ["pending", "pending_approval", "approved", "assigned", "in_progress", "qc_review", "completed", "paid", "cancelled"] as any[])
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching work orders:", error);
      setLoading(false);
      return;
    }

    const orders = (data as any[]) || [];

    const guestIds = orders.map(o => o.guest_customer_id).filter(Boolean);
    const ownerIds = orders.map(o => o.boats?.owner_id).filter(Boolean);

    let guestMap: Record<string, { owner_name: string; owner_email: string | null }> = {};
    if (guestIds.length > 0) {
      const { data: guests } = await (supabase
        .from("guest_customers" as any)
        .select("id, owner_name, owner_email")
        .in("id", guestIds) as any);
      if (guests) {
        for (const g of guests as any[]) {
          guestMap[g.id] = { owner_name: g.owner_name, owner_email: g.owner_email };
        }
      }
    }

    let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds);
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = { full_name: p.full_name, email: p.email };
        }
      }
    }

    const enriched: WorkOrder[] = orders.map(o => ({
      ...o,
      guest_customers: o.guest_customer_id ? guestMap[o.guest_customer_id] || null : null,
      owner_profile: o.boats?.owner_id ? profileMap[o.boats.owner_id] || null : null,
    }));

    setWorkOrders(enriched);
    setLoading(false);
  };

  const resendApprovalEmail = async (wo: WorkOrder) => {
    const { data: woData } = await supabase
      .from("work_orders")
      .select("approval_token, business_id, retail_price, materials_deposit, scheduled_date, title")
      .eq("id", wo.id)
      .single();

    if (!woData?.approval_token) {
      toast.error("No approval token found for this work order.");
      return;
    }

    let providerName = "Service Provider";
    if (woData.business_id) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("business_name")
        .eq("id", woData.business_id)
        .single();
      if (biz) providerName = biz.business_name;
    }

    const recipientEmail = wo.guest_customer_id
      ? wo.guest_customers?.owner_email
      : wo.owner_profile?.email;
    const recipientName = wo.guest_customer_id
      ? wo.guest_customers?.owner_name || "Customer"
      : wo.owner_profile?.full_name || "Customer";

    if (!recipientEmail) {
      toast.error("No email address found for this customer.");
      return;
    }

    await supabase.functions.invoke("send-owner-invite", {
      body: {
        providerName,
        ownerName: recipientName,
        ownerEmail: recipientEmail,
        boatName: wo.boats?.name || "your boat",
        serviceName: woData.title,
        basePrice: woData.retail_price,
        materialsDeposit: woData.materials_deposit || 0,
        totalPrice: woData.retail_price,
        scheduledDate: woData.scheduled_date || undefined,
        approvalToken: woData.approval_token,
      },
    });
  };

  const handleAddServiceConfirmed = async () => {
    if (!selectedWorkOrder) return;
    setAddingService(true);
    try {
      const menuItem = activeMenuItems.find(m => m.id === addServiceForm.menuItemId);
      const serviceName = menuItem?.name || "Service";
      const unitPrice = parseFloat(addServiceForm.unitPrice) || 0;
      const quantity = parseInt(addServiceForm.quantity) || 1;
      const lineTotal = unitPrice * quantity;

      // Insert line item
      const { error: insertErr } = await supabase
        .from("work_order_line_items" as any)
        .insert({
          work_order_id: selectedWorkOrder.id,
          service_name: serviceName,
          unit_price: unitPrice,
          quantity,
          total: lineTotal,
        } as any);

      if (insertErr) {
        toast.error("Failed to add service: " + insertErr.message);
        return;
      }

      // Recalculate total from all line items
      await fetchLineItems(selectedWorkOrder.id);
      const { data: allItems } = await supabase
        .from("work_order_line_items" as any)
        .select("total")
        .eq("work_order_id", selectedWorkOrder.id);
      const newTotal = (allItems as any[] || []).reduce((sum: number, item: any) => sum + Number(item.total), 0);

      // Update work order price and status
      const needsReapproval = !["pending", "pending_approval"].includes(selectedWorkOrder.status);
      
      await supabase
        .from("work_orders")
        .update({
          retail_price: newTotal,
          wholesale_price: newTotal,
          status: "pending_approval",
          approved_at: null,
        } as any)
        .eq("id", selectedWorkOrder.id);

      // Also update the quote record
      await supabase
        .from("quotes")
        .update({
          base_price: newTotal,
          total_owner_price: newTotal,
          total_provider_receives: newTotal,
        } as any)
        .eq("work_order_id", selectedWorkOrder.id);

      // Resend approval email
      await resendApprovalEmail(selectedWorkOrder);

      toast.success("Service added and approval email sent.");
      setShowAddServiceSheet(false);
      setAddServiceForm({ menuItemId: "", quantity: "1", unitPrice: "" });
      await fetchLineItems(selectedWorkOrder.id);
      await fetchWorkOrders();
      // Re-select the work order with fresh data
      setWorkOrders(prev => {
        const updated = prev.find(wo => wo.id === selectedWorkOrder.id);
        if (updated) setSelectedWorkOrder(updated);
        return prev;
      });
    } catch (err: any) {
      toast.error("Error adding service: " + err.message);
    } finally {
      setAddingService(false);
      setShowReapprovalDialog(false);
    }
  };

  const handleAddServiceClick = () => {
    if (!selectedWorkOrder) return;
    // If status is approved or later, show confirmation dialog
    if (!["pending", "pending_approval"].includes(selectedWorkOrder.status)) {
      setShowReapprovalDialog(true);
    } else {
      handleAddServiceConfirmed();
    }
  };

  const handleMenuItemSelect = (menuItemId: string) => {
    const item = activeMenuItems.find(m => m.id === menuItemId);
    setAddServiceForm({
      menuItemId,
      quantity: "1",
      unitPrice: item ? item.default_price.toString() : "",
    });
  };

  const handleAddPhase = async () => {
    if (!selectedWorkOrder) return;
    await createPhase(selectedWorkOrder.id, {
      phase_name: phaseForm.phase_name,
      description: phaseForm.description || null,
      estimated_hours: phaseForm.estimated_hours ? parseFloat(phaseForm.estimated_hours) : null,
      assigned_staff_id: phaseForm.assigned_staff_id || null,
      requires_haul_out: phaseForm.requires_haul_out,
      phase_number: phases.length + 1,
    });
    setShowPhaseSheet(false);
    setPhaseForm({ phase_name: "", description: "", estimated_hours: "", assigned_staff_id: "", requires_haul_out: false });
  };

  const handleAddManualEntry = async () => {
    if (!currentStaffId || !selectedWorkOrder || !manualTimeForm.date || !manualTimeForm.startTime || !manualTimeForm.endTime) return;
    if (!business?.id) return;
    const punchInStr = `${manualTimeForm.date}T${manualTimeForm.startTime}:00`;
    const punchOutStr = `${manualTimeForm.date}T${manualTimeForm.endTime}:00`;
    const { error } = await supabase
      .from("time_entries")
      .insert({
        business_id: business.id,
        service_staff_id: currentStaffId,
        work_order_id: selectedWorkOrder.id,
        punch_in: new Date(punchInStr).toISOString(),
        punch_out: new Date(punchOutStr).toISOString(),
        break_minutes: 0,
        notes: manualTimeForm.notes || null,
      });
    if (error) {
      console.error("Error adding manual time entry:", error);
      return;
    }
    setShowManualTimeSheet(false);
    setManualTimeForm({ date: "", startTime: "", endTime: "", notes: "" });
    await fetchTimeEntries(selectedWorkOrder.id);
  };

  const handlePunchIn = async () => {
    if (!selectedWorkOrder || !business?.id) return;
    let staffId = currentStaffId;
    if (!staffId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      const staffName = profile?.full_name || profile?.email || "Staff";
      const { data: newStaff, error } = await supabase
        .from("service_staff")
        .insert({
          business_id: business.id,
          user_id: user.id,
          staff_name: staffName,
          specialties: ["general"],
          internal_hourly_rate: 0,
          billable_hourly_rate: 0,
          is_active: true,
        })
        .select()
        .single();
      if (error) {
        console.error("Error creating staff record:", error);
        toast.error("Failed to check in");
        return;
      }
      staffId = newStaff.id;
      setCurrentStaffId(staffId);
    }
    await punchIn(staffId, selectedWorkOrder.id);
    if (selectedWorkOrder.status === "assigned") {
      await handleStatusProgression("in_progress");
    }
  };

  const handlePunchOut = async () => {
    if (!activeTimeEntry || !selectedWorkOrder) return;
    await punchOut(activeTimeEntry.id, selectedWorkOrder.id);
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending_approval: { label: "Awaiting Approval", className: "bg-amber-100 text-amber-800 border-amber-300" },
    pending: { label: "Awaiting Approval", className: "bg-amber-100 text-amber-800 border-amber-300" },
    approved: { label: "Approved", className: "bg-blue-100 text-blue-800 border-blue-300" },
    assigned: { label: "Assigned", className: "bg-blue-100 text-blue-800 border-blue-300" },
    in_progress: { label: "In Progress", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    qc_review: { label: "QC Review", className: "bg-violet-100 text-violet-800 border-violet-300" },
    completed: { label: "Completed", className: "bg-gray-100 text-gray-600 border-gray-300" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-300" },
    paid: { label: "Paid", className: "bg-green-100 text-green-800 border-green-300" },
  };

  const statusOptions = [
    { value: "assigned", label: "Assigned", activeClass: "bg-blue-100 text-blue-800 border-blue-300" },
    { value: "in_progress", label: "In Progress", activeClass: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    { value: "qc_review", label: "QC Review", activeClass: "bg-violet-100 text-violet-800 border-violet-300" },
    { value: "completed", label: "Completed", activeClass: "bg-gray-100 text-gray-600 border-gray-300" },
  ];

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800 border-gray-300" };
    return (
      <Badge className={`${config.className} border font-semibold text-xs px-2.5 py-1`}>
        {config.label}
      </Badge>
    );
  };

  const calculateElapsedTime = () => {
    if (!activeTimeEntry) return "00:00";
    const mins = differenceInMinutes(new Date(), new Date(activeTimeEntry.punch_in));
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const lineItemsSubtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const computedAddTotal = (parseFloat(addServiceForm.unitPrice) || 0) * (parseInt(addServiceForm.quantity) || 1);

  if (loading) {
    return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <FilePlus className="w-4 h-4 mr-2" />
          New Work Order
        </Button>
      </div>

      <CreateWorkOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchWorkOrders}
      />

      <div className="grid md:grid-cols-2 gap-4">
      {/* Work Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Work Orders</CardTitle>
              <CardDescription>Select a job to manage phases and time</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {workOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No active work orders</p>
          ) : (
            workOrders.map((wo) => (
              <div
                key={wo.id}
                className={`p-3 border rounded-lg transition-colors ${
                  selectedWorkOrder?.id === wo.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
              >
                <div
                  onClick={() => setSelectedWorkOrder(wo)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{wo.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {wo.boats?.name || "Unknown Boat"}
                      {" · "}
                      {wo.guest_customer_id
                        ? wo.guest_customers?.owner_name || "Guest"
                        : wo.owner_profile?.full_name || "Owner"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {getStatusBadge(wo.status)}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Selected Work Order Details */}
      <div className="space-y-4">
        {selectedWorkOrder ? (
          <>
            {/* Customer & Job Info */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedWorkOrder.title}
                  </CardTitle>
                  {selectedWorkOrder.status !== "paid" && (
                    <Button size="sm" variant="outline" onClick={() => setShowEditSheet(true)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedWorkOrder.guest_customer_id
                      ? selectedWorkOrder.guest_customers?.owner_name || "Unknown Guest"
                      : selectedWorkOrder.owner_profile?.full_name || selectedWorkOrder.owner_profile?.email || "Unknown Owner"}
                  </span>
                  {selectedWorkOrder.guest_customer_id && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600">
                      Guest Customer
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedWorkOrder.boats?.name || "Unknown Boat"}
                  {selectedWorkOrder.boats?.make && ` · ${selectedWorkOrder.boats.make}`}
                  {selectedWorkOrder.boats?.model && ` ${selectedWorkOrder.boats.model}`}
                </div>
                {selectedWorkOrder.description && (
                  <p className="text-sm text-muted-foreground pt-1">{selectedWorkOrder.description}</p>
                )}
                {/* Status Selector */}
                {selectedWorkOrder.status === "paid" ? (
                  <Badge className="bg-green-100 text-green-800 border-green-300 border font-semibold text-xs px-2.5 py-1 mt-2">
                    Paid
                  </Badge>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {statusOptions.map((opt) => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={selectedWorkOrder.status === opt.value ? "default" : "outline"}
                        className={
                          selectedWorkOrder.status === opt.value
                            ? `${opt.activeClass} border font-semibold hover:opacity-90`
                            : "text-muted-foreground"
                        }
                        disabled={updatingStatus || selectedWorkOrder.status === opt.value}
                        onClick={() => handleStatusProgression(opt.value)}
                      >
                        {updatingStatus ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}
                {selectedWorkOrder.status === "completed" && (
                  <Button
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    disabled={updatingStatus}
                    onClick={() => handleStatusProgression("paid")}
                  >
                    {updatingStatus ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Mark as Paid
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Services / Line Items */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Services
                  </CardTitle>
                  <Sheet open={showAddServiceSheet} onOpenChange={setShowAddServiceSheet}>
                    <SheetTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Service
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Add Service</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Service</Label>
                          <Select
                            value={addServiceForm.menuItemId}
                            onValueChange={handleMenuItemSelect}
                          >
                            <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                            <SelectContent>
                              {activeMenuItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} — {formatPrice(item.default_price)}
                                  {item.pricing_model === "hourly" ? "/hr" : item.pricing_model === "per_foot" ? "/ft" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Unit Price ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={addServiceForm.unitPrice}
                            onChange={e => setAddServiceForm(f => ({ ...f, unitPrice: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={addServiceForm.quantity}
                            onChange={e => setAddServiceForm(f => ({ ...f, quantity: e.target.value }))}
                          />
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm font-medium">
                          <span>Line Total</span>
                          <span>{formatPrice(computedAddTotal)}</span>
                        </div>
                        <Button
                          onClick={handleAddServiceClick}
                          disabled={!addServiceForm.menuItemId || addingService}
                          className="w-full"
                        >
                          {addingService && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Add to Work Order
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              <CardContent>
                {lineItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No services added</p>
                ) : (
                  <div className="space-y-2">
                    {lineItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium">{item.service_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.unit_price)} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-medium">{formatPrice(item.total)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold pt-1">
                      <span>Subtotal</span>
                      <span>{formatPrice(lineItemsSubtotal)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Clock */}
            <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Time Clock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {activeTimeEntry && activeTimeEntry.work_order_id === selectedWorkOrder.id ? (
                      <>
                        <WorkTimer startTime={activeTimeEntry.punch_in} isRunning={true} />
                        <Button variant="destructive" onClick={handlePunchOut}>
                          <Pause className="w-4 h-4 mr-2" />
                          Check Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handlePunchIn} disabled={!!activeTimeEntry}>
                          <Play className="w-4 h-4 mr-2" />
                          Check In
                        </Button>
                        {activeTimeEntry && activeTimeEntry.work_order_id !== selectedWorkOrder.id && (
                          <p className="text-sm text-amber-600">Currently checked in on another job</p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

            {/* Phases */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Job Phases</CardTitle>
                  <Sheet open={showPhaseSheet} onOpenChange={setShowPhaseSheet}>
                    <SheetTrigger asChild>
                      <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Phase</Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Add Phase</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Phase Name</Label>
                          <Input
                            value={phaseForm.phase_name}
                            onChange={(e) => setPhaseForm({ ...phaseForm, phase_name: e.target.value })}
                            placeholder="e.g., Haul Out, Bottom Paint"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={phaseForm.description}
                            onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Estimated Hours</Label>
                          <Input
                            type="number"
                            value={phaseForm.estimated_hours}
                            onChange={(e) => setPhaseForm({ ...phaseForm, estimated_hours: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Assign Staff</Label>
                          <Select
                            value={phaseForm.assigned_staff_id}
                            onValueChange={(v) => setPhaseForm({ ...phaseForm, assigned_staff_id: v })}
                          >
                            <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                            <SelectContent>
                              {serviceStaff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.staff_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddPhase} disabled={!phaseForm.phase_name} className="w-full">
                          Add Phase
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              <CardContent>
                {phases.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No phases defined</p>
                ) : (
                  <div className="space-y-2">
                    {phases.map((phase, idx) => (
                      <div key={phase.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{phase.phase_name}</p>
                            {phase.assigned_staff && (
                              <p className="text-xs text-muted-foreground">{(phase.assigned_staff as any).staff_name}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={phase.status === "completed" ? "default" : "outline"}>
                          {phase.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Time Entries */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Time Log</CardTitle>
                  {(
                    <Sheet open={showManualTimeSheet} onOpenChange={setShowManualTimeSheet}>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          <PlusCircle className="w-4 h-4 mr-1" />
                          Add Entry
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Add Manual Time Entry</SheetTitle>
                        </SheetHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={manualTimeForm.date}
                              onChange={(e) => setManualTimeForm({ ...manualTimeForm, date: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={manualTimeForm.startTime}
                              onChange={(e) => setManualTimeForm({ ...manualTimeForm, startTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={manualTimeForm.endTime}
                              onChange={(e) => setManualTimeForm({ ...manualTimeForm, endTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Notes (optional)</Label>
                            <Textarea
                              value={manualTimeForm.notes}
                              onChange={(e) => setManualTimeForm({ ...manualTimeForm, notes: e.target.value })}
                              placeholder="What was worked on..."
                            />
                          </div>
                          <Button
                            onClick={handleAddManualEntry}
                            disabled={!manualTimeForm.date || !manualTimeForm.startTime || !manualTimeForm.endTime}
                            className="w-full"
                          >
                            Add Entry
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {timeEntries.filter(e => e.work_order_id === selectedWorkOrder.id).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No time logged</p>
                ) : (
                  <div className="space-y-2">
                    {timeEntries
                      .filter(e => e.work_order_id === selectedWorkOrder.id)
                      .slice(0, 5)
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium">{(entry.staff as any)?.staff_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.punch_in), "MMM d, h:mm a")}
                              {entry.punch_out && ` - ${format(new Date(entry.punch_out), "h:mm a")}`}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {entry.totalHours != null ? `${entry.totalHours.toFixed(1)}h` : "Active"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Select a work order to view details
            </CardContent>
          </Card>
        )}
      </div>
      </div>
      {selectedWorkOrder && (
        <EditWorkOrderSheet
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
          workOrder={selectedWorkOrder}
          onSaved={async () => {
            const prevId = selectedWorkOrder.id;
            await fetchWorkOrders();
            setWorkOrders(prev => {
              const updated = prev.find(wo => wo.id === prevId);
              if (updated) setSelectedWorkOrder(updated);
              return prev;
            });
          }}
        />
      )}

      {/* Re-approval confirmation dialog */}
      <AlertDialog open={showReapprovalDialog} onOpenChange={setShowReapprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-approval Required</AlertDialogTitle>
            <AlertDialogDescription>
              This work order has already been approved. Adding a service will change the price and require the customer to re-approve. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddServiceConfirmed} disabled={addingService}>
              {addingService && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
