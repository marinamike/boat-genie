import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { toast } from "sonner";
import { differenceInDays, differenceInMinutes, format } from "date-fns";

// Types
export type ServiceSpecialty = 
  | "diesel_mechanic" | "outboard_mechanic" | "electrician" | "electronics"
  | "fiberglass" | "gelcoat" | "painter" | "canvas" | "detailer" 
  | "rigger" | "welder" | "carpenter" | "general";

export type PhaseStatus = "pending" | "in_progress" | "completed" | "blocked";

export interface ServiceStaff {
  id: string;
  business_id: string;
  user_id: string;
  staff_name: string;
  specialties: ServiceSpecialty[];
  internal_hourly_rate: number;
  billable_hourly_rate: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderPhase {
  id: string;
  business_id: string;
  work_order_id: string;
  phase_number: number;
  phase_name: string;
  description: string | null;
  estimated_hours: number | null;
  actual_hours: number;
  status: PhaseStatus;
  assigned_staff_id: string | null;
  requires_haul_out: boolean;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_staff?: ServiceStaff;
}

export interface TimeEntry {
  id: string;
  business_id: string;
  service_staff_id: string;
  work_order_id: string;
  phase_id: string | null;
  punch_in: string;
  punch_out: string | null;
  break_minutes: number;
  notes: string | null;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
  staff?: ServiceStaff;
  totalHours?: number;
}

export interface YardEquipment {
  id: string;
  business_id: string;
  equipment_name: string;
  equipment_type: string;
  max_capacity_lbs: number | null;
  max_beam_ft: number | null;
  is_available: boolean;
  notes: string | null;
}

export interface HaulOutBay {
  id: string;
  business_id: string;
  bay_name: string;
  max_length_ft: number | null;
  max_beam_ft: number | null;
  is_available: boolean;
  notes: string | null;
}

export interface YardCalendarEvent {
  id: string;
  business_id: string;
  work_order_id: string | null;
  boat_id: string;
  event_type: string;
  equipment_id: string | null;
  bay_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  assigned_operator_id: string | null;
  notes: string | null;
  boat?: { name: string; make: string | null; model: string | null };
  equipment?: YardEquipment;
  bay?: HaulOutBay;
}

export interface BoatOnBlocks {
  id: string;
  business_id: string;
  boat_id: string;
  work_order_id: string | null;
  bay_id: string | null;
  yard_location: string | null;
  hauled_at: string;
  expected_launch: string | null;
  launched_at: string | null;
  notes: string | null;
  daysInYard?: number;
  boat?: { 
    id: string;
    name: string; 
    make: string | null; 
    model: string | null;
    length_ft: number | null;
    owner_id: string;
  };
  bay?: HaulOutBay;
}

export interface QCChecklistTemplate {
  id: string;
  business_id: string;
  template_name: string;
  job_type: string;
  checklist_items: { item: string; required_photo: boolean }[];
  is_active: boolean;
}

export interface QCInspection {
  id: string;
  business_id: string;
  work_order_id: string;
  phase_id: string | null;
  template_id: string | null;
  submitted_by: string;
  completed_items: { item_id: number; checked: boolean; photo_url?: string; notes?: string }[];
  all_items_passed: boolean;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_status: string;
  review_notes: string | null;
}

export interface PartsPull {
  id: string;
  business_id: string;
  work_order_id: string;
  phase_id: string | null;
  inventory_item_id: string | null;
  pulled_by: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  notes: string | null;
  pulled_at: string;
  totalCost?: number;
  totalPrice?: number;
}

export interface ServiceInvoice {
  id: string;
  business_id: string;
  work_order_id: string;
  invoice_number: string;
  owner_id: string;
  boat_id: string;
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
  sent_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
}

// Helper to calculate total hours from time entry
function calculateTotalHours(punchIn: string, punchOut: string | null, breakMinutes: number): number | null {
  if (!punchOut) return null;
  const mins = differenceInMinutes(new Date(punchOut), new Date(punchIn)) - breakMinutes;
  return Math.max(0, mins / 60);
}

export interface ServiceWorkOrder {
  id: string;
  title: string;
  status: string;
  boat_id: string;
  wholesale_price: number | null;
  lead_fee: number | null;
  completed_at: string | null;
  funds_released_at: string | null;
  boat_name: string;
}

export function useServiceManagement() {
  const { business } = useBusiness();
  const [serviceStaff, setServiceStaff] = useState<ServiceStaff[]>([]);
  const [phases, setPhases] = useState<WorkOrderPhase[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [equipment, setEquipment] = useState<YardEquipment[]>([]);
  const [bays, setBays] = useState<HaulOutBay[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<YardCalendarEvent[]>([]);
  const [boatsOnBlocks, setBoatsOnBlocks] = useState<BoatOnBlocks[]>([]);
  const [qcTemplates, setQCTemplates] = useState<QCChecklistTemplate[]>([]);
  const [qcInspections, setQCInspections] = useState<QCInspection[]>([]);
  const [partsPulls, setPartsPulls] = useState<PartsPull[]>([]);
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [workOrders, setWorkOrders] = useState<ServiceWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);

  // ============ FETCH FUNCTIONS ============
  const fetchServiceStaff = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("service_staff")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("staff_name");
    if (error) console.error("Error fetching service staff:", error);
    else setServiceStaff(data || []);
  }, [business?.id]);

