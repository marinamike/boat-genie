import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, Ship, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Boat name is required"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional().or(z.literal("")),
  length_ft: z.coerce.number().min(1).max(500).optional().or(z.literal("")),
  slip_number: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export interface BoatToEdit {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  length_ft?: number | null;
  boat_profiles: {
    slip_number: string | null;
  } | null;
}

interface AddBoatFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  boatToEdit?: BoatToEdit | null;
}

export default function AddBoatForm({ open, onOpenChange, onSuccess, userId, boatToEdit }: AddBoatFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!boatToEdit;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      make: "",
      model: "",
      year: "",
      length_ft: "",
      slip_number: "",
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
        slip_number: boatToEdit.boat_profiles?.slip_number || "",
      });
    } else if (open && !boatToEdit) {
      form.reset({
        name: "",
        make: "",
        model: "",
        year: "",
        length_ft: "",
        slip_number: "",
      });
    }
  }, [open, boatToEdit, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && boatToEdit) {
        // Update existing boat
        const { error: boatError } = await supabase
          .from("boats")
          .update({
            name: data.name,
            make: data.make || null,
            model: data.model || null,
            year: data.year ? Number(data.year) : null,
            length_ft: data.length_ft ? Number(data.length_ft) : null,
          })
          .eq("id", boatToEdit.id);

        if (boatError) throw boatError;

        // Update or create boat_profile
        if (data.slip_number) {
          const { data: existingProfile } = await supabase
            .from("boat_profiles")
            .select("id")
            .eq("boat_id", boatToEdit.id)
            .maybeSingle();

          if (existingProfile) {
            await supabase
              .from("boat_profiles")
              .update({ slip_number: data.slip_number })
              .eq("boat_id", boatToEdit.id);
          } else {
            await supabase
              .from("boat_profiles")
              .insert({ boat_id: boatToEdit.id, slip_number: data.slip_number });
          }
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
          })
          .select("id")
          .single();

        if (boatError) throw boatError;

        // If slip number provided, create boat_profile
        if (data.slip_number && boat) {
          const { error: profileError } = await supabase
            .from("boat_profiles")
            .insert({
              boat_id: boat.id,
              slip_number: data.slip_number,
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
      <DialogContent className="sm:max-w-md">
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

            <FormField
              control={form.control}
              name="slip_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Slip #</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. A-15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
