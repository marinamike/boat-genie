import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, X, Check } from "lucide-react";
import { useServiceMenu, SERVICE_MENU_CATEGORIES, PRICING_MODELS } from "@/hooks/useServiceMenu";

export function ServiceMenuManager() {
  const { menuItems, loading, createMenuItem, updateMenuItem, toggleActive, fetchCatalogServices } = useServiceMenu();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catalogServices, setCatalogServices] = useState<string[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Detailing & Cleaning",
    pricing_model: "fixed",
    default_price: "",
    description: "",
    min_length: "",
    max_length: "",
  });

  const resetForm = () => {
    setForm({ name: "", category: "Detailing & Cleaning", pricing_model: "fixed", default_price: "", description: "", min_length: "", max_length: "" });
    setCatalogServices([]);
    setShowForm(false);
    setEditingId(null);
  };

  // Fetch catalog services when category changes in create mode
  useEffect(() => {
    if (!showForm || editingId) return;
    let cancelled = false;
    setLoadingCatalog(true);
    setForm((f) => ({ ...f, name: "" }));
    fetchCatalogServices(form.category).then((names) => {
      if (!cancelled) {
        setCatalogServices(names);
        setLoadingCatalog(false);
      }
    });
    return () => { cancelled = true; };
  }, [form.category, showForm, editingId]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      category: form.category,
      pricing_model: form.pricing_model,
      default_price: parseFloat(form.default_price) || 0,
      description: form.description.trim() || null,
      min_length: form.min_length.trim() === "" ? null : parseFloat(form.min_length),
      max_length: form.max_length.trim() === "" ? null : parseFloat(form.max_length),
    };

    if (editingId) {
      const { name: _n, category: _c, ...editPayload } = payload;
      await updateMenuItem(editingId, editPayload);
    } else {
      await createMenuItem(payload);
    }
    resetForm();
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      pricing_model: item.pricing_model,
      default_price: item.default_price.toString(),
      description: item.description || "",
      min_length: item.min_length != null ? item.min_length.toString() : "",
      max_length: item.max_length != null ? item.max_length.toString() : "",
    });
    setShowForm(true);
  };

  const getPricingLabel = (model: string) => {
    return PRICING_MODELS.find((p) => p.value === model)?.label || model;
  };

  const formatLengthRange = (min: number | null, max: number | null): string | null => {
    if (min == null && max == null) return null;
    if (min != null && max != null) return `${min}-${max}ft`;
    if (max != null) return `Up to ${max}ft`;
    return `${min}ft+`;
  };

  const groupedItems = menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Menu</CardTitle>
              <CardDescription>Define your catalog of services with pricing</CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create Service Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{editingId ? "Edit Service Item" : "New Service Item"}</p>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  {editingId ? (
                    <Input value={form.category} disabled className="bg-muted" />
                  ) : (
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_MENU_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Name</Label>
                  {editingId ? (
                    <Input value={form.name} disabled className="bg-muted" />
                  ) : (
                    <Select
                      value={form.name}
                      onValueChange={(v) => setForm({ ...form, name: v })}
                      disabled={loadingCatalog || catalogServices.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCatalog ? "Loading…" : "Select service"} />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogServices.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Pricing Logic</Label>
                  <Select value={form.pricing_model} onValueChange={(v) => setForm({ ...form, pricing_model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRICING_MODELS.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.default_price}
                    onChange={(e) => setForm({ ...form, default_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Min Length (ft)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.min_length}
                    onChange={(e) => setForm({ ...form, min_length: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label>Max Length (ft)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.max_length}
                    onChange={(e) => setForm({ ...form, max_length: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the service..."
                  rows={2}
                />
              </div>
              <Button onClick={handleSubmit} disabled={!form.name.trim()} className="w-full">
                <Check className="w-4 h-4 mr-1" />
                {editingId ? "Update Service Item" : "Create Service Item"}
              </Button>
            </div>
          )}

          {menuItems.length === 0 && !showForm ? (
            <p className="text-center text-muted-foreground py-6">
              No service items yet. Create your first service to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">{category}</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          !item.is_active ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {getPricingLabel(item.pricing_model)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ${item.default_price.toFixed(2)}
                            {item.pricing_model === "hourly" && "/hr"}
                            {item.pricing_model === "per_foot" && "/ft"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => toggleActive(item.id, item.is_active)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
