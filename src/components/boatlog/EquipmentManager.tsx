import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Trash2, 
  Anchor, 
  Zap, 
  Waves, 
  CheckCircle2, 
  AlertCircle,
  Edit2,
  Loader2
} from "lucide-react";
import { useBoatEquipment, BoatEquipment, getPositionLabel, ENGINE_POSITION_LABELS, GENERATOR_POSITION_LABELS, SEAKEEPER_POSITION_LABELS } from "@/hooks/useBoatEquipment";
import { useEquipmentSpecs } from "@/hooks/useEquipmentSpecs";
import { useToast } from "@/hooks/use-toast";

interface EquipmentManagerProps {
  boatId: string;
  ownerId: string;
  readOnly?: boolean;
}

type EquipmentType = "engine" | "generator" | "seakeeper";

interface EquipmentFormData {
  brand: string;
  model: string;
  serial_number: string;
  current_hours: number;
  position_label: string;
}

const defaultFormData: EquipmentFormData = {
  brand: "",
  model: "",
  serial_number: "",
  current_hours: 0,
  position_label: "",
};

export function EquipmentManager({ boatId, ownerId, readOnly = false }: EquipmentManagerProps) {
  const { equipment, addEquipment, updateEquipment, deleteEquipment, loading, engines, generators, seakeepers } = useBoatEquipment(boatId);
  const { getEngineBrands, getGeneratorBrands, getSeakeeperModels, getModelsForBrand, findSpec } = useEquipmentSpecs();
  const { toast } = useToast();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<BoatEquipment | null>(null);
  const [selectedType, setSelectedType] = useState<EquipmentType>("engine");
  const [formData, setFormData] = useState<EquipmentFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = (type: EquipmentType) => {
    setSelectedType(type);
    // Get available positions for this type
    const usedLabels = equipment.filter(e => e.equipment_type === type).map(e => e.position_label);
    const availableLabels = getPositionLabelsForType(type).filter(l => !usedLabels.includes(l));
    setFormData({ ...defaultFormData, position_label: availableLabels[0] || "" });
    setEditingEquipment(null);
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: BoatEquipment) => {
    setSelectedType(item.equipment_type as EquipmentType);
    setFormData({
      brand: item.brand,
      model: item.model,
      serial_number: item.serial_number || "",
      current_hours: item.current_hours,
      position_label: item.position_label || "",
    });
    setEditingEquipment(item);
    setAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.brand || !formData.model) {
      toast({ title: "Please fill in brand and model", variant: "destructive" });
      return;
    }
    if (!formData.position_label) {
      toast({ title: "Please select a position", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, {
          brand: formData.brand,
          model: formData.model,
          serial_number: formData.serial_number || null,
          current_hours: formData.current_hours,
          position_label: formData.position_label,
        });
        toast({ title: "Equipment updated" });
      } else {
        await addEquipment({
          equipment_type: selectedType,
          brand: formData.brand,
          model: formData.model,
          serial_number: formData.serial_number || null,
          current_hours: formData.current_hours,
          position_label: formData.position_label,
        }, ownerId);
        toast({ title: "Equipment added", description: "Manual and service schedule auto-populated if available." });
      }
      setAddDialogOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      toast({ title: "Error saving equipment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEquipment(id);
      toast({ title: "Equipment removed" });
    } catch (error) {
      toast({ title: "Error removing equipment", variant: "destructive" });
    }
  };

  const getBrands = () => {
    if (selectedType === "engine") return getEngineBrands();
    if (selectedType === "generator") return getGeneratorBrands();
    return ["Seakeeper"];
  };

  const getModels = () => {
    if (selectedType === "seakeeper") return getSeakeeperModels();
    return formData.brand ? getModelsForBrand(selectedType, formData.brand) : [];
  };

  const getPositionLabelsForType = (type: EquipmentType) => {
    if (type === "engine") return ENGINE_POSITION_LABELS;
    if (type === "generator") return GENERATOR_POSITION_LABELS;
    return SEAKEEPER_POSITION_LABELS;
  };

  const getAvailablePositions = () => {
    const allLabels = getPositionLabelsForType(selectedType);
    const usedLabels = equipment
      .filter(e => e.equipment_type === selectedType && e.id !== editingEquipment?.id)
      .map(e => e.position_label);
    return allLabels.filter(l => !usedLabels.includes(l));
  };

  const spec = formData.brand && formData.model 
    ? findSpec(selectedType, selectedType === "seakeeper" ? "Seakeeper" : formData.brand, formData.model)
    : null;

  const EquipmentIcon = ({ type }: { type: EquipmentType }) => {
    if (type === "engine") return <Anchor className="w-4 h-4" />;
    if (type === "generator") return <Zap className="w-4 h-4" />;
    return <Waves className="w-4 h-4" />;
  };

  const renderEquipmentList = (items: BoatEquipment[], type: EquipmentType, title: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EquipmentIcon type={type} />
          <h4 className="font-medium">{title}</h4>
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        </div>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={() => handleOpenAdd(type)}>
            <Plus className="w-3 h-3 mr-1" />
            Add {type === "engine" ? "Engine" : type === "generator" ? "Generator" : "Seakeeper"}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No {title.toLowerCase()} added yet</p>
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <EquipmentCard 
              key={item.id} 
              item={item} 
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDelete(item.id)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Propulsion & Systems</h3>
        <p className="text-sm text-muted-foreground">
          Manage your vessel's engines, generators, and stabilization systems
        </p>
      </div>

      <div className="space-y-6">
        {renderEquipmentList(engines, "engine", "Engines")}
        <Separator />
        {renderEquipmentList(generators, "generator", "Generators")}
        <Separator />
        {renderEquipmentList(seakeepers, "seakeeper", "Seakeepers")}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEquipment ? `Edit ${selectedType}` : `Add ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`}
            </DialogTitle>
            <DialogDescription>
              {editingEquipment 
                ? `Update ${editingEquipment.position_label || selectedType} details`
                : `Add a new ${selectedType} to your vessel`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Position */}
            <div className="space-y-2">
              <Label>Position</Label>
              <Select 
                value={formData.position_label} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, position_label: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePositions().map((label) => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select 
                value={formData.brand} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, brand: v, model: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {getBrands().map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label>Model</Label>
              {formData.brand && formData.brand !== "other" && getModels().length > 0 ? (
                <Select 
                  value={formData.model} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, model: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModels().map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  placeholder="e.g. F300" 
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                />
              )}
              {spec && (
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Manual & service schedule available
                </Badge>
              )}
              {formData.brand && formData.model && !spec && (
                <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Upload manual in Digital Locker
                </Badge>
              )}
            </div>

            {/* Serial Number */}
            <div className="space-y-2">
              <Label>Serial Number (Optional)</Label>
              <Input 
                placeholder="e.g. YAM-2024-12345"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              />
            </div>

            {/* Current Hours */}
            <div className="space-y-2">
              <Label>Current Hours</Label>
              <Input 
                type="number"
                placeholder="e.g. 450"
                value={formData.current_hours || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, current_hours: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingEquipment ? "Save Changes" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EquipmentCardProps {
  item: BoatEquipment;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

function EquipmentCard({ item, onEdit, onDelete, readOnly }: EquipmentCardProps) {
  const hasManual = !!item.manual_url;

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium truncate">{item.brand} {item.model}</span>
              {hasManual && (
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Manual
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="text-primary font-medium">{item.position_label}</span>
              <span>{item.current_hours} hrs</span>
              {item.serial_number && (
                <span className="truncate">SN: {item.serial_number}</span>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1 shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EquipmentManager;
