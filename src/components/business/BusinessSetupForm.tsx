import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Loader2, Ship, Wrench, Fuel, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type BusinessModule = Database["public"]["Enums"]["business_module"];

interface ModuleOption {
  id: BusinessModule;
  label: string;
  description: string;
  icon: React.ElementType;
}

const MODULE_OPTIONS: ModuleOption[] = [
  { id: "slips", label: "Slips & Storage", description: "Manage dock slips and boat storage", icon: Ship },
  { id: "service", label: "Service Yard", description: "Handle work orders and repairs", icon: Wrench },
  { id: "fuel", label: "Fuel Dock", description: "Fuel sales and pump management", icon: Fuel },
  { id: "ship_store", label: "Ship Store", description: "Retail and point-of-sale", icon: Store },
];

export function BusinessSetupForm() {
  const { user } = useAuth();
  const { refreshBusiness } = useBusiness();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedModules, setSelectedModules] = useState<BusinessModule[]>([]);

  const toggleModule = (moduleId: BusinessModule) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    if (!businessName.trim()) {
      toast({ title: "Required", description: "Please enter a business name.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("businesses").insert({
        owner_id: user.id,
        business_name: businessName.trim(),
        address: address.trim() || null,
        enabled_modules: selectedModules,
      });

      if (error) throw error;

      toast({
        title: "Business Created",
        description: `${businessName} has been set up successfully!`,
      });

      await refreshBusiness();
    } catch (error: any) {
      console.error("Error creating business:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create business.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="text-center">
        <Building2 className="w-12 h-12 mx-auto text-primary mb-2" />
        <CardTitle>Set Up Your Business</CardTitle>
        <CardDescription>
          Create your business profile to start managing your marina or service operations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Sunset Marina"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Harbor Way, Miami, FL"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Select Modules to Enable</Label>
            <p className="text-sm text-muted-foreground">
              Choose which revenue streams you want to manage. You can change these later.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODULE_OPTIONS.map((module) => {
                const Icon = module.icon;
                const isSelected = selectedModules.includes(module.id);

                return (
                  <div
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleModule(module.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{module.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Business"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
