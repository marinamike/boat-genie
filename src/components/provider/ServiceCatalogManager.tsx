import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Lock, Trash2, Edit2, DollarSign, Loader2, Package, AlertCircle } from "lucide-react";
import { useProviderServices, ProviderService, NewProviderService } from "@/hooks/useProviderServices";
import { cn } from "@/lib/utils";

export function ServiceCatalogManager() {
  const { services, loading, saving, isAdmin, addService, updateService, deleteService, lockAllServices, SERVICE_CATEGORIES } = useProviderServices();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(null);
  const [formData, setFormData] = useState<NewProviderService>({
    service_name: "",
    pricing_model: "per_foot",
    price: 0,
    description: null,
    category: "Wash & Detail",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      service_name: "",
      pricing_model: "per_foot",
      price: 0,
      description: null,
      category: "Wash & Detail",
      is_active: true,
    });
    setEditingService(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (service: ProviderService) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      pricing_model: service.pricing_model,
      price: service.price,
      description: service.description,
      category: service.category,
      is_active: service.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingService) {
      const success = await updateService(editingService.id, formData);
      if (success) {
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const success = await addService(formData);
      if (success) {
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      await deleteService(serviceId);
    }
  };

  const handleLockAll = async () => {
    if (confirm("Lock all service prices? This cannot be undone without admin approval.")) {
      await lockAllServices();
    }
  };

  const unlockedServices = services.filter(s => !s.is_locked);
  const hasUnlockedServices = unlockedServices.length > 0;

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, ProviderService[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Service Catalog
              </CardTitle>
              <CardDescription>
                Add your services and pricing. Prices are locked after initial setup.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasUnlockedServices && (
                <Button variant="outline" size="sm" onClick={handleLockAll}>
                  <Lock className="w-4 h-4 mr-2" />
                  Lock All Prices
                </Button>
              )}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openAddDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingService ? "Edit Service" : "Add New Service"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingService?.is_locked && !isAdmin 
                        ? "This service is locked. Only non-pricing fields can be edited."
                        : "Configure your service details and pricing."}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_name">Service Name</Label>
                      <Input
                        id="service_name"
                        placeholder="e.g., Basic Wash, Full Detail"
                        value={formData.service_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pricing_model">Pricing Model</Label>
                        <Select 
                          value={formData.pricing_model} 
                          onValueChange={(value: "per_foot" | "flat_rate") => setFormData(prev => ({ ...prev, pricing_model: value }))}
                          disabled={editingService?.is_locked && !isAdmin}
                        >
                          <SelectTrigger className={cn(editingService?.is_locked && !isAdmin && "bg-muted cursor-not-allowed")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_foot">Per Foot</SelectItem>
                            <SelectItem value="flat_rate">Flat Rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price" className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Price {formData.pricing_model === "per_foot" ? "(per ft)" : ""}
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.price || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          disabled={editingService?.is_locked && !isAdmin}
                          className={cn(editingService?.is_locked && !isAdmin && "bg-muted cursor-not-allowed")}
                        />
                      </div>
                    </div>

                    {editingService?.is_locked && !isAdmin && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Pricing is locked. Contact Boat Genie Support to update.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what's included in this service..."
                        value={formData.description || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value || null }))}
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Active</Label>
                        <p className="text-sm text-muted-foreground">Show this service to boat owners</p>
                      </div>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving || !formData.service_name || formData.price <= 0}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {editingService ? "Update Service" : "Add Service"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No services added yet.</p>
              <p className="text-sm">Add your first service to start receiving requests.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">{category}</h3>
                  <div className="space-y-2">
                    {categoryServices.map((service) => (
                      <div
                        key={service.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          !service.is_active && "opacity-60 bg-muted/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{service.service_name}</span>
                            {service.is_locked && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                            {!service.is_active && (
                              <Badge variant="outline" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground truncate">{service.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <div className="font-semibold">
                              ${service.price.toFixed(2)}
                              {service.pricing_model === "per_foot" && (
                                <span className="text-sm font-normal text-muted-foreground">/ft</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {service.pricing_model === "per_foot" ? "Per Foot" : "Flat Rate"}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(service)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {(!service.is_locked || isAdmin) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(service.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
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
