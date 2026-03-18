import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModuleManager } from "@/components/business/ModuleManager";
import { StaffManager } from "@/components/business/StaffManager";
import { BusinessSetupForm } from "@/components/business/BusinessSetupForm";
import { FuelSetupTab } from "@/components/business/FuelSetupTab";
import { StoreSetupTab } from "@/components/business/StoreSetupTab";
import { ServiceSetupTab } from "@/components/business/ServiceSetupTab";
import { SlipsSetupTab } from "@/components/business/SlipsSetupTab";
import { useBusiness } from "@/contexts/BusinessContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Building2, Users, Wrench, Anchor, Fuel, Store, User, LogOut, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PLATFORM_ADMIN_EMAIL = "info@marinamike.com";

export default function BusinessSettings() {
  const { business, isOwner, loading } = useBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate("/login");
  };

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
      <div className="container max-w-2xl mx-auto p-4 pt-8 space-y-6">
        <BusinessSetupForm />
        
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground">{business.business_name}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="profile" className="flex items-center gap-1.5 px-3">
              <Building2 className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-1.5 px-3">
              <Wrench className="w-4 h-4" />
              <span>Service</span>
            </TabsTrigger>
            <TabsTrigger value="slips" className="flex items-center gap-1.5 px-3">
              <Anchor className="w-4 h-4" />
              <span>Slips</span>
            </TabsTrigger>
            <TabsTrigger value="fuel" className="flex items-center gap-1.5 px-3">
              <Fuel className="w-4 h-4" />
              <span>Fuel</span>
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-1.5 px-3">
              <Store className="w-4 h-4" />
              <span>Store</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-1.5 px-3">
              <Users className="w-4 h-4" />
              <span>Staff</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-1.5 px-3">
              <User className="w-4 h-4" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="profile" className="mt-4 space-y-6">
          <BusinessSetupForm />
          <ModuleManager />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <StaffManager />
        </TabsContent>

        <TabsContent value="service" className="mt-4">
          <ServiceSetupTab />
        </TabsContent>

        <TabsContent value="slips" className="mt-4">
          <SlipsSetupTab />
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          <FuelSetupTab />
        </TabsContent>

        <TabsContent value="store" className="mt-4">
          <StoreSetupTab />
        </TabsContent>

        <TabsContent value="account" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              <Separator />

              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>

              {user?.email === PLATFORM_ADMIN_EMAIL && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/platform-admin")}
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Platform Admin
                </Button>
              )}

              <Separator />

              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
