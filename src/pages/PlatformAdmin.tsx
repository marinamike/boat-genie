// CANONICAL PLATFORM ADMIN — email-gated, uses components/platform-admin/
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CheckCircle, Radar, Users, DollarSign, Scale, Loader2 } from "lucide-react";
import { MarineLoadingScreen } from "@/components/ui/marine-loading";
import { VerificationQueue } from "@/components/platform-admin/VerificationQueue";
import { LeadRadar } from "@/components/platform-admin/LeadRadar";
import { UserBusinessOps } from "@/components/platform-admin/UserBusinessOps";
import { PlatformFinancials } from "@/components/platform-admin/PlatformFinancials";
import { ReviewModeration } from "@/components/platform-admin/ReviewModeration";

const PLATFORM_ADMIN_EMAIL = "info@marinamike.com";

const PlatformAdmin = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate("/");
          return;
        }

        // Strict email check - ONLY info@marinamike.com can access
        if (session.user.email !== PLATFORM_ADMIN_EMAIL) {
          console.warn("Platform Admin: Unauthorized access attempt from", session.user.email);
          navigate("/");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Platform Admin: Auth check failed", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [navigate]);

  if (loading) {
    return <MarineLoadingScreen message="Verifying credentials..." />;
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-destructive text-destructive-foreground">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive-foreground hover:bg-destructive-foreground/10"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive-foreground/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Platform Admin</h1>
              <p className="text-sm opacity-80">Marina Mike Control Center</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4">
        <Tabs defaultValue="verification" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="verification" className="flex flex-col gap-1 py-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Verify</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex flex-col gap-1 py-2">
              <Radar className="w-4 h-4" />
              <span className="text-xs">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col gap-1 py-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">Users</span>
            </TabsTrigger>
            <TabsTrigger value="financials" className="flex flex-col gap-1 py-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex flex-col gap-1 py-2">
              <Scale className="w-4 h-4" />
              <span className="text-xs">Judge</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <VerificationQueue />
          </TabsContent>

          <TabsContent value="leads">
            <LeadRadar />
          </TabsContent>

          <TabsContent value="users">
            <UserBusinessOps />
          </TabsContent>

          <TabsContent value="financials">
            <PlatformFinancials />
          </TabsContent>

          <TabsContent value="moderation">
            <ReviewModeration />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PlatformAdmin;
