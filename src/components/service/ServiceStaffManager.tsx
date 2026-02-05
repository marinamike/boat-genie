import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Wrench } from "lucide-react";
import type { useServiceManagement, ServiceSpecialty } from "@/hooks/useServiceManagement";

type ServiceManagementProps = ReturnType<typeof useServiceManagement>;

const specialtyLabels: Record<ServiceSpecialty, string> = {
  diesel_mechanic: "Diesel Mechanic",
  outboard_mechanic: "Outboard Mechanic",
  electrician: "Electrician",
  electronics: "Electronics",
  fiberglass: "Fiberglass",
  gelcoat: "Gelcoat",
  painter: "Painter",
  canvas: "Canvas",
  detailer: "Detailer",
  rigger: "Rigger",
  welder: "Welder",
  carpenter: "Carpenter",
  general: "General",
};

const allSpecialties: ServiceSpecialty[] = [
  "diesel_mechanic", "outboard_mechanic", "electrician", "electronics",
  "fiberglass", "gelcoat", "painter", "canvas", "detailer",
  "rigger", "welder", "carpenter", "general"
];

export function ServiceStaffManager({ serviceStaff, createServiceStaff, updateServiceStaff, loading }: ServiceManagementProps) {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [form, setForm] = useState({
    staff_name: "",
    internal_hourly_rate: "",
    billable_hourly_rate: "",
    specialties: [] as ServiceSpecialty[],
    notes: "",
  });

  const handleToggleSpecialty = (specialty: ServiceSpecialty) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleAddStaff = async () => {
    await createServiceStaff({
      staff_name: form.staff_name,
      internal_hourly_rate: parseFloat(form.internal_hourly_rate) || 0,
      billable_hourly_rate: parseFloat(form.billable_hourly_rate) || 0,
      specialties: form.specialties,
      notes: form.notes || null,
      user_id: crypto.randomUUID(), // Placeholder - would be linked to actual user
    });
    setShowAddSheet(false);
    setForm({
      staff_name: "",
      internal_hourly_rate: "",
      billable_hourly_rate: "",
      specialties: [],
      notes: "",
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Service Staff
        </h2>
        <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
          <SheetTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add Service Staff</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.staff_name}
                  onChange={(e) => setForm({ ...form, staff_name: e.target.value })}
                  placeholder="Staff member name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Internal Rate ($/hr)</Label>
                  <Input
                    type="number"
                    value={form.internal_hourly_rate}
                    onChange={(e) => setForm({ ...form, internal_hourly_rate: e.target.value })}
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <Label>Billable Rate ($/hr)</Label>
                  <Input
                    type="number"
                    value={form.billable_hourly_rate}
                    onChange={(e) => setForm({ ...form, billable_hourly_rate: e.target.value })}
                    placeholder="75.00"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Specialties</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allSpecialties.map((specialty) => (
                    <label key={specialty} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.specialties.includes(specialty)}
                        onCheckedChange={() => handleToggleSpecialty(specialty)}
                      />
                      {specialtyLabels[specialty]}
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleAddStaff} disabled={!form.staff_name} className="w-full">
                Add Staff Member
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardContent className="pt-6">
          {serviceStaff.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No service staff configured</p>
          ) : (
            <div className="space-y-3">
              {serviceStaff.map((staff) => (
                <div key={staff.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{staff.staff_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Internal: ${staff.internal_hourly_rate}/hr • Billable: ${staff.billable_hourly_rate}/hr
                      </p>
                    </div>
                    <Badge variant={staff.is_active ? "default" : "secondary"}>
                      {staff.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {staff.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {staff.specialties.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          <Wrench className="w-3 h-3 mr-1" />
                          {specialtyLabels[s]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
