import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Play, Pause, Clock, ChevronRight, FilePlus, MapPin } from "lucide-react";
import { CreateWorkOrderDialog } from "@/components/provider/CreateWorkOrderDialog";
import { ManualCheckInDialog } from "@/components/provider/ManualCheckInDialog";
import { WorkTimer } from "@/components/provider/WorkTimer";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { format, differenceInMinutes } from "date-fns";
import type { useServiceManagement } from "@/hooks/useServiceManagement";

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  status: string;
  boat_id: string;
  provider_checked_in_at: string | null;
  boats?: { name: string; make: string | null; model: string | null; owner_id: string };
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
  const { business } = useBusiness();
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
  const [checkInWorkOrder, setCheckInWorkOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    fetchWorkOrders();
  }, [business?.id]);

  useEffect(() => {
    if (selectedWorkOrder) {
      fetchPhases(selectedWorkOrder.id);
      fetchTimeEntries(selectedWorkOrder.id);
    }
  }, [selectedWorkOrder?.id]);

  useEffect(() => {
    // Get current staff id based on logged-in user
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

  const fetchWorkOrders = async () => {
    if (!business?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("work_orders")
      .select("id, title, description, status, boat_id, provider_checked_in_at, boats(name, make, model, owner_id)")
      .eq("business_id", business.id)
      .in("status", ["pending", "assigned", "in_progress"])
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching work orders:", error);
    else setWorkOrders((data as any) || []);
    setLoading(false);
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

  const handlePunchIn = async () => {
    if (!currentStaffId || !selectedWorkOrder) return;
    await punchIn(currentStaffId, selectedWorkOrder.id);
  };

  const handlePunchOut = async () => {
    if (!activeTimeEntry || !selectedWorkOrder) return;
    await punchOut(activeTimeEntry.id, selectedWorkOrder.id);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      ready_for_qc: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const calculateElapsedTime = () => {
    if (!activeTimeEntry) return "00:00";
    const mins = differenceInMinutes(new Date(), new Date(activeTimeEntry.punch_in));
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

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

      <CreateServiceWorkOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={fetchWorkOrders}
        serviceStaff={serviceStaff.map(s => ({ id: s.id, staff_name: s.staff_name }))}
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
                  <div>
                    <p className="font-medium">{wo.title}</p>
                    <p className="text-sm text-muted-foreground">{wo.boats?.name || "Unknown Boat"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(wo.status)}>{wo.status.replace("_", " ")}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                {/* Check In & Work Timer for active work orders */}
                {(wo.status === "assigned" || wo.status === "in_progress") && (
                  <div className="mt-2 flex items-center gap-2 pt-2 border-t">
                    {wo.provider_checked_in_at ? (
                      <WorkTimer startTime={wo.provider_checked_in_at} isRunning={wo.status === "in_progress"} />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCheckInWorkOrder(wo);
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        Check In
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Selected Work Order Details */}
      <div className="space-y-4">
        {selectedWorkOrder ? (
          <>
            {/* Time Clock */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Time Clock</CardTitle>
              </CardHeader>
              <CardContent>
                {currentStaffId ? (
                  <div className="flex items-center gap-4">
                    {activeTimeEntry && activeTimeEntry.work_order_id === selectedWorkOrder.id ? (
                      <>
                        <div className="flex items-center gap-2 text-lg font-mono">
                          <Clock className="w-5 h-5 text-green-500 animate-pulse" />
                          {calculateElapsedTime()}
                        </div>
                        <Button variant="destructive" onClick={handlePunchOut}>
                          <Pause className="w-4 h-4 mr-2" />
                          Punch Out
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handlePunchIn} disabled={!!activeTimeEntry}>
                        <Play className="w-4 h-4 mr-2" />
                        Punch In
                      </Button>
                    )}
                    {activeTimeEntry && activeTimeEntry.work_order_id !== selectedWorkOrder.id && (
                      <p className="text-sm text-amber-600">Currently punched in on another job</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">You are not registered as service staff</p>
                )}
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
                <CardTitle className="text-lg">Time Log</CardTitle>
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
                            {entry.totalHours ? `${entry.totalHours.toFixed(1)}h` : "Active"}
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

      {checkInWorkOrder && (
        <ManualCheckInDialog
          open={!!checkInWorkOrder}
          onClose={() => setCheckInWorkOrder(null)}
          workOrderId={checkInWorkOrder.id}
          boatId={checkInWorkOrder.boat_id}
          marinaLat={null}
          marinaLng={null}
          onSuccess={fetchWorkOrders}
        />
      )}
    </div>
  );
}
