import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Truck, Square, ClipboardList } from "lucide-react";
import type { useServiceManagement, QCChecklistTemplate } from "@/hooks/useServiceManagement";

type ServiceManagementProps = ReturnType<typeof useServiceManagement>;

export function YardEquipmentSettings({
  equipment,
  bays,
  qcTemplates,
  createEquipment,
  createBay,
  createQCTemplate,
  loading,
}: ServiceManagementProps) {
  const [activeTab, setActiveTab] = useState("equipment");
  const [showEquipmentSheet, setShowEquipmentSheet] = useState(false);
  const [showBaySheet, setShowBaySheet] = useState(false);
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);

  const [equipmentForm, setEquipmentForm] = useState({
    equipment_name: "",
    equipment_type: "travel_lift",
    max_capacity_lbs: "",
    max_beam_ft: "",
    notes: "",
  });

  const [bayForm, setBayForm] = useState({
    bay_name: "",
    max_length_ft: "",
    max_beam_ft: "",
    notes: "",
  });

  const [templateForm, setTemplateForm] = useState({
    template_name: "",
    job_type: "",
    checklist_items: [{ item: "", required_photo: false }],
  });

  const handleAddEquipment = async () => {
    await createEquipment({
      equipment_name: equipmentForm.equipment_name,
      equipment_type: equipmentForm.equipment_type,
      max_capacity_lbs: equipmentForm.max_capacity_lbs ? parseInt(equipmentForm.max_capacity_lbs) : null,
      max_beam_ft: equipmentForm.max_beam_ft ? parseFloat(equipmentForm.max_beam_ft) : null,
      notes: equipmentForm.notes || null,
    });
    setShowEquipmentSheet(false);
    setEquipmentForm({ equipment_name: "", equipment_type: "travel_lift", max_capacity_lbs: "", max_beam_ft: "", notes: "" });
  };

  const handleAddBay = async () => {
    await createBay({
      bay_name: bayForm.bay_name,
      max_length_ft: bayForm.max_length_ft ? parseFloat(bayForm.max_length_ft) : null,
      max_beam_ft: bayForm.max_beam_ft ? parseFloat(bayForm.max_beam_ft) : null,
      notes: bayForm.notes || null,
    });
    setShowBaySheet(false);
    setBayForm({ bay_name: "", max_length_ft: "", max_beam_ft: "", notes: "" });
  };

  const handleAddChecklistItem = () => {
    setTemplateForm((prev) => ({
      ...prev,
      checklist_items: [...prev.checklist_items, { item: "", required_photo: false }],
    }));
  };

  const handleUpdateChecklistItem = (index: number, field: "item" | "required_photo", value: string | boolean) => {
    setTemplateForm((prev) => ({
      ...prev,
      checklist_items: prev.checklist_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddTemplate = async () => {
    const items = templateForm.checklist_items.filter((i) => i.item.trim());
    await createQCTemplate({
      template_name: templateForm.template_name,
      job_type: templateForm.job_type,
      checklist_items: items,
    } as any);
    setShowTemplateSheet(false);
    setTemplateForm({ template_name: "", job_type: "", checklist_items: [{ item: "", required_photo: false }] });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Yard Setup
      </h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="bays">Haul-Out Bays</TabsTrigger>
          <TabsTrigger value="templates">QC Templates</TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Yard Equipment
                  </CardTitle>
                  <CardDescription>Travel-lifts, forklifts, and heavy equipment</CardDescription>
                </div>
                <Sheet open={showEquipmentSheet} onOpenChange={setShowEquipmentSheet}>
                  <SheetTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader><SheetTitle>Add Equipment</SheetTitle></SheetHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Equipment Name</Label>
                        <Input
                          value={equipmentForm.equipment_name}
                          onChange={(e) => setEquipmentForm({ ...equipmentForm, equipment_name: e.target.value })}
                          placeholder="e.g., 35-Ton Travel Lift"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={equipmentForm.equipment_type} onValueChange={(v) => setEquipmentForm({ ...equipmentForm, equipment_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="travel_lift">Travel Lift</SelectItem>
                            <SelectItem value="forklift">Forklift</SelectItem>
                            <SelectItem value="crane">Crane</SelectItem>
                            <SelectItem value="trailer">Trailer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Max Capacity (lbs)</Label>
                          <Input
                            type="number"
                            value={equipmentForm.max_capacity_lbs}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, max_capacity_lbs: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Max Beam (ft)</Label>
                          <Input
                            type="number"
                            value={equipmentForm.max_beam_ft}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, max_beam_ft: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddEquipment} disabled={!equipmentForm.equipment_name} className="w-full">
                        Add Equipment
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent>
              {equipment.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No equipment configured</p>
              ) : (
                <div className="space-y-2">
                  {equipment.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{e.equipment_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{e.equipment_type.replace("_", " ")}</p>
                      </div>
                      <Badge variant={e.is_available ? "default" : "secondary"}>
                        {e.is_available ? "Available" : "In Use"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bays Tab */}
        <TabsContent value="bays">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Square className="w-5 h-5" />
                    Haul-Out Bays
                  </CardTitle>
                  <CardDescription>Blocking and work bays</CardDescription>
                </div>
                <Sheet open={showBaySheet} onOpenChange={setShowBaySheet}>
                  <SheetTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader><SheetTitle>Add Haul-Out Bay</SheetTitle></SheetHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Bay Name</Label>
                        <Input
                          value={bayForm.bay_name}
                          onChange={(e) => setBayForm({ ...bayForm, bay_name: e.target.value })}
                          placeholder="e.g., Bay A"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Max Length (ft)</Label>
                          <Input
                            type="number"
                            value={bayForm.max_length_ft}
                            onChange={(e) => setBayForm({ ...bayForm, max_length_ft: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Max Beam (ft)</Label>
                          <Input
                            type="number"
                            value={bayForm.max_beam_ft}
                            onChange={(e) => setBayForm({ ...bayForm, max_beam_ft: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddBay} disabled={!bayForm.bay_name} className="w-full">
                        Add Bay
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent>
              {bays.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No bays configured</p>
              ) : (
                <div className="space-y-2">
                  {bays.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{b.bay_name}</p>
                        {b.max_length_ft && <p className="text-sm text-muted-foreground">Max {b.max_length_ft} ft</p>}
                      </div>
                      <Badge variant={b.is_available ? "default" : "secondary"}>
                        {b.is_available ? "Available" : "Occupied"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QC Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    QC Checklists
                  </CardTitle>
                  <CardDescription>Quality control templates by job type</CardDescription>
                </div>
                <Sheet open={showTemplateSheet} onOpenChange={setShowTemplateSheet}>
                  <SheetTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto">
                    <SheetHeader><SheetTitle>Add QC Template</SheetTitle></SheetHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Template Name</Label>
                        <Input
                          value={templateForm.template_name}
                          onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })}
                          placeholder="e.g., Bottom Paint QC"
                        />
                      </div>
                      <div>
                        <Label>Job Type</Label>
                        <Input
                          value={templateForm.job_type}
                          onChange={(e) => setTemplateForm({ ...templateForm, job_type: e.target.value })}
                          placeholder="e.g., bottom_paint"
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">Checklist Items</Label>
                        <div className="space-y-2">
                          {templateForm.checklist_items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                value={item.item}
                                onChange={(e) => handleUpdateChecklistItem(idx, "item", e.target.value)}
                                placeholder="Check item description"
                                className="flex-1"
                              />
                              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                <Checkbox
                                  checked={item.required_photo}
                                  onCheckedChange={(v) => handleUpdateChecklistItem(idx, "required_photo", !!v)}
                                />
                                Photo
                              </label>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={handleAddChecklistItem}>
                            <Plus className="w-3 h-3 mr-1" />Add Item
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={handleAddTemplate}
                        disabled={!templateForm.template_name || !templateForm.job_type}
                        className="w-full"
                      >
                        Create Template
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent>
              {qcTemplates.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No QC templates configured</p>
              ) : (
                <div className="space-y-2">
                  {qcTemplates.map((t) => (
                    <div key={t.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t.template_name}</p>
                          <p className="text-sm text-muted-foreground">{t.job_type}</p>
                        </div>
                        <Badge variant="outline">{t.checklist_items.length} items</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
