import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "boat_owner" | "provider" | "admin" | "marina_staff";

const PREVIEW_ROLE_KEY = "preview_role";
const GOD_MODE_EMAIL = "info@marinamike.com";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole;
  actualRole: AppRole; // The real database role
  isPreviewMode: boolean;
  loading: boolean;
  setRole: (newRole: AppRole) => Promise<void>;
  setPreviewRole: (role: AppRole | null) => void;
  clearPreviewRole: () => void;
  signOut: () => Promise<void>;
  isGodModeUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [actualRole, setActualRole] = useState<AppRole>("boat_owner");
  const [previewRole, setPreviewRoleState] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user has God Mode access
  const isGodModeUser = user?.email === GOD_MODE_EMAIL;

  // The effective role: preview role if set (and user is admin), otherwise actual role
  const role: AppRole = (isGodModeUser && previewRole) ? previewRole : actualRole;
  const isPreviewMode = isGodModeUser && previewRole !== null;

  // Load preview role from localStorage on mount
  useEffect(() => {
    const storedPreviewRole = localStorage.getItem(PREVIEW_ROLE_KEY);
    if (storedPreviewRole && ["boat_owner", "provider", "admin", "marina_staff"].includes(storedPreviewRole)) {
      setPreviewRoleState(storedPreviewRole as AppRole);
    }
  }, []);

  // Fetch role from user_roles table
  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("AuthContext: error fetching role", error);
        return "boat_owner" as AppRole;
      }

      return (data?.role as AppRole) || "boat_owner";
    } catch (err) {
      console.error("AuthContext: fetchRole failed", err);
      return "boat_owner" as AppRole;
    }
  };

  // Set preview role (localStorage only, no DB change)
  const setPreviewRole = (newRole: AppRole | null) => {
    if (!isGodModeUser) return;
    
    if (newRole === null) {
      localStorage.removeItem(PREVIEW_ROLE_KEY);
      setPreviewRoleState(null);
    } else {
      localStorage.setItem(PREVIEW_ROLE_KEY, newRole);
      setPreviewRoleState(newRole);
    }
    window.location.reload();
  };

  // Clear preview role and return to actual admin role
  const clearPreviewRole = () => {
    localStorage.removeItem(PREVIEW_ROLE_KEY);
    setPreviewRoleState(null);
    window.location.reload();
  };

  // Update role in database and state (actual role change)
  const setRole = async (newRole: AppRole) => {
    if (!user) return;

    // For God Mode users, use preview mode instead of changing DB
    if (isGodModeUser) {
      setPreviewRole(newRole);
      return;
    }

    try {
      // Check if role exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: newRole });
      }

      // Force full reload to ensure all components re-read role
      window.location.reload();
    } catch (err) {
      console.error("AuthContext: setRole failed", err);
    }
  };

  const signOut = async () => {
    // Clear preview role on sign out
    localStorage.removeItem(PREVIEW_ROLE_KEY);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setActualRole("boat_owner");
    setPreviewRoleState(null);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("AuthContext: auth state changed", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const userRole = await fetchRole(newSession.user.id);
            setActualRole(userRole);
            setLoading(false);
          }, 0);
        } else {
          setActualRole("boat_owner");
          setLoading(false);
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const userRole = await fetchRole(initialSession.user.id);
        setActualRole(userRole);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      role, 
      actualRole,
      isPreviewMode,
      loading, 
      setRole, 
      setPreviewRole,
      clearPreviewRole,
      signOut,
      isGodModeUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
