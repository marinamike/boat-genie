// CANONICAL OWNER DASHBOARD — entry point for boat_owner role
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Anchor, Ship, Plus, Sparkles, LogOut, Pencil, Lock, ChevronDown, MapPin, ChevronRight, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FloatingActionButton from "@/components/FloatingActionButton";
import { useAuth } from "@/contexts/AuthContext";
import { useVessel } from "@/contexts/VesselContext";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AddBoatForm, { BoatToEdit } from "@/components/AddBoatForm";
import { WishFormSheet } from "@/components/wish/WishFormSheet";
import { WishStatusCard } from "@/components/wish/WishStatusCard";
import { PendingQuotesSection } from "@/components/owner/PendingQuotesSection";
import { ReservationsSection } from "@/components/owner/ReservationsSection";
import { MarineWeatherWidget } from "@/components/weather/MarineWeatherWidget";
import { TideChart } from "@/components/weather/TideChart";
import { useMarineWeather } from "@/hooks/useMarineWeather";
import { MarineLoadingScreen } from "@/components/ui/marine-loading";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InvoiceReview } from "@/components/owner/InvoiceReview";
import { formatDistanceToNow } from "date-fns";

interface Boat {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  length_ft: number | null;
  boat_profiles: {
    marina_name: string | null;
    slip_number: string | null;
    gate_code: string | null;
    special_instructions: string | null;
  } | null;
}

interface Wish {
  id: string;
  service_type: string;
  description: string;
  status: string;
  urgency: string | null;
  is_emergency: boolean;
  calculated_price: number | null;
  preferred_date: string | null;
  created_at: string;
  boat: {
    name: string;
  } | null;
}

interface ActiveJob {
  id: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  created_at: string;
  boat: { name: string } | null;
  business: { business_name: string } | null;
}

interface Profile {
  full_name: string | null;
  membership_tier: "standard" | "genie";
}

