import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Building2, Users, Wrench, Anchor, Fuel, Store, User, LogOut, Shield, Save, Loader2, ClipboardCheck, DollarSign } from "lucide-react";
import { FeesSetupTab } from "@/components/business/FeesSetupTab";
import { InsuranceVaultForm } from "@/components/provider/InsuranceVaultForm";
import { BankSetupForm } from "@/components/provider/BankSetupForm";
import { TaxInfoForm } from "@/components/provider/TaxInfoForm";
import { TermsAcceptanceForm } from "@/components/provider/TermsAcceptanceForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PLATFORM_ADMIN_EMAIL = "info@marinamike.com";

export default function BusinessSettings() {
  const { business, isOwner, loading } = useBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
        }
      });
  }, [user]);

  useEffect(() => {
    if (business) {
      setBusinessName(business.business_name || "");
      setBusinessAddress(business.address || "");
    }
  }, [business]);

  const handleSaveAllProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const [profileRes, businessRes] = await Promise.all([
        supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id),
        business
          ? supabase.from("businesses").update({ business_name: businessName.trim(), address: businessAddress.trim() || null }).eq("id", business.id)
          : Promise.resolve({ error: null }),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (businessRes.error) throw businessRes.error;
      toast({ title: "Saved", description: "Profile updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };



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

      <Tabs defaultValue="account" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="account" className="flex items-center gap-1.5 px-3">
              <User className="w-4 h-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="slips" className="flex items-center gap-1.5 px-3">
              <Anchor className="w-4 h-4" />
              <span>Slips</span>
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-1.5 px-3">
              <Wrench className="w-4 h-4" />
              <span>Service</span>
            </TabsTrigger>
            <TabsTrigger value="fuel" className="flex items-center gap-1.5 px-3">
              <Fuel className="w-4 h-4" />
              <span>Fuel</span>
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-1.5 px-3">
              <Store className="w-4 h-4" />
              <span>Store</span>
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-1.5 px-3">
              <DollarSign className="w-4 h-4" />
              <span>Fees</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-1.5 px-3">
              <Users className="w-4 h-4" />
              <span>Staff</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-1.5 px-3">
              <ClipboardCheck className="w-4 h-4" />
              <span>Compliance</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="account" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your business and personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Sunset Marina"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="123 Harbor Way, Miami, FL"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
              </div>
              <Button onClick={handleSaveAllProfile} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <ModuleManager />

          <Separator />

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

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
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

        <TabsContent value="compliance" className="mt-4 space-y-6">
          <InsuranceVaultForm />
          <TaxInfoForm />
          <BankSetupForm />
          <TermsAcceptanceForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
