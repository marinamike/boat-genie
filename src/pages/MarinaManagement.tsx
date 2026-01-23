import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Anchor, ArrowLeft, Settings } from "lucide-react";
import { useMarinaSettings, MarinaModule } from "@/hooks/useMarinaSettings";
import { useWelcomePacket } from "@/hooks/useWelcomePacket";
import { ModuleToggle } from "@/components/marina/ModuleToggle";
import { StagingDockView } from "@/components/marina/StagingDockView";
import { SlipManager } from "@/components/marina/SlipManager";
import { WelcomePacketManager } from "@/components/marina/WelcomePacketManager";
import { QRCodeGenerator } from "@/components/marina/QRCodeGenerator";
import { AdminProviderReview } from "@/components/provider/AdminProviderReview";
// BottomNav removed - handled by StaffLayout

const ALL_MODULES: MarinaModule[] = ["dry_stack", "ship_store", "fuel_dock", "service_yard"];

const MarinaManagement = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { 
    settings, 
    slips, 
    toggleModule, 
    updateCapacity, 
    moveBoatToSlip, 
    removeBoatFromSlip,
    isModuleEnabled,
    stagingStats,
    loading: settingsLoading 
  } = useMarinaSettings();

  const {
    files,
    uploading,
    uploadFile,
    deleteFile,
    toggleFileActive,
  } = useWelcomePacket();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data } = await supabase.rpc("is_admin");
      setIsAdmin(!!data);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Anchor className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Anchor className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{settings?.marina_name || "Marina Management"}</h1>
              <p className="text-sm text-primary-foreground/80">Manager Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Module Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Plug-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleToggle
              modules={ALL_MODULES}
              enabledModules={settings?.enabled_modules || []}
              onToggle={toggleModule}
            />
          </CardContent>
        </Card>

        {/* Staging Dock */}
        <StagingDockView
          stagingSlips={stagingStats.stagingSlips}
          totalCapacityFt={stagingStats.capacityFt}
          currentFootage={stagingStats.totalStagingFootage}
          capacityPercentage={stagingStats.capacityPercentage}
          isOverCapacity={stagingStats.isOverCapacity}
          onUpdateCapacity={updateCapacity}
        />

        {/* Slip Manager with Drag & Drop */}
        <SlipManager
          slips={slips}
          onMoveBoat={moveBoatToSlip}
          onRemoveBoat={removeBoatFromSlip}
          showDryStack={isModuleEnabled("dry_stack")}
        />

        {/* QR Code Generator */}
        <QRCodeGenerator
          marinaId={settings?.id || null}
          slips={slips}
        />

        {/* Welcome Packet */}
        <WelcomePacketManager
          files={files}
          uploading={uploading}
          onUpload={uploadFile}
          onDelete={deleteFile}
          onToggleActive={toggleFileActive}
        />

        {/* Admin Provider Review */}
        {isAdmin && <AdminProviderReview />}
      </main>

      {/* BottomNav handled by StaffLayout */}
    </div>
  );
};

export default MarinaManagement;
