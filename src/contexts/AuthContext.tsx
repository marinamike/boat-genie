import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Four-profile architecture: Customer, Provider, Business, Staff
export type AppRole = "boat_owner" | "provider" | "admin" | "marina_staff";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole;
  loading: boolean;
  setRole: (newRole: AppRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<AppRole>("boat_owner");
  const [loading, setLoading] = useState(true);

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

  // Update role in database and state
  const setRole = async (newRole: AppRole) => {
    if (!user) return;

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
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRoleState("boat_owner");
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
            setRoleState(userRole);
            setLoading(false);
          }, 0);
        } else {
          setRoleState("boat_owner");
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
        setRoleState(userRole);
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
      loading, 
      setRole, 
      signOut
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