  const fetchEquipment = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("yard_equipment")
      .select("*")
      .eq("business_id", business.id)
      .order("equipment_name");
    if (error) console.error("Error fetching equipment:", error);
    else setEquipment(data || []);
  }, [business?.id]);

  const fetchBays = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("haul_out_bays")
      .select("*")
      .eq("business_id", business.id)
      .order("bay_name");
    if (error) console.error("Error fetching bays:", error);
    else setBays(data || []);
  }, [business?.id]);

  const fetchCalendarEvents = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("yard_calendar")
      .select(`
        *,
        boat:boats(name, make, model),
        equipment:yard_equipment(equipment_name, equipment_type),
        bay:haul_out_bays(bay_name)
      `)
      .eq("business_id", business.id)
      .order("scheduled_start", { ascending: true });
    if (error) console.error("Error fetching calendar:", error);
    else setCalendarEvents((data as any) || []);
  }, [business?.id]);

  const fetchBoatsOnBlocks = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("boats_on_blocks")
      .select(`
        *,
        boat:boats(id, name, make, model, length_ft, owner_id),
        bay:haul_out_bays(bay_name)
      `)
      .eq("business_id", business.id)
      .is("launched_at", null)
      .order("hauled_at", { ascending: false });
    if (error) console.error("Error fetching boats on blocks:", error);
    else {
      const withDays = (data || []).map((b: any) => ({
        ...b,
        daysInYard: differenceInDays(new Date(), new Date(b.hauled_at)),
      }));
      setBoatsOnBlocks(withDays);
    }
  }, [business?.id]);

  const fetchQCTemplates = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("qc_checklist_templates")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("template_name");
    if (error) console.error("Error fetching QC templates:", error);
    else setQCTemplates((data as any) || []);
  }, [business?.id]);

  const fetchTimeEntries = useCallback(async (workOrderId?: string) => {
    if (!business?.id) return;
    let query = supabase
      .from("time_entries")
      .select(`*, staff:service_staff(staff_name, billable_hourly_rate)`)
      .eq("business_id", business.id)
      .order("punch_in", { ascending: false })
      .limit(100);
    
    if (workOrderId) query = query.eq("work_order_id", workOrderId);
    
    const { data, error } = await query;
    if (error) console.error("Error fetching time entries:", error);
    else {
      const withHours = (data || []).map((e: any) => ({
        ...e,
        totalHours: calculateTotalHours(e.punch_in, e.punch_out, e.break_minutes),
      }));
      setTimeEntries(withHours);
    }
  }, [business?.id]);

  const fetchPhases = useCallback(async (workOrderId: string) => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("work_order_phases")
      .select(`*, assigned_staff:service_staff(staff_name)`)
      .eq("work_order_id", workOrderId)
      .order("phase_number");
    if (error) console.error("Error fetching phases:", error);
    else setPhases((data as any) || []);
  }, [business?.id]);

  const fetchWorkOrders = useCallback(async () => {
    if (!business?.id) return;
    const { data, error } = await supabase
      .from("work_orders")
      .select("id, title, status, boat_id, wholesale_price, lead_fee, completed_at, funds_released_at, boats(name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching work orders:", error);
    else {
      setWorkOrders((data || []).map((wo: any) => ({
        ...wo,
        boat_name: wo.boats?.name || "Unknown",
      })));
    }
  }, [business?.id]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchServiceStaff(),
      fetchEquipment(),
      fetchBays(),
      fetchCalendarEvents(),
      fetchBoatsOnBlocks(),
      fetchQCTemplates(),
      fetchTimeEntries(),
      fetchWorkOrders(),
    ]);
    setLoading(false);
  }, [fetchServiceStaff, fetchEquipment, fetchBays, fetchCalendarEvents, fetchBoatsOnBlocks, fetchQCTemplates, fetchTimeEntries, fetchWorkOrders]);

  useEffect(() => {
    refreshAll();

    // Subscribe to realtime work_orders changes for this business
    if (!business?.id) return;
    const channel = supabase
      .channel(`work_orders_${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "work_orders",
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          // Refetch work orders on any change (insert, update, delete)
          fetchWorkOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAll, business?.id, fetchWorkOrders]);

  // ============ SERVICE STAFF CRUD ============
  const createServiceStaff = async (data: Partial<ServiceStaff>) => {
    if (!business?.id) return null;
    const { data: result, error } = await supabase
      .from("service_staff")
      .insert({ ...data, business_id: business.id } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to create staff: " + error.message); return null; }
    toast.success("Staff member added");
    await fetchServiceStaff();
    return result;
  };

  const updateServiceStaff = async (id: string, data: Partial<ServiceStaff>) => {
    const { error } = await supabase.from("service_staff").update(data as any).eq("id", id);
    if (error) { toast.error("Failed to update staff: " + error.message); return false; }
    toast.success("Staff updated");
    await fetchServiceStaff();
    return true;
  };

  // ============ WORK ORDER PHASES ============
  const createPhase = async (workOrderId: string, data: Partial<WorkOrderPhase>) => {
    if (!business?.id) return null;
    const { data: result, error } = await supabase
      .from("work_order_phases")
      .insert({ ...data, business_id: business.id, work_order_id: workOrderId } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to create phase: " + error.message); return null; }
    toast.success("Phase added");
    await fetchPhases(workOrderId);
    return result;
  };

  const updatePhase = async (id: string, workOrderId: string, data: Partial<WorkOrderPhase>) => {
    const { error } = await supabase.from("work_order_phases").update(data as any).eq("id", id);
    if (error) { toast.error("Failed to update phase: " + error.message); return false; }
    toast.success("Phase updated");
    await fetchPhases(workOrderId);
    return true;
  };

  // ============ TIME TRACKING ============
  const punchIn = async (staffId: string, workOrderId: string, phaseId?: string) => {
    if (!business?.id) return null;
    const { data: result, error } = await supabase
      .from("time_entries")
      .insert({
        business_id: business.id,
        service_staff_id: staffId,
        work_order_id: workOrderId,
        phase_id: phaseId || null,
        punch_in: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) { toast.error("Failed to punch in: " + error.message); return null; }
    toast.success("Punched in");
    setActiveTimeEntry(result);
    await fetchTimeEntries(workOrderId);
    return result;
  };

  const punchOut = async (entryId: string, workOrderId: string, breakMinutes = 0, notes?: string) => {
    const { error } = await supabase
      .from("time_entries")
      .update({
        punch_out: new Date().toISOString(),
        break_minutes: breakMinutes,
        notes,
      })
      .eq("id", entryId);
    if (error) { toast.error("Failed to punch out: " + error.message); return false; }
    toast.success("Punched out");
    setActiveTimeEntry(null);
    await fetchTimeEntries(workOrderId);
    return true;
  };

  const getActiveEntry = async (staffId: string): Promise<TimeEntry | null> => {
    if (!business?.id) return null;
    const { data } = await supabase
      .from("time_entries")
      .select("*")
      .eq("business_id", business.id)
      .eq("service_staff_id", staffId)
      .is("punch_out", null)
      .single();
    setActiveTimeEntry(data || null);
    return data || null;
  };

  // ============ YARD EQUIPMENT ============
  const createEquipment = async (data: Partial<YardEquipment>) => {
    if (!business?.id) return null;
    const { data: result, error } = await supabase
      .from("yard_equipment")
      .insert({ ...data, business_id: business.id } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to create equipment: " + error.message); return null; }
    toast.success("Equipment added");
    await fetchEquipment();
    return result;
  };

  const createBay = async (data: Partial<HaulOutBay>) => {
    if (!business?.id) return null;
    const { data: result, error } = await supabase
      .from("haul_out_bays")
      .insert({ ...data, business_id: business.id } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to create bay: " + error.message); return null; }
    toast.success("Bay added");
    await fetchBays();
    return result;
  };

  // ============ YARD CALENDAR ============
  const checkConflict = async (
    equipmentId: string | null,
    bayId: string | null,
    start: Date,
    end: Date,
    excludeEventId?: string
  ): Promise<boolean> => {
    if (!business?.id || (!equipmentId && !bayId)) return false;
    
    let query = supabase
      .from("yard_calendar")
      .select("id")
      .eq("business_id", business.id)
      .neq("status", "cancelled")
      .lt("scheduled_start", end.toISOString())
      .gt("scheduled_end", start.toISOString());

    if (equipmentId) query = query.eq("equipment_id", equipmentId);
    if (bayId) query = query.eq("bay_id", bayId);
    if (excludeEventId) query = query.neq("id", excludeEventId);

    const { data, error } = await query;
    if (error) { console.error("Error checking conflict:", error); return false; }
    return (data?.length || 0) > 0;
  };

  const scheduleEvent = async (data: Partial<YardCalendarEvent>) => {
    if (!business?.id) return null;

    // Check for conflicts
    const hasConflict = await checkConflict(
      data.equipment_id || null,
      data.bay_id || null,
      new Date(data.scheduled_start!),
      new Date(data.scheduled_end!)
    );

    if (hasConflict) {
      toast.error("Schedule conflict: Equipment or bay is already booked for this time.");
      return null;
    }

    const { data: result, error } = await supabase
      .from("yard_calendar")
      .insert({ ...data, business_id: business.id } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to schedule: " + error.message); return null; }
    toast.success("Event scheduled");
    await fetchCalendarEvents();
    return result;
  };

  const updateCalendarEvent = async (id: string, data: Partial<YardCalendarEvent>) => {
    // Check for conflicts if dates changed
    if (data.scheduled_start || data.scheduled_end || data.equipment_id || data.bay_id) {
      const existing = calendarEvents.find(e => e.id === id);
      if (existing) {
        const hasConflict = await checkConflict(
          data.equipment_id || existing.equipment_id,
          data.bay_id || existing.bay_id,
          new Date(data.scheduled_start || existing.scheduled_start),
          new Date(data.scheduled_end || existing.scheduled_end),
          id
        );
        if (hasConflict) {
          toast.error("Schedule conflict: Equipment or bay is already booked for this time.");
          return false;
        }
      }
    }

    const { error } = await supabase.from("yard_calendar").update(data as any).eq("id", id);
    if (error) { toast.error("Failed to update event: " + error.message); return false; }
    toast.success("Event updated");
    await fetchCalendarEvents();
    return true;
  };

  // ============ BOATS ON BLOCKS ============
  const recordHaulOut = async (boatId: string, bayId?: string, workOrderId?: string, yardLocation?: string) => {
    if (!business?.id) return null;
    const { data: result, error } = await supabase
      .from("boats_on_blocks")
      .insert({
        business_id: business.id,
        boat_id: boatId,
        bay_id: bayId || null,
        work_order_id: workOrderId || null,
        yard_location: yardLocation || null,
        hauled_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) { toast.error("Failed to record haul out: " + error.message); return null; }
    toast.success("Boat hauled out and on blocks");
    await fetchBoatsOnBlocks();
    return result;
  };

  const recordLaunch = async (blockRecordId: string) => {
    const { error } = await supabase
      .from("boats_on_blocks")
      .update({ launched_at: new Date().toISOString() })
      .eq("id", blockRecordId);
    if (error) { toast.error("Failed to record launch: " + error.message); return false; }
    toast.success("Boat launched");
    await fetchBoatsOnBlocks();
    return true;
  };

  // ============ QC TEMPLATES ============
  const createQCTemplate = async (data: Partial<QCChecklistTemplate>) => {
    if (!business?.id) return null;
    const { data: result, error } = await supabase
      .from("qc_checklist_templates")
      .insert({ ...data, business_id: business.id } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to create template: " + error.message); return null; }
    toast.success("QC template created");
    await fetchQCTemplates();
    return result;
  };

  // ============ GENERATE INVOICE ============
  const generateInvoice = async (workOrderId: string, boatId: string, ownerId: string) => {
    if (!business?.id) return null;

    // Get time entries for this work order
    const { data: entries } = await supabase
      .from("time_entries")
      .select("*, staff:service_staff(billable_hourly_rate)")
      .eq("work_order_id", workOrderId)
      .not("punch_out", "is", null);

    // Get parts pulls
    const { data: pulls } = await supabase
      .from("parts_pulls")
      .select("*")
      .eq("work_order_id", workOrderId);

    // Get boat on blocks record
    const { data: blockRecord } = await supabase
      .from("boats_on_blocks")
      .select("*")
      .eq("work_order_id", workOrderId)
      .maybeSingle();

    // Calculate totals
    let totalLaborHours = 0;
    let laborTotal = 0;
    (entries || []).forEach((e: any) => {
      const hours = calculateTotalHours(e.punch_in, e.punch_out, e.break_minutes) || 0;
      totalLaborHours += hours;
      laborTotal += hours * (e.staff?.billable_hourly_rate || 0);
    });

    const partsTotal = (pulls || []).reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
    const storageDays = blockRecord ? differenceInDays(
      blockRecord.launched_at ? new Date(blockRecord.launched_at) : new Date(),
      new Date(blockRecord.hauled_at)
    ) : 0;

    const subtotal = laborTotal + partsTotal;
    const taxAmount = subtotal * 0; // Tax rate can be configured
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const { data: invoice, error } = await supabase
      .from("service_invoices")
      .insert({
        business_id: business.id,
        work_order_id: workOrderId,
        invoice_number: invoiceNumber,
        owner_id: ownerId,
        boat_id: boatId,
        labor_hours: totalLaborHours,
        labor_rate: serviceStaff[0]?.billable_hourly_rate || 0,
        labor_total: laborTotal,
        parts_total: partsTotal,
        storage_days: storageDays,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: "draft",
      })
      .select()
      .single();

    if (error) { toast.error("Failed to generate invoice: " + error.message); return null; }

    // Create unified customer invoice entry
    const sourceRef = `Service Invoice #${invoiceNumber}`;
    await supabase
      .from("customer_invoices")
      .insert({
        customer_id: ownerId,
        business_id: business.id,
        source_type: "service",
        source_id: invoice.id,
        source_reference: sourceRef,
        invoice_number: invoiceNumber,
        amount: totalAmount,
        status: "pending",
      });

    toast.success("Invoice generated");
    return invoice;
  };

  // Computed metrics
  const activeJobsCount = workOrders.filter(wo => ["assigned", "in_progress"].includes(wo.status)).length;
  const pendingQuotesCount = workOrders.filter(wo => wo.status === "pending").length;
  const completedWorkOrders = workOrders.filter(wo => ["completed", "paid"].includes(wo.status));
  const totalEarnings = completedWorkOrders
    .filter(wo => wo.status === "paid")
    .reduce((sum, wo) => sum + (wo.wholesale_price || 0), 0);

  return {
    // Data
    serviceStaff,
    phases,
    timeEntries,
    equipment,
    bays,
    calendarEvents,
    boatsOnBlocks,
    qcTemplates,
    qcInspections,
    partsPulls,
    invoices,
    workOrders,
    loading,
    activeTimeEntry,

    // Computed
    activeJobsCount,
    pendingQuotesCount,
    completedWorkOrders,
    totalEarnings,

    // Actions
    refreshAll,
    fetchPhases,
    fetchTimeEntries,

    // Service Staff
    createServiceStaff,
    updateServiceStaff,

    // Phases
    createPhase,
    updatePhase,

    // Time Tracking
    punchIn,
    punchOut,
    getActiveEntry,

    // Equipment & Bays
    createEquipment,
    createBay,

    // Calendar
    scheduleEvent,
    updateCalendarEvent,
    checkConflict,

    // Boats on Blocks
    recordHaulOut,
    recordLaunch,

    // QC
    createQCTemplate,

    // Invoice
    generateInvoice,
  };
}
