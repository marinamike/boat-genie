import { ModuleManager } from "@/components/business/ModuleManager";
import { StaffManager } from "@/components/business/StaffManager";
import { BusinessSetupForm } from "@/components/business/BusinessSetupForm";
import { useBusiness } from "@/contexts/BusinessContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Puzzle } from "lucide-react";

export default function BusinessSettings() {
  const { business, isOwner, loading } = useBusiness();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show setup form if no business exists
  if (!business) {
    return (
      <div className="container max-w-2xl mx-auto p-4 pt-8">
        <BusinessSetupForm />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground">{business.business_name}</p>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Puzzle className="w-4 h-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-4">
          <ModuleManager />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <StaffManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
