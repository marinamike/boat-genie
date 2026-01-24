import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowLeft } from "lucide-react";
import { useMarinaSettings } from "@/hooks/useMarinaSettings";
import { SlipManager } from "@/components/marina/SlipManager";

const MarinaSlipsPage = () => {
  const navigate = useNavigate();
  const { 
    slips, 
    moveBoatToSlip, 
    removeBoatFromSlip,
    isModuleEnabled,
    loading 
  } = useMarinaSettings();

  if (loading) {
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground" 
            onClick={() => navigate("/marina")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">Slip Management</h1>
            <p className="text-sm text-primary-foreground/80">Dock Map & Assignments</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <SlipManager
          slips={slips}
          onMoveBoat={moveBoatToSlip}
          onRemoveBoat={removeBoatFromSlip}
          showDryStack={isModuleEnabled("dry_stack")}
        />
      </main>
    </div>
  );
};

export default MarinaSlipsPage;
