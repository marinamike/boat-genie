import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Anchor, Ship, ClipboardList, Sparkles, LogOut, Plus, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  full_name: string | null;
  membership_tier: "standard" | "genie";
}

interface Boat {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  boat_profiles: {
    slip_number: string | null;
    gate_code: string | null;
    marina_name: string | null;
  } | null;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, membership_tier")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch boats with profiles
      const { data: boatsData } = await supabase
        .from("boats")
        .select(`
          id,
          name,
          make,
          model,
          year,
          boat_profiles (
            slip_number,
            gate_code,
            marina_name
          )
        `)
        .eq("owner_id", session.user.id);

      if (boatsData) {
        setBoats(boatsData as Boat[]);
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
  };

  const toggleSensitive = (boatId: string) => {
    setShowSensitive(prev => ({ ...prev, [boatId]: !prev[boatId] }));
  };

  const maskValue = (value: string | null, show: boolean) => {
    if (!value) return "—";
    return show ? value : "••••••";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-float">
          <Anchor className="w-12 h-12 text-teal" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-ocean rounded-lg flex items-center justify-center">
              <Anchor className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-lg">Boat Genie</h1>
              <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name || "Captain"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={profile?.membership_tier === "genie" ? "default" : "secondary"} className={profile?.membership_tier === "genie" ? "bg-gradient-sunset" : ""}>
              {profile?.membership_tier === "genie" ? "✨ Genie Member" : "Standard"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Button className="h-auto py-4 bg-gradient-teal hover:opacity-90 flex flex-col gap-2">
            <Ship className="w-6 h-6" />
            <span>Add Boat</span>
          </Button>
          <Button className="h-auto py-4 bg-gradient-ocean hover:opacity-90 flex flex-col gap-2">
            <Sparkles className="w-6 h-6" />
            <span>New Wish</span>
          </Button>
          <Button className="h-auto py-4 bg-gradient-sunset hover:opacity-90 flex flex-col gap-2">
            <ClipboardList className="w-6 h-6" />
            <span>View Log</span>
          </Button>
        </div>

        {/* Boats Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">My Boats</h2>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Boat
            </Button>
          </div>

          {boats.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Ship className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No boats yet</h3>
                <p className="text-muted-foreground mb-4">Add your first vessel to get started</p>
                <Button className="bg-gradient-teal">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your Boat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {boats.map((boat) => (
                <Card key={boat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-ocean-light">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-display">{boat.name}</CardTitle>
                        <CardDescription>
                          {[boat.year, boat.make, boat.model].filter(Boolean).join(" ") || "No details"}
                        </CardDescription>
                      </div>
                      <Ship className="w-8 h-8 text-teal" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Marina</span>
                        <span className="font-medium">{boat.boat_profiles?.marina_name || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Slip #</span>
                        <span className="font-mono">{maskValue(boat.boat_profiles?.slip_number || null, showSensitive[boat.id])}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Gate Code</span>
                        <span className="font-mono">{maskValue(boat.boat_profiles?.gate_code || null, showSensitive[boat.id])}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => toggleSensitive(boat.id)}
                      >
                        {showSensitive[boat.id] ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Show Details
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
