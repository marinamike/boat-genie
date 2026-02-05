import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FileText, Plus, Calendar, RefreshCw, XCircle, Search, Pencil } from "lucide-react";
import { YardAsset, LeaseAgreement } from "@/hooks/useYardAssets";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths } from "date-fns";

interface LeaseManagerProps {
  assets: YardAsset[];
  leases: LeaseAgreement[];
  loading: boolean;
  createLease: (lease: Partial<LeaseAgreement>) => Promise<any>;
  updateLease: (id: string, updates: Partial<LeaseAgreement>) => Promise<boolean>;
  terminateLease: (id: string) => Promise<boolean>;
}

export function LeaseManager({
  assets,
  leases,
  loading,
  createLease,
  updateLease,
  terminateLease,
}: LeaseManagerProps) {
  const [showNewLease, setShowNewLease] = useState(false);
  const [editingLease, setEditingLease] = useState<LeaseAgreement | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [boatSearch, setBoatSearch] = useState("");
  const [boatResults, setBoatResults] = useState<any[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<any>(null);
  const [formData, setFormData] = useState({
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(addMonths(new Date(), 12), "yyyy-MM-dd"),
    monthly_rate: "",
    deposit_amount: "",
    deposit_paid: false,
    auto_renew: true,
    renewal_months: 12,
    power_included: false,
    water_included: false,
    terms_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const openEditLease = (lease: LeaseAgreement) => {
    setEditingLease(lease);
    setFormData({
      start_date: lease.start_date,
      end_date: lease.end_date || format(addMonths(new Date(lease.start_date), 12), "yyyy-MM-dd"),
      monthly_rate: lease.monthly_rate.toString(),
      deposit_amount: (lease.deposit_amount || 0).toString(),
      deposit_paid: lease.deposit_paid || false,
      auto_renew: lease.auto_renew || false,
      renewal_months: lease.renewal_months || 12,
      power_included: lease.power_included || false,
      water_included: lease.water_included || false,
      terms_notes: lease.terms_notes || "",
    });
  };

  const handleUpdateLease = async () => {
    if (!editingLease) return;
    setSubmitting(true);

    try {
      await updateLease(editingLease.id, {
        start_date: formData.start_date,
        end_date: formData.end_date,
        monthly_rate: parseFloat(formData.monthly_rate) || 0,
        deposit_amount: parseFloat(formData.deposit_amount) || 0,
        deposit_paid: formData.deposit_paid,
        auto_renew: formData.auto_renew,
        renewal_months: formData.renewal_months,
        power_included: formData.power_included,
        water_included: formData.water_included,
        terms_notes: formData.terms_notes,
      });
      setEditingLease(null);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(addMonths(new Date(), 12), "yyyy-MM-dd"),
      monthly_rate: "",
      deposit_amount: "",
      deposit_paid: false,
      auto_renew: true,
      renewal_months: 12,
      power_included: false,
      water_included: false,
      terms_notes: "",
    });
    setSelectedAssetId("");
    setSelectedBoat(null);
    setBoatSearch("");
    setBoatResults([]);
  };

  const handleSearchBoat = async () => {
    if (!boatSearch.trim()) return;
    
    const { data } = await supabase
      .from("boats")
      .select("id, name, make, model, owner_id, length_ft")
      .or(`name.ilike.%${boatSearch}%,make.ilike.%${boatSearch}%`)
      .limit(10);
    
    setBoatResults(data || []);
  };

  const handleCreateLease = async () => {
    if (!selectedAssetId || !selectedBoat) return;
    setSubmitting(true);

    try {
      await createLease({
        yard_asset_id: selectedAssetId,
        boat_id: selectedBoat.id,
        owner_id: selectedBoat.owner_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        monthly_rate: parseFloat(formData.monthly_rate) || 0,
        deposit_amount: parseFloat(formData.deposit_amount) || 0,
        deposit_paid: formData.deposit_paid,
        auto_renew: formData.auto_renew,
        renewal_months: formData.renewal_months,
        power_included: formData.power_included,
        water_included: formData.water_included,
        terms_notes: formData.terms_notes,
        lease_status: "active",
      });
      
      setShowNewLease(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "expired":
        return <Badge variant="outline">Expired</Badge>;
      case "terminated":
        return <Badge variant="destructive">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeLeases = leases.filter((l) => l.lease_status === "active");
  const otherLeases = leases.filter((l) => l.lease_status !== "active");
  const availableAssets = assets.filter(
    (a) => !activeLeases.some((l) => l.yard_asset_id === a.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FileText className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lease Agreements</h2>
          <p className="text-sm text-muted-foreground">
            Manage long-term slip rentals
          </p>
        </div>
        <Button onClick={() => setShowNewLease(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Lease
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{activeLeases.length}</div>
            <p className="text-sm text-muted-foreground">Active Leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">
              {activeLeases.filter((l) => l.auto_renew).length}
            </div>
            <p className="text-sm text-muted-foreground">Auto-Renew</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-green-600">
              ${activeLeases.reduce((sum, l) => sum + l.monthly_rate, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{availableAssets.length}</div>
            <p className="text-sm text-muted-foreground">Available Spaces</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Leases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Leases</CardTitle>
        </CardHeader>
        <CardContent>
          {activeLeases.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active leases</p>
          ) : (
            <div className="space-y-3">
              {activeLeases.map((lease) => (
                <div
                  key={lease.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {lease.boat?.name || "Unknown Boat"}
                        {getStatusBadge(lease.lease_status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lease.asset?.asset_name} • {lease.asset?.dock_section}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${lease.monthly_rate.toLocaleString()}/mo
                      </div>
                      {lease.auto_renew && (
                        <Badge variant="outline" className="mt-1">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Auto-Renew
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(lease.start_date), "MMM d, yyyy")}
                        {lease.end_date && ` - ${format(new Date(lease.end_date), "MMM d, yyyy")}`}
                      </div>
                      {lease.power_included && <Badge variant="secondary">Power Included</Badge>}
                      {lease.water_included && <Badge variant="secondary">Water Included</Badge>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditLease(lease)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <XCircle className="w-4 h-4 mr-1" />
                            Terminate
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Terminate Lease?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will end the lease for {lease.boat?.name} at {lease.asset?.asset_name}.
                              The slip will be marked as available.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => terminateLease(lease.id)}>
                              Terminate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Leases */}
      {otherLeases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Past Leases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otherLeases.slice(0, 5).map((lease) => (
                <div
                  key={lease.id}
                  className="p-3 border rounded flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{lease.boat?.name}</span>
                    <span className="text-muted-foreground"> • {lease.asset?.asset_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(lease.lease_status)}
                    <span className="text-muted-foreground">
                      {format(new Date(lease.start_date), "MMM yyyy")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Lease Sheet */}
      <Sheet open={showNewLease} onOpenChange={setShowNewLease}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Lease</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            {/* Select Slip */}
            <div className="space-y-2">
              <Label>Select Slip/Space *</Label>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose available space" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.asset_name} ({asset.dock_section || "Unassigned"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Boat */}
            <div className="space-y-2">
              <Label>Search Boat *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by boat name..."
                  value={boatSearch}
                  onChange={(e) => setBoatSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchBoat()}
                />
                <Button type="button" onClick={handleSearchBoat}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {boatResults.length > 0 && !selectedBoat && (
                <div className="space-y-1 mt-2">
                  {boatResults.map((boat) => (
                    <button
                      key={boat.id}
                      type="button"
                      onClick={() => {
                        setSelectedBoat(boat);
                        setBoatResults([]);
                      }}
                      className="w-full p-2 text-left border rounded hover:bg-accent text-sm"
                    >
                      <span className="font-medium">{boat.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {boat.make} {boat.model} • {boat.length_ft}ft
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedBoat && (
                <Card className="mt-2">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{selectedBoat.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedBoat.make} {selectedBoat.model}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBoat(null)}
                    >
                      Change
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Rate ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="800.00"
                  value={formData.monthly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_rate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Security Deposit ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.deposit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit_amount: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Auto-Renew */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Renew</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically renew when lease expires
                </p>
              </div>
              <Switch
                checked={formData.auto_renew}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, auto_renew: checked })
                }
              />
            </div>

            {/* Utilities Included */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Power Included</Label>
                <Switch
                  checked={formData.power_included}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, power_included: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Water Included</Label>
                <Switch
                  checked={formData.water_included}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, water_included: checked })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewLease(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLease}
                disabled={!selectedAssetId || !selectedBoat || !formData.monthly_rate || submitting}
                className="flex-1"
              >
                {submitting ? "Creating..." : "Create Lease"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Lease Sheet */}
      <Sheet open={!!editingLease} onOpenChange={(open) => !open && setEditingLease(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Lease</SheetTitle>
          </SheetHeader>
          
          {editingLease && (
            <div className="space-y-4 mt-6">
              {/* Lease Info (Read-only) */}
              <Card className="bg-muted/50">
                <CardContent className="py-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vessel</span>
                    <span className="font-medium">{editingLease.boat?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Space</span>
                    <span>{editingLease.asset?.asset_name}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Rate ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="800.00"
                    value={formData.monthly_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, monthly_rate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Security Deposit ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.deposit_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, deposit_amount: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Deposit Paid */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Deposit Paid</Label>
                  <p className="text-xs text-muted-foreground">
                    Has the security deposit been collected?
                  </p>
                </div>
                <Switch
                  checked={formData.deposit_paid}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, deposit_paid: checked })
                  }
                />
              </div>

              {/* Auto-Renew */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Renew</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically renew when lease expires
                  </p>
                </div>
                <Switch
                  checked={formData.auto_renew}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, auto_renew: checked })
                  }
                />
              </div>

              {/* Utilities Included */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Power Included</Label>
                  <Switch
                    checked={formData.power_included}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, power_included: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Water Included</Label>
                  <Switch
                    checked={formData.water_included}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, water_included: checked })
                    }
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Terms & Notes</Label>
                <Textarea
                  placeholder="Additional lease terms or notes..."
                  value={formData.terms_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, terms_notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLease(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLease}
                  disabled={!formData.monthly_rate || submitting}
                  className="flex-1"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
