import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Ship, Wrench, Fuel, Store, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type BusinessModule = Database["public"]["Enums"]["business_module"];

const modules: { id: BusinessModule; label: string; description: string; icon: React.ElementType }[] = [
  { id: "slips", label: "Slip Management", description: "Manage dock slips and reservations", icon: Ship },
  { id: "service", label: "Service Yard", description: "Work orders and service provider coordination", icon: Wrench },
  { id: "fuel", label: "Fuel Dock", description: "Fuel sales and inventory tracking", icon: Fuel },
  { id: "ship_store", label: "Ship Store", description: "Retail and inventory management", icon: Store },
];

export function ModuleManager() {
  const { business, enabledModules, refreshBusiness, isOwner } = useBusiness();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<BusinessModule | null>(null);

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Modules</CardTitle>
          <CardDescription>Only business owners can manage modules.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleToggle = async (moduleId: BusinessModule, enabled: boolean) => {
    if (!business) return;

    setUpdating(moduleId);
    try {
      const newModules = enabled
        ? [...enabledModules, moduleId]
        : enabledModules.filter((m) => m !== moduleId);

      const { error } = await supabase
        .from("businesses")
        .update({ enabled_modules: newModules })
        .eq("id", business.id);

      if (error) throw error;

      await refreshBusiness();
      toast({
        title: enabled ? "Module Enabled" : "Module Disabled",
        description: `${modules.find((m) => m.id === moduleId)?.label} has been ${enabled ? "enabled" : "disabled"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update module",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Modules</CardTitle>
        <CardDescription>
          Enable or disable revenue streams for your business. Each module adds new features and navigation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules.map((module) => {
          const Icon = module.icon;
          const isEnabled = enabledModules.includes(module.id);
          const isUpdating = updating === module.id;

          return (
            <div
              key={module.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <Label className="font-medium">{module.label}</Label>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(module.id, checked)}
                  disabled={isUpdating}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
