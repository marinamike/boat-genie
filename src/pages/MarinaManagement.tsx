import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowLeft } from "lucide-react";
import { useMarinaSettings } from "@/hooks/useMarinaSettings";
import { useWelcomePacket } from "@/hooks/useWelcomePacket";
import { StagingDockView } from "@/components/marina/StagingDockView";
import { SlipManager } from "@/components/marina/SlipManager";
import { WelcomePacketManager } from "@/components/marina/WelcomePacketManager";
import { QRCodeGenerator } from "@/components/marina/QRCodeGenerator";
import { AdminProviderReview } from "@/components/provider/AdminProviderReview";
import { LiveDockList } from "@/components/marina/LiveDockList";
import { ReservationManager } from "@/components/marina/ReservationManager";
import { MarinaProfileEditor } from "@/components/marina/MarinaProfileEditor";
import { MarinaSeedButton } from "@/components/marina/MarinaSeedButton";
import { useAuth } from "@/contexts/AuthContext";
// BottomNav removed - handled by StaffLayout


interface Marina {
  id: string;
  marina_name: string;
  address: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  max_length_ft: number | null;
  max_beam_ft: number | null;
  max_draft_ft: number | null;
  min_depth_ft: number | null;
  power_options: string[] | null;
  transient_rate_per_ft: number | null;
  monthly_base_rate: number | null;
  require_insurance_long_term: boolean;
  require_registration: boolean;
  auto_approve_transient: boolean;
  fuel_gas: boolean;
  fuel_diesel: boolean;
  has_pool: boolean;
  has_pumpout: boolean;
  has_laundry: boolean;
  has_restaurant: boolean;
  has_security: boolean;
  has_wifi: boolean;
  photos: string[];
  accepts_transient: boolean;
  accepts_longterm: boolean;
}

const MarinaManagement = () => {
  const [loading, setLoading] = useState(true);
  const [marina, setMarina] = useState<Marina | null>(null);
  const navigate = useNavigate();
  const { isGodModeUser } = useAuth();

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

  const fetchMarina = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch marina managed by this user
    const { data } = await supabase
      .from("marinas")
      .select("*")
      .eq("manager_id", user.id)
      .maybeSingle();

    if (data) {
      const marinaData = data as any;
      setMarina({
        ...marinaData,
        photos: Array.isArray(marinaData.photos) ? marinaData.photos : [],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMarina();
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
              <h1 className="font-bold text-lg">{marina?.marina_name || settings?.marina_name || "Marina Management"}</h1>
              <p className="text-sm text-primary-foreground/80">Manager Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Marina Profile Editor - Only show if user has a marina */}
        {marina && (
          <MarinaProfileEditor marina={marina} onSave={fetchMarina} />
        )}

        {/* Who's on Site - Live Dock List */}
        <LiveDockList />

        {/* Reservation Manager */}
        <ReservationManager />

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
          marinaId={settings?.id || marina?.id || null}
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

        {/* God Mode: Marina Seed Button */}
        {isGodModeUser && <MarinaSeedButton />}

        {/* God Mode: Admin Provider Review */}
        {isGodModeUser && <AdminProviderReview />}
      </main>

      {/* BottomNav handled by StaffLayout */}
    </div>
  );
};

export default MarinaManagement;
