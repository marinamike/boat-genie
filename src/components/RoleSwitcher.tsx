import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Wrench, Building2, HardHat, Loader2 } from "lucide-react";
import { useState } from "react";

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
  const [switching, setSwitching] = useState<AppRole | null>(null);

  if (!user) return null;

  const handleSetRole = async (newRole: AppRole) => {
    if (newRole === role) return;
    setSwitching(newRole);
    await setRole(newRole);
    // Note: page will reload, so switching state doesn't need to be reset
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-foreground text-background px-4 py-2 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">Current Role:</span>
        <Badge className={`${ROLE_COLORS[role]} text-white font-bold`}>
          {ROLE_LABELS[role]}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={role === "boat_owner" ? "default" : "outline"}
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
          variant={role === "provider" ? "default" : "outline"}
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
          variant={role === "admin" ? "default" : "outline"}
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
          variant={role === "marina_staff" ? "default" : "outline"}
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
      </div>
    </div>
  );
}
