import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Warehouse, ShoppingBag, Fuel, Wrench, LucideIcon } from "lucide-react";
import type { MarinaModule } from "@/hooks/useMarinaSettings";

interface ModuleToggleProps {
  modules: MarinaModule[];
  enabledModules: MarinaModule[];
  onToggle: (module: MarinaModule) => void;
}

const moduleConfig: Record<MarinaModule, { label: string; description: string; icon: LucideIcon }> = {
  dry_stack: {
    label: "Dry Stack",
    description: "Manage dry stack storage and launches",
    icon: Warehouse,
  },
  ship_store: {
    label: "Ship Store",
    description: "Marina store inventory and sales",
    icon: ShoppingBag,
  },
  fuel_dock: {
    label: "Fuel Dock",
    description: "Fuel sales and dock management",
    icon: Fuel,
  },
  service_yard: {
    label: "Service Yard",
    description: "Boat maintenance and repairs",
    icon: Wrench,
  },
};

export function ModuleToggle({ modules, enabledModules, onToggle }: ModuleToggleProps) {
  return (
    <div className="grid gap-3">
      {modules.map((module) => {
        const config = moduleConfig[module];
        const isEnabled = enabledModules.includes(module);
        const Icon = config.icon;

        return (
          <Card 
            key={module} 
            className={`transition-all ${isEnabled ? "border-primary bg-primary/5" : "opacity-75"}`}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <Label htmlFor={module} className="font-semibold cursor-pointer">
                      {config.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <Switch
                  id={module}
                  checked={isEnabled}
                  onCheckedChange={() => onToggle(module)}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ModuleToggle;
