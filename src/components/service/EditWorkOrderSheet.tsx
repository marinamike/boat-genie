import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, Save, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/pricing";

interface EditWorkOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: {
    id: string;
    title: string;
    description: string | null;
    guest_customer_id: string | null;
    guest_customers?: { owner_name: string; owner_email: string | null } | null;
    owner_profile?: { full_name: string | null; email: string | null } | null;
    boats?: { name: string; make: string | null; model: string | null; owner_id: string };
  };
  onSaved: () => void;
}

export function EditWorkOrderSheet({ open, onOpenChange, workOrder, onSaved }: EditWorkOrderSheetProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [materialsDeposit, setMaterialsDeposit] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");

  // Load current values from DB when sheet opens
  useEffect(() => {
    if (open && workOrder) {
      loadWorkOrderDetails();
    }
  }, [open, workOrder.id]);

  const loadWorkOrderDetails = async () => {
    const { data } = await supabase
      .from("work_orders")
      .select("title, description, retail_price, materials_deposit, scheduled_date")
      .eq("id", workOrder.id)
      .single();

    if (data) {
      setTitle(data.title || "");
      setDescription(data.description || "");
      setRetailPrice(data.retail_price?.toString() || "0");
      setMaterialsDeposit(data.materials_deposit?.toString() || "0");
      setScheduledDate(data.scheduled_date || "");
      // Use description as notes too
      setNotes(data.description || "");
    }
  };

  const basePrice = parseFloat(retailPrice) || 0;
  const deposit = parseFloat(materialsDeposit) || 0;
  const depositExceedsPrice = deposit > basePrice;

  const saveChanges = async () => {
    const clampedDeposit = Math.min(deposit, basePrice);

    const { error } = await supabase
      .from("work_orders")
      .update({
        title,
        description: notes || description,
        retail_price: basePrice,
        wholesale_price: basePrice,
        materials_deposit: clampedDeposit,
        scheduled_date: scheduledDate || null,
      })
      .eq("id", workOrder.id);

    if (error) throw error;

    // Also update the quote record if it exists
    await supabase
      .from("quotes")
      .update({
        base_price: basePrice,
        total_owner_price: basePrice,
        total_provider_receives: basePrice,
        materials_deposit: clampedDeposit,
        notes: notes || null,
      })
      .eq("work_order_id", workOrder.id);

    return clampedDeposit;
  };

  const handleSaveOnly = async () => {
    if (depositExceedsPrice) return;
    setSaving(true);
    try {
      await saveChanges();
      toast({ title: "Work Order Updated", description: "Changes saved successfully." });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndResend = async () => {
    if (depositExceedsPrice) return;
    setResending(true);
    try {
      const clampedDeposit = await saveChanges();

      // Get approval token and business info
      const { data: wo } = await supabase
        .from("work_orders")
        .select("approval_token, provider_id, business_id")
        .eq("id", workOrder.id)
        .single();

      if (!wo?.approval_token) {
        toast({ title: "Cannot resend", description: "No approval token found for this work order.", variant: "destructive" });
        setResending(false);
        return;
      }

      // Get business name
      let providerName = "Service Provider";
      if (wo.business_id) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("business_name")
          .eq("id", wo.business_id)
          .single();
        if (biz) providerName = biz.business_name;
      }

      // Determine recipient email
      const recipientEmail = workOrder.guest_customer_id
        ? workOrder.guest_customers?.owner_email
        : workOrder.owner_profile?.email;

      const recipientName = workOrder.guest_customer_id
        ? workOrder.guest_customers?.owner_name || "Customer"
        : workOrder.owner_profile?.full_name || "Customer";

      if (!recipientEmail) {
        toast({ title: "Cannot resend", description: "No email address found for this customer.", variant: "destructive" });
        setResending(false);
        return;
      }

      await supabase.functions.invoke("send-owner-invite", {
        body: {
          providerName,
          ownerName: recipientName,
          ownerEmail: recipientEmail,
          boatName: workOrder.boats?.name || "your boat",
          serviceName: title,
          basePrice,
          materialsDeposit: clampedDeposit,
          totalPrice: basePrice,
          scheduledDate: scheduledDate || undefined,
          notes: notes || undefined,
          approvalToken: wo.approval_token,
        },
      });

      toast({ title: "Updated & Resent", description: `Approval email resent to ${recipientEmail}.` });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const isBusy = saving || resending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Work Order</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description / Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Base Price ($)</Label>
            <Input
              type="number"
              value={retailPrice}
              onChange={e => setRetailPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Materials Deposit ($)</Label>
            <Input
              type="number"
              value={materialsDeposit}
              onChange={e => setMaterialsDeposit(e.target.value)}
              min="0"
              step="0.01"
              max={basePrice}
            />
            <p className="text-xs text-muted-foreground">
              Portion of the base price collected upfront. Cannot exceed the base price.
            </p>
            {depositExceedsPrice && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Deposit cannot exceed the base price ({formatPrice(basePrice)})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Scheduled Date</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
            />
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Total Price</span>
              <span className="text-primary">{formatPrice(basePrice)}</span>
            </div>
            {deposit > 0 && !depositExceedsPrice && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Now (Materials Deposit)</span>
                  <span className="font-medium">{formatPrice(deposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining on Completion</span>
                  <span className="font-medium">{formatPrice(basePrice - deposit)}</span>
                </div>
              </>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Button onClick={handleSaveAndResend} disabled={isBusy || depositExceedsPrice || !title}>
              {resending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Save & Resend Approval
            </Button>
            <Button variant="outline" onClick={handleSaveOnly} disabled={isBusy || depositExceedsPrice || !title}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Only
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
