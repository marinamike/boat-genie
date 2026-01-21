import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Bug, User, Wrench, Building2, HardHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ADMIN_EMAIL = "info@marinamike.com";

const ROLES: { role: AppRole; label: string; icon: React.ReactNode }[] = [
  { role: "boat_owner", label: "Boat Owner", icon: <User className="w-4 h-4" /> },
  { role: "provider", label: "Provider", icon: <Wrench className="w-4 h-4" /> },
  { role: "admin", label: "Marina Manager", icon: <Building2 className="w-4 h-4" /> },
  { role: "marina_staff", label: "Marina Staff", icon: <HardHat className="w-4 h-4" /> },
];

const TestingPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<AppRole | null>(null);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsVisible(true);
        setUserId(session.user.id);
        
        // Fetch current roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (rolesError) {
          console.error("TestingPanel: failed to load roles", rolesError);
        }

        const roles = (rolesData ?? []).map((r) => r.role as AppRole);
        setAllRoles(roles);
        setCurrentRole(roles[0] ?? null);
      }
    };

    checkAdminAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsVisible(true);
        setUserId(session.user.id);
        
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (rolesError) {
          console.error("TestingPanel: failed to load roles", rolesError);
        }

        const roles = (rolesData ?? []).map((r) => r.role as AppRole);
        setAllRoles(roles);
        setCurrentRole(roles[0] ?? null);
      } else {
        setIsVisible(false);
        setUserId(null);
        setAllRoles([]);
        setCurrentRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchRole = async (newRole: AppRole) => {
    if (!userId || isLoading) return;
    
    setIsLoading(true);
    setLastError(null);
    setLastAction(`Switching to ${newRole}…`);
    try {
      // Keep a SINGLE active role per user by updating the existing row.
      // (There is no delete policy on user_roles, so delete will fail under RLS.)
      const { data: existing, error: existingError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingError) throw existingError;

      const { error } = existing?.id
        ? await supabase
            .from("user_roles")
            .update({ role: newRole })
            .eq("id", existing.id)
        : await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      console.log("TestingPanel: role switch ok", {
        userId,
        existingId: existing?.id ?? null,
        newRole,
      });

      setCurrentRole(newRole);
      setAllRoles([newRole]);
      toast({
        title: "Role switched",
        description: `Now viewing as ${ROLES.find(r => r.role === newRole)?.label}`,
      });

      // Reload page to apply role changes
      window.location.reload();
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : "Failed to switch role";
      console.error("Error switching role:", error);
      setLastError(message);
      setLastAction("Role switch failed");
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-[100] w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        title="Testing Panel"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Panel */}
      {isOpen && (
        <Card className="fixed bottom-36 right-4 z-[100] w-64 shadow-xl border-amber-500/50">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bug className="w-4 h-4 text-amber-500" />
              Testing Panel
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Current: <Badge variant="outline" className="ml-1">{currentRole || "none"}</Badge>
            </p>
            <p className="text-xs text-muted-foreground">
              Status: {isLoading ? "Working…" : "Idle"}{lastAction ? ` • ${lastAction}` : ""}
            </p>
            {allRoles.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Roles rows: {allRoles.join(", ")}
              </p>
            )}
            {lastError && (
              <p className="text-xs text-destructive break-words">
                {lastError}
              </p>
            )}
            <div className="space-y-1">
              {ROLES.map(({ role, label, icon }) => (
                <Button
                  key={role}
                  variant={currentRole === role ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => switchRole(role)}
                  disabled={isLoading || currentRole === role}
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default TestingPanel;
