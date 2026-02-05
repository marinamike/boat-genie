import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, AlertTriangle } from "lucide-react";
import { format, addHours, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
import type { useServiceManagement, YardCalendarEvent } from "@/hooks/useServiceManagement";

type ServiceManagementProps = ReturnType<typeof useServiceManagement>;

export function YardCalendar({
  calendarEvents,
  equipment,
  bays,
  serviceStaff,
  scheduleEvent,
  updateCalendarEvent,
  checkConflict,
}: ServiceManagementProps) {
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({
    event_type: "haul_out",
    boat_id: "",
    boat_name: "",
    equipment_id: "",
    bay_id: "",
    scheduled_start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    scheduled_end: format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"),
    assigned_operator_id: "",
    notes: "",
  });
  const [conflictWarning, setConflictWarning] = useState(false);

  // Get events for selected date
  const dayEvents = calendarEvents.filter((e) => {
    const start = parseISO(e.scheduled_start);
    return isWithinInterval(start, {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    });
  });

  const handleCheckConflict = async () => {
    const hasConflict = await checkConflict(
      form.equipment_id || null,
      form.bay_id || null,
      new Date(form.scheduled_start),
      new Date(form.scheduled_end)
    );
    setConflictWarning(hasConflict);
  };

  const handleSchedule = async () => {
    // Need to have a boat - for now we'll use the name field
    // In production, you'd have a boat picker
    await scheduleEvent({
      event_type: form.event_type,
      boat_id: form.boat_id || "00000000-0000-0000-0000-000000000000", // Placeholder
      equipment_id: form.equipment_id || null,
      bay_id: form.bay_id || null,
      scheduled_start: form.scheduled_start,
      scheduled_end: form.scheduled_end,
      assigned_operator_id: form.assigned_operator_id || null,
      notes: form.notes || null,
    });
    setShowScheduleSheet(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      event_type: "haul_out",
      boat_id: "",
      boat_name: "",
      equipment_id: "",
      bay_id: "",
      scheduled_start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      scheduled_end: format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"),
      assigned_operator_id: "",
      notes: "",
    });
    setConflictWarning(false);
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      haul_out: "bg-blue-100 border-blue-300 text-blue-800",
      launch: "bg-green-100 border-green-300 text-green-800",
      blocking: "bg-orange-100 border-orange-300 text-orange-800",
      move: "bg-purple-100 border-purple-300 text-purple-800",
    };
    return colors[type] || "bg-gray-100 border-gray-300 text-gray-800";
  };

  // Generate week days for simple week view
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(selectedDate);
    day.setDate(selectedDate.getDate() - selectedDate.getDay() + i);
    weekDays.push(day);
  }

  return (
    <div className="space-y-4">
      {/* Header with schedule button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Yard Calendar
        </h2>
        <Sheet open={showScheduleSheet} onOpenChange={setShowScheduleSheet}>
          <SheetTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Schedule Event</Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Schedule Yard Event</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Event Type</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haul_out">Haul Out</SelectItem>
                    <SelectItem value="launch">Launch</SelectItem>
                    <SelectItem value="blocking">Blocking/Move</SelectItem>
                    <SelectItem value="move">Yard Move</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Boat Name</Label>
                <Input
                  value={form.boat_name}
                  onChange={(e) => setForm({ ...form, boat_name: e.target.value })}
                  placeholder="Enter boat name"
                />
              </div>

              <div>
                <Label>Equipment</Label>
                <Select value={form.equipment_id} onValueChange={(v) => { setForm({ ...form, equipment_id: v }); handleCheckConflict(); }}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {equipment.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.equipment_name} ({e.equipment_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bay</Label>
                <Select value={form.bay_id} onValueChange={(v) => { setForm({ ...form, bay_id: v }); handleCheckConflict(); }}>
                  <SelectTrigger><SelectValue placeholder="Select bay" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {bays.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.bay_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Start</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_start}
                    onChange={(e) => { setForm({ ...form, scheduled_start: e.target.value }); handleCheckConflict(); }}
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_end}
                    onChange={(e) => { setForm({ ...form, scheduled_end: e.target.value }); handleCheckConflict(); }}
                  />
                </div>
              </div>

              {conflictWarning && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Schedule conflict detected! The equipment or bay is already booked.</span>
                </div>
              )}

              <div>
                <Label>Operator</Label>
                <Select value={form.assigned_operator_id} onValueChange={(v) => setForm({ ...form, assigned_operator_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Assign operator" /></SelectTrigger>
                  <SelectContent>
                    {serviceStaff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.staff_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <Button onClick={handleSchedule} disabled={conflictWarning || !form.boat_name} className="w-full">
                Schedule Event
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Week View */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-2 rounded-lg cursor-pointer text-center transition-colors ${
                  format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <p className="text-xs font-medium">{format(day, "EEE")}</p>
                <p className="text-lg font-bold">{format(day, "d")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Events */}
      <Card>
        <CardHeader>
          <CardTitle>{format(selectedDate, "EEEE, MMMM d, yyyy")}</CardTitle>
          <CardDescription>{dayEvents.length} scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          {dayEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No events scheduled for this day</p>
          ) : (
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 border rounded-lg ${getEventColor(event.event_type)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{event.event_type.replace("_", " ")}</p>
                      <p className="text-sm">{event.boat?.name || "Unknown boat"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(parseISO(event.scheduled_start), "h:mm a")} - {format(parseISO(event.scheduled_end), "h:mm a")}
                      </p>
                      {event.equipment && (
                        <p className="text-xs">{(event.equipment as any).equipment_name}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="mt-2">{event.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
