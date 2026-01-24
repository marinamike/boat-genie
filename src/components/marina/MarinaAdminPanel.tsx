import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Building2, Trash2, Edit2, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Marina {
  id: string;
  marina_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  max_length_ft: number | null;
  max_beam_ft: number | null;
  max_draft_ft: number | null;
  min_depth_ft: number | null;
  power_options: string[] | null;
  accepts_transient: boolean;
  accepts_longterm: boolean;
  is_claimed: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
}

export function MarinaAdminPanel() {
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMarina, setEditingMarina] = useState<Marina | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    marina_name: "",
    address: "",
    latitude: "",
    longitude: "",
    max_length_ft: "",
    max_beam_ft: "",
    max_draft_ft: "",
    min_depth_ft: "",
    power_options: "",
    accepts_transient: true,
    accepts_longterm: true,
    contact_email: "",
    contact_phone: "",
    description: "",
  });

  const fetchMarinas = async () => {
    try {
      const { data, error } = await supabase
        .from("marinas")
        .select("*")
        .order("marina_name");

      if (error) throw error;
      setMarinas((data || []) as Marina[]);
    } catch (error) {
      console.error("Error fetching marinas:", error);
      toast({
        title: "Error",
        description: "Failed to load marinas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarinas();
  }, []);

  const resetForm = () => {
    setFormData({
      marina_name: "",
      address: "",
      latitude: "",
      longitude: "",
      max_length_ft: "",
      max_beam_ft: "",
      max_draft_ft: "",
      min_depth_ft: "",
      power_options: "",
      accepts_transient: true,
      accepts_longterm: true,
      contact_email: "",
      contact_phone: "",
      description: "",
    });
    setEditingMarina(null);
  };

  const openEdit = (marina: Marina) => {
    setEditingMarina(marina);
    setFormData({
      marina_name: marina.marina_name,
      address: marina.address || "",
      latitude: marina.latitude?.toString() || "",
      longitude: marina.longitude?.toString() || "",
      max_length_ft: marina.max_length_ft?.toString() || "",
      max_beam_ft: marina.max_beam_ft?.toString() || "",
      max_draft_ft: marina.max_draft_ft?.toString() || "",
      min_depth_ft: marina.min_depth_ft?.toString() || "",
      power_options: marina.power_options?.join(", ") || "",
      accepts_transient: marina.accepts_transient,
      accepts_longterm: marina.accepts_longterm,
      contact_email: marina.contact_email || "",
      contact_phone: marina.contact_phone || "",
      description: marina.description || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.marina_name) {
      toast({
        title: "Error",
        description: "Marina name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const marinaData = {
        marina_name: formData.marina_name,
        address: formData.address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        max_length_ft: formData.max_length_ft ? parseFloat(formData.max_length_ft) : null,
        max_beam_ft: formData.max_beam_ft ? parseFloat(formData.max_beam_ft) : null,
        max_draft_ft: formData.max_draft_ft ? parseFloat(formData.max_draft_ft) : null,
        min_depth_ft: formData.min_depth_ft ? parseFloat(formData.min_depth_ft) : null,
        power_options: formData.power_options ? formData.power_options.split(",").map(s => s.trim()).filter(Boolean) : null,
        accepts_transient: formData.accepts_transient,
        accepts_longterm: formData.accepts_longterm,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        description: formData.description || null,
      };

      if (editingMarina) {
        const { error } = await supabase
          .from("marinas")
          .update(marinaData)
          .eq("id", editingMarina.id);
        if (error) throw error;
        toast({ title: "Marina Updated", description: "Marina details have been saved" });
      } else {
        const { error } = await supabase
          .from("marinas")
          .insert({ ...marinaData, manager_id: user.id });
        if (error) throw error;
        toast({ title: "Marina Added", description: "New marina has been created" });
      }

      fetchMarinas();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving marina:", error);
      toast({
        title: "Error",
        description: "Failed to save marina",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marina Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Marina Directory
            </CardTitle>
            <CardDescription>Manage marina listings for discovery</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Marina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMarina ? "Edit Marina" : "Add New Marina"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Marina Name *</Label>
                  <Input
                    id="name"
                    value={formData.marina_name}
                    onChange={(e) => setFormData({ ...formData, marina_name: e.target.value })}
                    placeholder="e.g., Sunset Harbor Marina"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="e.g., 25.7617"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="e.g., -80.1918"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLength">Max Length (ft)</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      value={formData.max_length_ft}
                      onChange={(e) => setFormData({ ...formData, max_length_ft: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBeam">Max Beam (ft)</Label>
                    <Input
                      id="maxBeam"
                      type="number"
                      value={formData.max_beam_ft}
                      onChange={(e) => setFormData({ ...formData, max_beam_ft: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxDraft">Max Draft (ft)</Label>
                    <Input
                      id="maxDraft"
                      type="number"
                      value={formData.max_draft_ft}
                      onChange={(e) => setFormData({ ...formData, max_draft_ft: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minDepth">Min Depth (ft)</Label>
                    <Input
                      id="minDepth"
                      type="number"
                      value={formData.min_depth_ft}
                      onChange={(e) => setFormData({ ...formData, min_depth_ft: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="power">Power Options (comma separated)</Label>
                  <Input
                    id="power"
                    value={formData.power_options}
                    onChange={(e) => setFormData({ ...formData, power_options: e.target.value })}
                    placeholder="e.g., 30A, 50A, 100A"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="transient">Accepts Transient</Label>
                  <Switch
                    id="transient"
                    checked={formData.accepts_transient}
                    onCheckedChange={(checked) => setFormData({ ...formData, accepts_transient: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="longterm">Accepts Long-term</Label>
                  <Switch
                    id="longterm"
                    checked={formData.accepts_longterm}
                    onCheckedChange={(checked) => setFormData({ ...formData, accepts_longterm: checked })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the marina..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingMarina ? "Save Changes" : "Add Marina"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {marinas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No marinas added yet</p>
              <p className="text-sm">Add marinas to enable discovery for boat owners</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {marinas.map((marina) => (
                  <div
                    key={marina.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold">{marina.marina_name}</span>
                          {marina.is_claimed ? (
                            <Badge variant="default">Claimed</Badge>
                          ) : (
                            <Badge variant="secondary">Unclaimed</Badge>
                          )}
                        </div>
                        {marina.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {marina.address}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {marina.max_length_ft && (
                            <Badge variant="outline">Max {marina.max_length_ft}ft</Badge>
                          )}
                          {marina.accepts_transient && (
                            <Badge variant="outline">Transient</Badge>
                          )}
                          {marina.accepts_longterm && (
                            <Badge variant="outline">Long-term</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(marina)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}