const Dashboard = () => {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const { selectVesselAndNavigate, refetchVessels } = useVessel();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedAccess, setExpandedAccess] = useState<Record<string, boolean>>({});
  const [showBoatForm, setShowBoatForm] = useState(false);
  const [showWishForm, setShowWishForm] = useState(false);
  const [boatToEdit, setBoatToEdit] = useState<BoatToEdit | null>(null);
  const [reviewingInvoiceId, setReviewingInvoiceId] = useState<string | null>(null);
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
        length_ft,
        boat_profiles (
          marina_name,
          slip_number,
          gate_code,
          special_instructions
        )
      `)
      .eq("owner_id", user.id);

    if (boatsData) {
      setBoats(boatsData as Boat[]);
    }
  }, [user]);

  const fetchWishes = useCallback(async () => {
    if (!user) return;
    
    // Fetch wishes
    const { data: wishData } = await supabase
      .from("wish_forms")
      .select(`
        id,
        service_type,
        description,
        status,
        urgency,
        is_emergency,
        calculated_price,
        preferred_date,
        created_at,
        boat_id,
        boat:boats(name)
      `)
      .eq("requester_id", user.id)
      .not("status", "in", '("closed","accepted")')
      .order("created_at", { ascending: false });

    setWishes((wishData as unknown as Wish[]) || []);
  }, [user]);

  const fetchActiveJobs = useCallback(async () => {
    if (!user) return;
    // Get owner's boat IDs
    const { data: ownerBoats } = await supabase
      .from("boats")
      .select("id")
      .eq("owner_id", user.id);
    if (!ownerBoats || ownerBoats.length === 0) {
      setActiveJobs([]);
      return;
    }
    const boatIds = ownerBoats.map((b) => b.id);
    const { data } = await supabase
      .from("work_orders")
      .select("id, title, status, scheduled_date, created_at, boat:boats(name), business:businesses!work_orders_business_id_fkey(business_name)")
      .in("boat_id", boatIds)
      .in("status", ["assigned", "in_progress", "qc_review", "completed", "disputed"])
      .order("created_at", { ascending: false });
    setActiveJobs((data as unknown as ActiveJob[]) || []);
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

        // Fetch boats, wishes, and active jobs
        await Promise.all([fetchBoats(), fetchWishes(), fetchActiveJobs()]);
      } catch (err) {
        console.error("Dashboard: data fetch failed", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, navigate, fetchBoats, fetchWishes, fetchActiveJobs]);

  // Realtime subscription for work order status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("owner-active-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_orders" },
        () => { fetchActiveJobs(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchActiveJobs]);

  // Role-based redirects are now handled by App.tsx RoleBasedRoutes

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate("/login", { replace: true });
  };

  const toggleAccessDetails = (boatId: string) => {
    setExpandedAccess(prev => ({ ...prev, [boatId]: !prev[boatId] }));
  };

  const maskValue = (value: string | null) => {
    if (!value) return null;
    return "••••••";
  };

  const handleMakeWish = () => {
    if (boats.length === 0) {
      toast({
        title: "Add a boat first",
        description: "You need to add a boat before making a service request.",
        variant: "destructive",
      });
      return;
    }
    setShowWishForm(true);
  };

  const handleAddBoat = () => {
    setBoatToEdit(null);
    setShowBoatForm(true);
  };

  const handleEditBoat = (boat: Boat) => {
    setBoatToEdit(boat);
    setShowBoatForm(true);
  };

  const handleFormClose = (open: boolean) => {
    setShowBoatForm(open);
    if (!open) {
      setBoatToEdit(null);
    }
  };

  if (authLoading || dataLoading) {
    return <MarineLoadingScreen message="Preparing your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
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
        {/* Marine Weather Section */}
        <MarineWeatherSection boats={boats} />

        {/* Boats Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">My Boats</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="font-medium"
              onClick={handleAddBoat}
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
                  onClick={handleAddBoat}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your Boat
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {boats.map((boat) => (
                <Card 
                  key={boat.id} 
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => selectVesselAndNavigate(boat.id)}
                >
                  <CardHeader className="bg-navy-light pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{boat.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {[boat.year, boat.make, boat.model].filter(Boolean).join(" ") || "No details"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBoat(boat);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Ship className="w-7 h-7 text-primary" strokeWidth={1.5} />
                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Location Info - Always Visible */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {boat.boat_profiles?.marina_name || "No marina set"}
                          </div>
                          {boat.boat_profiles?.slip_number && (
                            <div className="text-sm text-muted-foreground">
                              Slip {boat.boat_profiles.slip_number}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Security Access - Collapsible & Masked by Default */}
                      {(boat.boat_profiles?.gate_code || boat.boat_profiles?.special_instructions) && (
                        <Collapsible
                          open={expandedAccess[boat.id]}
                          onOpenChange={() => toggleAccessDetails(boat.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between mt-2 text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm font-medium">Security & Access</span>
                              </div>
                              <ChevronDown 
                                className={`w-4 h-4 transition-transform ${
                                  expandedAccess[boat.id] ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-3 space-y-2.5 border-t border-border mt-2">
                            {boat.boat_profiles?.gate_code && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Gate Code</span>
                                <span className="font-mono text-sm">
                                  {expandedAccess[boat.id] 
                                    ? boat.boat_profiles.gate_code 
                                    : maskValue(boat.boat_profiles.gate_code)
                                  }
                                </span>
                              </div>
                            )}
                            {boat.boat_profiles?.special_instructions && (
                              <div className="space-y-1">
                                <span className="text-sm text-muted-foreground">Access Instructions</span>
                                <p className="text-sm bg-muted/50 p-2 rounded-md">
                                  {expandedAccess[boat.id] 
                                    ? boat.boat_profiles.special_instructions 
                                    : maskValue(boat.boat_profiles.special_instructions)
                                  }
                                </p>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Pending Quotes Section */}
        {user && (
          <PendingQuotesSection 
            userId={user.id} 
            onQuoteAction={fetchWishes}
          />
        )}

        {/* Active Jobs Section */}
        {activeJobs.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold tracking-tight mb-4">Active Jobs</h2>
            <div className="space-y-3">
              {activeJobs.map((job) => {
                const statusMap: Record<string, { label: string; className: string }> = {
                  assigned: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200" },
                  in_progress: { label: "In Progress", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                  qc_review: { label: "QC Review", className: "bg-violet-100 text-violet-700 border-violet-200" },
                  completed: { label: "Completed", className: "bg-gray-100 text-gray-700 border-gray-200" },
                  disputed: { label: "Disputed", className: "bg-red-100 text-red-700 border-red-200" },
                };
                const badge = statusMap[job.status] || { label: job.status, className: "" };

                const handleReviewInvoice = async () => {
                  const { data } = await supabase
                    .from("invoices")
                    .select("id")
                    .eq("work_order_id", job.id)
                    .maybeSingle();
                  if (data) {
                    setReviewingInvoiceId(data.id);
                  } else {
                    toast({ title: "No invoice found", description: "Invoice has not been generated yet.", variant: "destructive" });
                  }
                };

                return (
                  <Card key={job.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Wrench className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{job.title}</p>
                            {job.boat?.name && (
                              <p className="text-xs text-muted-foreground">{job.boat.name}</p>
                            )}
                            {job.business?.business_name && (
                              <p className="text-xs text-muted-foreground">{job.business.business_name}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {job.scheduled_date && (
                                <span className="text-xs text-muted-foreground">
                                  Scheduled: {new Date(job.scheduled_date).toLocaleDateString()}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            {job.status === "completed" && (
                              <Button
                                size="sm"
                                className="mt-2 bg-primary font-semibold"
                                onClick={handleReviewInvoice}
                              >
                                Review Invoice
                              </Button>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Reservations Section */}
        {user && <ReservationsSection userId={user.id} />}

        {/* Active Wishes Section */}
        {wishes.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold tracking-tight mb-4">My Wishes</h2>
            <div className="space-y-3">
              {wishes.map((wish) => (
                <WishStatusCard key={wish.id} wish={wish} onUpdated={fetchWishes} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleMakeWish} />

      {/* Bottom Navigation handled by OwnerLayout */}

      {/* Add/Edit Boat Modal */}
      {user && (
        <AddBoatForm
          open={showBoatForm}
          onOpenChange={handleFormClose}
          onSuccess={() => {
            fetchBoats();
            refetchVessels();
          }}
          userId={user.id}
          boatToEdit={boatToEdit}
        />
      )}

      {/* Wish Form Sheet */}
      <WishFormSheet
        open={showWishForm}
        onOpenChange={setShowWishForm}
        boats={boats.map((b) => ({
          id: b.id,
          name: b.name,
          length_ft: b.length_ft,
          make: b.make,
          model: b.model,
        }))}
        onSuccess={fetchWishes}
      />
      {/* Invoice Review Sheet */}
      <Sheet open={!!reviewingInvoiceId} onOpenChange={(open) => !open && setReviewingInvoiceId(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Review Invoice</SheetTitle>
          </SheetHeader>
          {reviewingInvoiceId && (
            <InvoiceReview
              invoiceId={reviewingInvoiceId}
              onClose={() => {
                setReviewingInvoiceId(null);
                fetchActiveJobs();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Marine Weather Section Component
function MarineWeatherSection({ boats }: { boats: Boat[] }) {
  // Get location from first boat's marina if available
  const firstBoatMarina = boats[0]?.boat_profiles?.marina_name;
  
  // Fort Lauderdale coordinates as default
  const { data, loading, refetch } = useMarineWeather(
    26.1224,
    -80.1373,
    firstBoatMarina || "Fort Lauderdale"
  );

  if (boats.length === 0) return null;

  return (
    <section className="mb-6 space-y-3">
      <MarineWeatherWidget
        data={data}
        loading={loading}
        onRefresh={refetch}
      />
      <TideChart data={data?.tides || null} loading={loading} />
    </section>
  );
}

export default Dashboard;
