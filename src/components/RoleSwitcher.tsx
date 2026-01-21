import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Wrench, Building2, HardHat, Loader2, Crown } from "lucide-react";
import { useState, useEffect } from "react";

const GOD_MODE_EMAIL = "info@marinamike.com";

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
  const { user, role, setRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState<AppRole | null>(null);
  const [isGodModeActive, setIsGodModeActive] = useState(false);

  const hasGodModeAccess = user?.email === GOD_MODE_EMAIL;
  const isOnAdminPage = location.pathname === "/admin";

  useEffect(() => {
    setIsGodModeActive(isOnAdminPage);
  }, [isOnAdminPage]);

  if (!user) return null;

  const handleSetRole = async (newRole: AppRole) => {
    if (newRole === role) return;
    setSwitching(newRole);
    setIsGodModeActive(false);
    await setRole(newRole);
    // Note: page will reload, so switching state doesn't need to be reset
  };

  const handleGodMode = () => {
    setIsGodModeActive(true);
    navigate("/admin");
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 flex items-center justify-between gap-4 text-sm ${
      isGodModeActive 
        ? "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white" 
        : "bg-foreground text-background"
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-medium">Current Role:</span>
        {isGodModeActive ? (
          <Badge className="bg-white/20 text-white font-bold border-white/30">
            <Crown className="w-3 h-3 mr-1" />
            God Mode
          </Badge>
        ) : (
          <Badge className={`${ROLE_COLORS[role]} text-white font-bold`}>
            {ROLE_LABELS[role]}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={role === "boat_owner" && !isGodModeActive ? "default" : "outline"}
          onClick={() => handleSetRole("boat_owner")}
          disabled={loading || switching !== null}
          className="h-7 text-xs"
        >
          {switching === "boat_owner" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <User className="w-3 h-3 mr-1" />
          )}
          Owner
        </Button>

        <Button
          size="sm"
          variant={role === "provider" && !isGodModeActive ? "default" : "outline"}
          onClick={() => handleSetRole("provider")}
          disabled={loading || switching !== null}
          className="h-7 text-xs"
        >
          {switching === "provider" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wrench className="w-3 h-3 mr-1" />
          )}
          Provider
        </Button>

        <Button
          size="sm"
          variant={role === "admin" && !isGodModeActive ? "default" : "outline"}
          onClick={() => handleSetRole("admin")}
          disabled={loading || switching !== null}
          className="h-7 text-xs"
        >
          {switching === "admin" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Building2 className="w-3 h-3 mr-1" />
          )}
          Manager
        </Button>

        <Button
          size="sm"
          variant={role === "marina_staff" && !isGodModeActive ? "default" : "outline"}
          onClick={() => handleSetRole("marina_staff")}
          disabled={loading || switching !== null}
          className="h-7 text-xs"
        >
          {switching === "marina_staff" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <HardHat className="w-3 h-3 mr-1" />
          )}
          Staff
        </Button>

        {hasGodModeAccess && (
          <Button
            size="sm"
            variant={isGodModeActive ? "default" : "outline"}
            onClick={handleGodMode}
            disabled={loading || switching !== null}
            className={`h-7 text-xs ${
              isGodModeActive 
                ? "bg-white/20 hover:bg-white/30 text-white border-white/30" 
                : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 hover:from-yellow-600 hover:to-orange-600"
            }`}
          >
            <Crown className="w-3 h-3 mr-1" />
            God Mode
          </Button>
        )}
      </div>
    </div>
  );
}
