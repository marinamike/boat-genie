import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Wrench, Building2, HardHat, Crown, RotateCcw } from "lucide-react";

const ROLE_LABELS: Record<AppRole, string> = {
  boat_owner: "Owner",
  provider: "Provider",
  admin: "Manager",
  marina_staff: "Staff",
};

const ROLE_COLORS: Record<AppRole, string> = {
  boat_owner: "bg-blue-500",
  provider: "bg-green-500",
  admin: "bg-purple-500",
  marina_staff: "bg-orange-500",
};

export default function RoleSwitcher() {
  const { 
    user, 
    role, 
    isPreviewMode, 
    isGodModeUser, 
    setPreviewRole, 
    clearPreviewRole, 
    loading 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnAdminPage = location.pathname === "/admin";
  const isGodModeActive = isOnAdminPage && !isPreviewMode;

  if (!user || !isGodModeUser) return null;

  const handleSetPreviewRole = (newRole: AppRole) => {
    if (newRole === role && !isGodModeActive) return;
    setPreviewRole(newRole);
  };

  const handleGodMode = () => {
    // Clear preview role and go to admin
    clearPreviewRole();
    navigate("/admin");
  };

  const handleResetToAdmin = () => {
    clearPreviewRole();
    navigate("/admin");
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 flex items-center justify-between gap-4 text-sm ${
      isPreviewMode 
        ? "bg-amber-600 text-white" 
        : isGodModeActive 
          ? "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white" 
          : "bg-foreground text-background"
    }`}>
      <div className="flex items-center gap-2">
        {isPreviewMode ? (
          <>
            <span className="font-medium">Previewing as:</span>
            <Badge className={`${ROLE_COLORS[role]} text-white font-bold`}>
              {ROLE_LABELS[role]}
            </Badge>
            <span className="text-white/70 text-xs">|</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetToAdmin}
              className="h-6 text-xs text-white hover:bg-white/20 px-2"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Return to Admin
            </Button>
          </>
        ) : isGodModeActive ? (
          <>
            <span className="font-medium">Current Role:</span>
            <Badge className="bg-white/20 text-white font-bold border-white/30">
              <Crown className="w-3 h-3 mr-1" />
              God Mode
            </Badge>
          </>
        ) : (
          <>
            <span className="font-medium">Current Role:</span>
            <Badge className={`${ROLE_COLORS[role]} text-white font-bold`}>
              {ROLE_LABELS[role]}
            </Badge>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={role === "boat_owner" && !isGodModeActive ? "default" : "outline"}
          onClick={() => handleSetPreviewRole("boat_owner")}
          disabled={loading}
          className="h-7 text-xs"
        >
          <User className="w-3 h-3 mr-1" />
          Owner
        </Button>

        <Button
          size="sm"
          variant={role === "provider" && !isGodModeActive ? "default" : "outline"}
          onClick={() => handleSetPreviewRole("provider")}
          disabled={loading}
          className="h-7 text-xs"
        >
          <Wrench className="w-3 h-3 mr-1" />
          Provider
        </Button>

        <Button
          size="sm"
          variant={role === "admin" && !isGodModeActive ? "default" : "outline"}
          onClick={() => handleSetPreviewRole("admin")}
          disabled={loading}
          className="h-7 text-xs"
        >
          <Building2 className="w-3 h-3 mr-1" />
          Manager
        </Button>

        <Button
          size="sm"
          variant={role === "marina_staff" && !isGodModeActive ? "default" : "outline"}
          onClick={() => handleSetPreviewRole("marina_staff")}
          disabled={loading}
          className="h-7 text-xs"
        >
          <HardHat className="w-3 h-3 mr-1" />
          Staff
        </Button>

        <Button
          size="sm"
          variant={isGodModeActive ? "default" : "outline"}
          onClick={handleGodMode}
          disabled={loading}
          className={`h-7 text-xs ${
            isGodModeActive 
              ? "bg-white/20 hover:bg-white/30 text-white border-white/30" 
              : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 hover:from-yellow-600 hover:to-orange-600"
          }`}
        >
          <Crown className="w-3 h-3 mr-1" />
          God Mode
        </Button>
      </div>
    </div>
  );
}
