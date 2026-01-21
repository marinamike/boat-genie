import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Ship, Trash2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EquipmentSection } from "@/components/boatlog/EquipmentSection";
import {
  useEquipmentSpecs,
  createMaintenanceRecommendations,
  addManualToDigitalLocker,
} from "@/hooks/useEquipmentSpecs";

const formSchema = z.object({
  name: z.string().min(1, "Boat name is required"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional().or(z.literal("")),
  length_ft: z.coerce.number().min(1).max(500).optional().or(z.literal("")),
  marina_name: z.string().optional(),
  slip_number: z.string().optional(),
  gate_code: z.string().optional(),
  special_instructions: z.string().optional(),
  // Equipment fields
  engine_brand: z.string().optional(),
  engine_model: z.string().optional(),
  engine_hours: z.coerce.number().min(0).optional().or(z.literal("")),
  generator_brand: z.string().optional(),
  generator_model: z.string().optional(),
  generator_hours: z.coerce.number().min(0).optional().or(z.literal("")),
  seakeeper_model: z.string().optional(),
  seakeeper_hours: z.coerce.number().min(0).optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export interface BoatToEdit {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  length_ft?: number | null;
  engine_brand?: string | null;
  engine_model?: string | null;
  engine_hours?: number | null;
  generator_brand?: string | null;
  generator_model?: string | null;
  generator_hours?: number | null;
  seakeeper_model?: string | null;
  seakeeper_hours?: number | null;
  boat_profiles: {
    marina_name: string | null;
    slip_number: string | null;
    gate_code: string | null;
    special_instructions: string | null;
  } | null;
}

interface AddBoatFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  boatToEdit?: BoatToEdit | null;
}

interface EquipmentMatches {
  engine: { specId: string | null; manualUrl: string | null };
  generator: { specId: string | null; manualUrl: string | null };
  seakeeper: { specId: string | null; manualUrl: string | null };
}

export default function AddBoatForm({ open, onOpenChange, onSuccess, userId, boatToEdit }: AddBoatFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [equipmentMatches, setEquipmentMatches] = useState<EquipmentMatches>({
    engine: { specId: null, manualUrl: null },
    generator: { specId: null, manualUrl: null },
    seakeeper: { specId: null, manualUrl: null },
  });
  const { toast } = useToast();
  const { findSpec, specs } = useEquipmentSpecs();

  const isEditMode = !!boatToEdit;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      make: "",
      model: "",
      year: "",
      length_ft: "",
      marina_name: "",
      slip_number: "",
      gate_code: "",
      special_instructions: "",
      engine_brand: "",
      engine_model: "",
      engine_hours: "",
      generator_brand: "",
      generator_model: "",
      generator_hours: "",
      seakeeper_model: "",
      seakeeper_hours: "",
    },
  });

  // Reset form when dialog opens/closes or boatToEdit changes
  useEffect(() => {
    if (open && boatToEdit) {
      form.reset({
        name: boatToEdit.name || "",
        make: boatToEdit.make || "",
        model: boatToEdit.model || "",
        year: boatToEdit.year || "",
        length_ft: boatToEdit.length_ft || "",
        marina_name: boatToEdit.boat_profiles?.marina_name || "",
        slip_number: boatToEdit.boat_profiles?.slip_number || "",
        gate_code: boatToEdit.boat_profiles?.gate_code || "",
        special_instructions: boatToEdit.boat_profiles?.special_instructions || "",
        engine_brand: boatToEdit.engine_brand || "",
        engine_model: boatToEdit.engine_model || "",
        engine_hours: boatToEdit.engine_hours || "",
        generator_brand: boatToEdit.generator_brand || "",
        generator_model: boatToEdit.generator_model || "",
        generator_hours: boatToEdit.generator_hours || "",
        seakeeper_model: boatToEdit.seakeeper_model || "",
        seakeeper_hours: boatToEdit.seakeeper_hours || "",
      });
    } else if (open && !boatToEdit) {
      form.reset({
        name: "",
        make: "",
        model: "",
        year: "",
        length_ft: "",
        marina_name: "",
        slip_number: "",
        gate_code: "",
        special_instructions: "",
        engine_brand: "",
        engine_model: "",
        engine_hours: "",
        generator_brand: "",
        generator_model: "",
        generator_hours: "",
        seakeeper_model: "",
        seakeeper_hours: "",
      });
    }
  }, [open, boatToEdit, form]);

  const handleEquipmentMatch = useCallback(
    (type: "engine" | "generator" | "seakeeper", specId: string | null, manualUrl: string | null) => {
      setEquipmentMatches((prev) => ({
        ...prev,
        [type]: { specId, manualUrl },
      }));
    },
    []
  );

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let boatId: string;

      if (isEditMode && boatToEdit) {
        boatId = boatToEdit.id;
        // Update existing boat
        const { error: boatError } = await supabase
          .from("boats")
          .update({
            name: data.name,
            make: data.make || null,
            model: data.model || null,
            year: data.year ? Number(data.year) : null,
            length_ft: data.length_ft ? Number(data.length_ft) : null,
            engine_brand: data.engine_brand || null,
            engine_model: data.engine_model || null,
            engine_hours: data.engine_hours ? Number(data.engine_hours) : 0,
            generator_brand: data.generator_brand || null,
            generator_model: data.generator_model || null,
            generator_hours: data.generator_hours ? Number(data.generator_hours) : 0,
            seakeeper_model: data.seakeeper_model || null,
            seakeeper_hours: data.seakeeper_hours ? Number(data.seakeeper_hours) : 0,
          })
          .eq("id", boatToEdit.id);

        if (boatError) throw boatError;

        // Update or create boat_profile
        const profileData = {
          marina_name: data.marina_name || null,
          slip_number: data.slip_number || null,
          gate_code: data.gate_code || null,
          special_instructions: data.special_instructions || null,
        };

        const { data: existingProfile } = await supabase
          .from("boat_profiles")
          .select("id")
          .eq("boat_id", boatToEdit.id)
          .maybeSingle();

        if (existingProfile) {
          await supabase
            .from("boat_profiles")
            .update(profileData)
            .eq("boat_id", boatToEdit.id);
        } else {
          await supabase
            .from("boat_profiles")
            .insert({ boat_id: boatToEdit.id, ...profileData });
        }

        toast({
          title: "Boat updated!",
          description: `${data.name} has been updated.`,
        });
      } else {
        // Create new boat
        const { data: boat, error: boatError } = await supabase
          .from("boats")
          .insert({
            owner_id: userId,
            name: data.name,
            make: data.make || null,
            model: data.model || null,
            year: data.year ? Number(data.year) : null,
            length_ft: data.length_ft ? Number(data.length_ft) : null,
            engine_brand: data.engine_brand || null,
            engine_model: data.engine_model || null,
            engine_hours: data.engine_hours ? Number(data.engine_hours) : 0,
            generator_brand: data.generator_brand || null,
            generator_model: data.generator_model || null,
            generator_hours: data.generator_hours ? Number(data.generator_hours) : 0,
            seakeeper_model: data.seakeeper_model || null,
            seakeeper_hours: data.seakeeper_hours ? Number(data.seakeeper_hours) : 0,
          })
          .select("id")
          .single();

        if (boatError) throw boatError;
        boatId = boat.id;

        // Create boat_profile with all fields
        if (boat) {
          const { error: profileError } = await supabase
            .from("boat_profiles")
            .insert({
              boat_id: boat.id,
              marina_name: data.marina_name || null,
              slip_number: data.slip_number || null,
              gate_code: data.gate_code || null,
              special_instructions: data.special_instructions || null,
            });

          if (profileError) {
            console.error("Failed to create boat profile:", profileError);
          }
        }

        toast({
          title: "Boat added!",
          description: `${data.name} has been added to your fleet.`,
        });
      }

      // Auto-add manuals and create maintenance recommendations for matched equipment
      const processEquipment = async (
        type: "engine" | "generator" | "seakeeper",
        brand: string | undefined,
        model: string | undefined,
        hours: number
      ) => {
        if (!brand || !model) return;
        const actualBrand = type === "seakeeper" ? "Seakeeper" : brand;
        const spec = specs.find(
          (s) =>
            s.equipment_type === type &&
            s.brand.toLowerCase() === actualBrand.toLowerCase() &&
            s.model.toLowerCase() === model.toLowerCase()
        );

        if (spec) {
          await addManualToDigitalLocker(boatId, userId, spec);
          await createMaintenanceRecommendations(boatId, spec, hours);
        }
      };

      await Promise.all([
        processEquipment("engine", data.engine_brand, data.engine_model, Number(data.engine_hours) || 0),
        processEquipment("generator", data.generator_brand, data.generator_model, Number(data.generator_hours) || 0),
        processEquipment("seakeeper", "Seakeeper", data.seakeeper_model, Number(data.seakeeper_hours) || 0),
      ]);

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save boat:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save boat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!boatToEdit) return;

    setIsDeleting(true);
    try {
      // Delete boat_profiles first (due to foreign key)
      await supabase
        .from("boat_profiles")
        .delete()
        .eq("boat_id", boatToEdit.id);

      // Delete boat_logs
      await supabase
        .from("boat_logs")
        .delete()
        .eq("boat_id", boatToEdit.id);

      // Delete the boat
      const { error } = await supabase
        .from("boats")
        .delete()
        .eq("id", boatToEdit.id);

      if (error) throw error;

      toast({
        title: "Boat deleted",
        description: `${boatToEdit.name} has been removed from your fleet.`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to delete boat:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete boat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Ship className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>{isEditMode ? "Edit Boat" : "Add Your Boat"}</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Update your vessel details" : "Enter your vessel details below"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Vessel Details */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Boat Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sea Breeze" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Boston Whaler" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Outrage 280" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 2022" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="length_ft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 28" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            {/* Equipment Section */}
            <EquipmentSection form={form} onEquipmentMatch={handleEquipmentMatch} />

            <Separator className="my-4" />

            {/* Location Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Location & Access</h4>
              
              <FormField
                control={form.control}
                name="marina_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marina Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sunset Harbor Marina" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slip_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slip Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. A-15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            {/* Security Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Security (Private)</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                This information is hidden by default and only shared with service providers after a work order is accepted.
              </p>
              
              <FormField
                control={form.control}
                name="gate_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gate Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234#" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="special_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g. Key is under the dock box. Enter through the side gate after hours."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              {isEditMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      disabled={isSubmitting || isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this boat?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure? This will permanently delete <strong>{boatToEdit?.name}</strong> and its associated log. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  isEditMode ? "Update Boat" : "Save Boat"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
