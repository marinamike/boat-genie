import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, Camera, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { format } from "date-fns";
import type { useServiceManagement, QCChecklistTemplate } from "@/hooks/useServiceManagement";

interface QCWorkOrder {
  id: string;
  title: string;
  status: string;
  boats?: { name: string };
}

type ServiceManagementProps = ReturnType<typeof useServiceManagement>;

export function ServiceQCQueue({ qcTemplates, serviceStaff, createQCTemplate }: ServiceManagementProps) {
  const { business } = useBusiness();
  const [workOrders, setWorkOrders] = useState<QCWorkOrder[]>([]);
  const [selectedWO, setSelectedWO] = useState<QCWorkOrder | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<QCChecklistTemplate | null>(null);
  const [checklistState, setChecklistState] = useState<Record<number, { checked: boolean; photo?: string; notes?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [showInspection, setShowInspection] = useState(false);

  useEffect(() => {
    fetchQCQueue();
  }, [business?.id]);

  const fetchQCQueue = async () => {
    if (!business?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("work_orders")
      .select("id, title, status, boats(name)")
      .eq("business_id", business.id)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false });
    if (error) console.error("Error fetching QC queue:", error);
    else setWorkOrders((data as any) || []);
    setLoading(false);
  };

  const handleStartInspection = (wo: QCWorkOrder, template: QCChecklistTemplate) => {
    setSelectedWO(wo);
    setSelectedTemplate(template);
    const initialState: Record<number, { checked: boolean }> = {};
    template.checklist_items.forEach((_, idx) => {
      initialState[idx] = { checked: false };
    });
    setChecklistState(initialState);
    setShowInspection(true);
  };

  const handleToggleItem = (idx: number) => {
    setChecklistState((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], checked: !prev[idx]?.checked },
    }));
  };

  const handleSubmitInspection = async () => {
    if (!selectedWO || !selectedTemplate || !business?.id) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const staff = serviceStaff.find((s) => s.user_id === user.id);
    if (!staff) {
      return;
    }

    const allPassed = Object.values(checklistState).every((item) => item.checked);

    const { error } = await supabase.from("qc_inspections").insert({
      business_id: business.id,
      work_order_id: selectedWO.id,
      template_id: selectedTemplate.id,
      submitted_by: staff.id,
      completed_items: Object.entries(checklistState).map(([idx, data]) => ({
        item_id: parseInt(idx),
        ...data,
      })),
      all_items_passed: allPassed,
      review_status: allPassed ? "approved" : "pending",
    });

    if (error) {
      console.error("Error submitting inspection:", error);
      return;
    }

    // Update work order status if all passed
    if (allPassed) {
      await supabase
        .from("work_orders")
        .update({ status: "completed" })
        .eq("id", selectedWO.id);
    }

    setShowInspection(false);
    setSelectedWO(null);
    setSelectedTemplate(null);
    fetchQCQueue();
  };

  const allItemsChecked = selectedTemplate
    ? selectedTemplate.checklist_items.every((_, idx) => checklistState[idx]?.checked)
    : false;

  if (loading) {
    return <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Quality Control Queue
          </CardTitle>
          <CardDescription>Jobs ready for final inspection</CardDescription>
        </CardHeader>
        <CardContent>
          {workOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No jobs awaiting QC inspection</p>
          ) : (
            <div className="space-y-3">
              {workOrders.map((wo) => (
                <div key={wo.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{wo.title}</p>
                      <p className="text-sm text-muted-foreground">{wo.boats?.name || "Unknown boat"}</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Ready for QC
                    </Badge>
                  </div>

                  {qcTemplates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {qcTemplates.map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartInspection(wo, template)}
                        >
                          <ClipboardCheck className="w-4 h-4 mr-1" />
                          {template.template_name}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No QC templates configured. Add templates in Settings.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspection Sheet */}
      <Sheet open={showInspection} onOpenChange={setShowInspection}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>QC Inspection</SheetTitle>
          </SheetHeader>
          {selectedTemplate && selectedWO && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedWO.title}</p>
                <p className="text-sm text-muted-foreground">{selectedWO.boats?.name}</p>
              </div>

              <div className="space-y-3">
                {selectedTemplate.checklist_items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={checklistState[idx]?.checked || false}
                      onCheckedChange={() => handleToggleItem(idx)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.item}</p>
                      {item.required_photo && (
                        <div className="flex items-center gap-1 mt-2">
                          <Button variant="outline" size="sm">
                            <Camera className="w-3 h-3 mr-1" />
                            Photo Required
                          </Button>
                        </div>
                      )}
                    </div>
                    {checklistState[idx]?.checked ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  {Object.values(checklistState).filter((i) => i.checked).length} of {selectedTemplate.checklist_items.length} items checked
                </p>
                <Button
                  onClick={handleSubmitInspection}
                  disabled={!allItemsChecked}
                  className="w-full"
                >
                  {allItemsChecked ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve & Complete Job
                    </>
                  ) : (
                    "Complete All Items to Submit"
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
