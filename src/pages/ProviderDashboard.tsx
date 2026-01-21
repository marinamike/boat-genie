import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Briefcase, Wrench, Loader2, Package } from "lucide-react";
import { ProviderProfileForm } from "@/components/provider/ProviderProfileForm";
import { ServiceCatalogManager } from "@/components/provider/ServiceCatalogManager";
import { JobBoard } from "@/components/provider/JobBoard";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const ProviderDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);
  const navigate = useNavigate();
  const { profile, toggleAvailability } = useProviderProfile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Check if user has provider role
      const { data: providerData } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "provider",
      });

      if (!providerData) {
        navigate("/dashboard");
        return;
      }

      setIsProvider(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Provider Portal</h1>
                <p className="text-sm text-primary-foreground/80">
                  {profile?.business_name || "Service Provider"}
                </p>
              </div>
            </div>
          </div>
          
          {profile && (
            <div className="flex items-center gap-2">
              <Badge 
                variant={profile.is_available ? "default" : "secondary"}
                className={profile.is_available ? "bg-green-500" : ""}
              >
                {profile.is_available ? "Available" : "Unavailable"}
              </Badge>
              <Switch
                checked={profile.is_available}
                onCheckedChange={toggleAvailability}
              />
            </div>
          )}
        </div>
      </header>

      <main className="px-4 py-6">
        <Tabs defaultValue={profile ? "jobs" : "profile"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            {!profile ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Complete Your Profile First</h3>
                <p className="text-muted-foreground mb-4">
                  Set up your provider profile to start seeing available jobs
                </p>
                <Button onClick={() => {
                  const profileTab = document.querySelector('[value="profile"]');
                  if (profileTab) (profileTab as HTMLElement).click();
                }}>
                  Go to Profile
                </Button>
              </div>
            ) : (
              <JobBoard />
            )}
          </TabsContent>

          <TabsContent value="services">
            {!profile ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Complete Your Profile First</h3>
                <p className="text-muted-foreground mb-4">
                  Set up your provider profile before adding services
                </p>
                <Button onClick={() => {
                  const profileTab = document.querySelector('[value="profile"]');
                  if (profileTab) (profileTab as HTMLElement).click();
                }}>
                  Go to Profile
                </Button>
              </div>
            ) : (
              <ServiceCatalogManager />
            )}
          </TabsContent>

          <TabsContent value="profile">
            <ProviderProfileForm />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProviderDashboard;
