import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Anchor, Ship, Plus, Eye, EyeOff, Sparkles, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import FloatingActionButton from "@/components/FloatingActionButton";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AddBoatForm from "@/components/AddBoatForm";

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

interface Profile {
  full_name: string | null;
  membership_tier: "standard" | "genie";
}

const Dashboard = () => {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [showAddBoatForm, setShowAddBoatForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchBoats = useCallback(async () => {
    if (!user) return;
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
      .eq("owner_id", user.id);

    if (boatsData) {
      setBoats(boatsData as Boat[]);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, membership_tier")
          .eq("id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch boats
        await fetchBoats();
      } catch (err) {
        console.error("Dashboard: data fetch failed", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate, fetchBoats]);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate("/login", { replace: true });
  };

  const toggleSensitive = (boatId: string) => {
    setShowSensitive(prev => ({ ...prev, [boatId]: !prev[boatId] }));
  };

  const maskValue = (value: string | null, show: boolean) => {
    if (!value) return "—";
    return show ? value : "••••••";
  };

  const handleMakeWish = () => {
    toast({
      title: "Coming soon!",
      description: "The Wish Form will be available shortly.",
    });
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Anchor className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  // Role-based redirect (optional - you can customize this)
  if (role === "admin") {
    navigate("/marina", { replace: true });
    return null;
  }

  if (role === "provider") {
    navigate("/provider", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-10 z-40 bg-background border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Anchor className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Boat Genie</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {profile?.full_name || "Captain"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={profile?.membership_tier === "genie" ? "default" : "secondary"} 
              className={profile?.membership_tier === "genie" ? "bg-gradient-gold text-foreground font-semibold" : "font-medium"}
            >
              {profile?.membership_tier === "genie" ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Genie
                </>
              ) : (
                "Standard"
              )}
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Boats Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">My Boats</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="font-medium"
              onClick={() => setShowAddBoatForm(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Boat
            </Button>
          </div>

          {boats.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Ship className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="font-semibold text-lg mb-2">No boats yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Add your first vessel to get started</p>
                <Button 
                  className="bg-primary font-semibold touch-target"
                  onClick={() => setShowAddBoatForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your Boat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {boats.map((boat) => (
                <Card key={boat.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-navy-light pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{boat.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {[boat.year, boat.make, boat.model].filter(Boolean).join(" ") || "No details"}
                        </CardDescription>
                      </div>
                      <Ship className="w-7 h-7 text-primary" strokeWidth={1.5} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Marina</span>
                        <span className="font-medium text-sm">{boat.boat_profiles?.marina_name || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Slip #</span>
                        <span className="font-mono text-sm">{maskValue(boat.boat_profiles?.slip_number || null, showSensitive[boat.id])}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Gate Code</span>
                        <span className="font-mono text-sm">{maskValue(boat.boat_profiles?.gate_code || null, showSensitive[boat.id])}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 font-medium"
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

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleMakeWish} />

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Add Boat Modal */}
      {user && (
        <AddBoatForm
          open={showAddBoatForm}
          onOpenChange={setShowAddBoatForm}
          onSuccess={fetchBoats}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default Dashboard;
