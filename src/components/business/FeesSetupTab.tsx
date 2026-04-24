import { useEffect, useState } from "react";
import { useBusinessFees, type BusinessFee, type PricingModel } from "@/hooks/useBusinessFees";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Save, X, Loader2 } from "lucide-react";

const PRICING_MODELS: { value: PricingModel; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "hourly", label: "Hourly" },
  { value: "per_foot", label: "Per Foot" },
  { value: "percentage", label: "Percentage" },
];

const modelLabel = (m: PricingModel) => PRICING_MODELS.find((p) => p.value === m)?.label || m;
const formatAmount = (amount: number, model: PricingModel) =>
  model === "percentage" ? `${amount}%` : `$${Number(amount).toFixed(2)}`;

interface FeeFormState {
  name: string;
  pricing_model: PricingModel;
  amount: string;
  is_active: boolean;
}

const emptyForm: FeeFormState = {
  name: "",
  pricing_model: "fixed",
  amount: "",
  is_active: true,
};

export function FeesSetupTab() {
  const {
    fees,
    loading,
    emergencyFeeEnabled,
    emergencyFeeAmount,
    updateEmergencyFee,
    createFee,
    updateFee,
    deleteFee,
  } = useBusinessFees();

  // Emergency fee state
  const [emEnabled, setEmEnabled] = useState(false);
  const [emAmount, setEmAmount] = useState("");
  const [savingEmergency, setSavingEmergency] = useState(false);

  useEffect(() => {
    setEmEnabled(emergencyFeeEnabled);
    setEmAmount(emergencyFeeAmount ? String(emergencyFeeAmount) : "");
  }, [emergencyFeeEnabled, emergencyFeeAmount]);

  const handleSaveEmergency = async () => {
    setSavingEmergency(true);
    await updateEmergencyFee({
      enabled: emEnabled,
      amount: parseFloat(emAmount) || 0,
    });
    setSavingEmergency(false);
  };

  // Custom fees form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FeeFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (fee: BusinessFee) => {
    setEditingId(fee.id);
    setForm({
      name: fee.name,
      pricing_model: fee.pricing_model,
      amount: String(fee.amount),
      is_active: fee.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(form.amount);
    if (!form.name.trim() || isNaN(amountNum)) return;
    setSubmitting(true);
    if (editingId) {
      await updateFee(editingId, {
        pricing_model: form.pricing_model,
        amount: amountNum,
        is_active: form.is_active,
      });
    } else {
      await createFee({
        name: form.name.trim(),
        pricing_model: form.pricing_model,
        amount: amountNum,
        is_active: form.is_active,
      });
    }
    setSubmitting(false);
    closeForm();
  };

  const amountLabel = form.pricing_model === "percentage" ? "Amount (%)" : "Amount ($)";

  return (
    <div className="space-y-6">
      {/* Emergency Service Fee */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Service Fee</CardTitle>
          <CardDescription>
            Automatically added to quotes for emergency service requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="em-toggle" className="font-medium">
              Enable emergency fee
            </Label>
            <Switch id="em-toggle" checked={emEnabled} onCheckedChange={setEmEnabled} />
          </div>

          {emEnabled && (
            <div className="space-y-2">
              <Label htmlFor="em-amount">Fee amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="em-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={emAmount}
                  onChange={(e) => setEmAmount(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <Button onClick={handleSaveEmergency} disabled={savingEmergency} className="w-full">
            {savingEmergency ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Emergency Fee
          </Button>
        </CardContent>
      </Card>

      {/* Custom Fees Library */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Custom Fees Library</CardTitle>
            <CardDescription>
              Reusable fees you can add to quotes and invoices.
            </CardDescription>
          </div>
          {!showForm && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" />
              Add Fee
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="fee-name">Name</Label>
                <Input
                  id="fee-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Disposal Fee"
                  disabled={!!editingId}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <Select
                    value={form.pricing_model}
                    onValueChange={(v) => setForm({ ...form, pricing_model: v as PricingModel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee-amount">{amountLabel}</Label>
                  <Input
                    id="fee-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="fee-active">Active</Label>
                <Switch
                  id="fee-active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingId ? "Save Changes" : "Add Fee"}
                </Button>
                <Button variant="outline" onClick={closeForm} disabled={submitting}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : fees.length === 0 && !showForm ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No custom fees yet. Add one to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {fees.map((fee) => (
                <div
                  key={fee.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg ${
                    !fee.is_active ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{fee.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {modelLabel(fee.pricing_model)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatAmount(Number(fee.amount), fee.pricing_model)}
                    </p>
                  </div>

                  <Switch
                    checked={fee.is_active}
                    onCheckedChange={() => updateFee(fee.id, { is_active: !fee.is_active })}
                  />

                  <Button size="icon" variant="ghost" onClick={() => openEdit(fee)}>
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete fee?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{fee.name}" will be removed permanently. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteFee(fee.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
