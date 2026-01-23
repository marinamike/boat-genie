import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Anchor, ArrowLeft, User, LogOut, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { RoleSelector } from "@/components/onboarding/RoleSelector";
// BottomNav removed - handled by role-specific layouts

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [safetyTimeoutHit, setSafetyTimeoutHit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { role, isAdmin, hasMarina, updateRole, loading: roleLoading, refetch: refetchRole } = useUserRole();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      // Safety: never trap the UI on the loading state.
      setSafetyTimeoutHit(true);
      setLoading(false);
    }, 4000);

    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          navigate("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.full_name || "");
          setPhone(profileData.phone || "");
        }
      } catch (error) {
        console.error("Profile: auth/profile load failed", error);
        // Fail open: allow the rest of the page to render.
      } finally {
        window.clearTimeout(timeout);
        setLoading(false);
      }
    };

    checkAuth();
    return () => window.clearTimeout(timeout);
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", session.user.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your changes have been saved.",
        });
      }
    }
    setSaving(false);
  };

  const handleRoleSelect = async (newRole: AppRole) => {
    if (newRole === "admin") {
      // Redirect to marina registration
      navigate("/register-marina");
      return;
    }

    const success = await updateRole(newRole);
    if (success) {
      toast({
        title: "Role Updated",
        description: `You are now registered as a ${newRole === "provider" ? "Service Provider" : "Boat Owner"}.`,
      });
      refetchRole();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate("/login");
  };

  if ((loading || roleLoading) && !safetyTimeoutHit) {
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
              <User className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">My Profile</h1>
              <p className="text-sm text-primary-foreground/80">Manage your account</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Captain Smith"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="h-12"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full h-12 font-semibold">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Account Type</CardTitle>
            <CardDescription>
              {isAdmin && hasMarina
                ? "You're registered as a Marina Manager"
                : "Select your role to access the right features"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin && hasMarina ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="font-medium text-primary">Marina Manager</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Access your marina dashboard from the bottom navigation
                </p>
              </div>
            ) : (
              <RoleSelector selectedRole={role} onSelect={handleRoleSelect} />
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </main>

      {/* BottomNav handled by role-specific layouts */}
    </div>
  );
};

export default Profile;
