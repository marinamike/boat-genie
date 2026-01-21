import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Bug, User, Wrench, Building2, HardHat, Trash2 } from "lucide-react";
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
  const navigate = useNavigate();

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

      // Let the rest of the app refresh role-dependent UI without a full reload.
      window.dispatchEvent(new CustomEvent("app:role-changed"));
      setIsOpen(false);
      navigate("/dashboard", { replace: true });
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

  const clearTestData = async () => {
    if (!userId || isLoading) return;
    
    const confirmed = window.confirm(
      "This will DELETE all Work Orders, Marinas, and Marina Settings.\n\nUser profiles will remain intact.\n\nContinue?"
    );
    if (!confirmed) return;

    setIsLoading(true);
    setLastError(null);
    setLastAction("Clearing test data…");

    try {
      // Delete work orders first (depends on boats, which we keep)
      const { error: woError } = await supabase
        .from("work_orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // match all

      if (woError) throw woError;

      // Delete marina_settings
      const { error: msError } = await supabase
        .from("marina_settings")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (msError) throw msError;

      // Delete marinas
      const { error: marinaError } = await supabase
        .from("marinas")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (marinaError) throw marinaError;

      setLastAction("Test data cleared");
      toast({
        title: "Test data cleared",
        description: "Work orders and marinas have been deleted.",
      });

      window.dispatchEvent(new CustomEvent("app:role-changed"));
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : error instanceof Error
            ? error.message
            : "Failed to clear data";
      console.error("Error clearing test data:", error);
      setLastError(message);
      setLastAction("Clear failed");
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
          <CardContent className="py-2 px-4 space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
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
            </div>

            {/* Role Switcher */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Switch Role</p>
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

            <Separator />

            {/* Data Reset */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={clearTestData}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
                Clear Test Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default TestingPanel;
