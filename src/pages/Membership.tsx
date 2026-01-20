import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Anchor, 
  Sparkles, 
  Check, 
  X, 
  Crown, 
  Ship, 
  DollarSign,
  Shield,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { PRICING_CONSTANTS } from "@/lib/pricing";

interface Profile {
  id: string;
  full_name: string | null;
  membership_tier: "standard" | "genie";
}

const Membership = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, membership_tier")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleUpgrade = async () => {
    if (!profile) return;

    setUpgrading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ membership_tier: "genie" })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, membership_tier: "genie" });

      toast({
        title: "Welcome to Genie Membership! 🎉",
        description: "You now have access to wholesale pricing and reduced fees.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not upgrade membership";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const features = [
    {
      name: "Service Fee",
      standard: `${PRICING_CONSTANTS.SERVICE_FEE_RATE * 100}%`,
      genie: "0%",
      icon: DollarSign,
      highlight: true,
    },
    {
      name: "Emergency Service",
      standard: `$${PRICING_CONSTANTS.EMERGENCY_FEE_STANDARD}`,
      genie: `$${PRICING_CONSTANTS.EMERGENCY_FEE_MEMBER}`,
      icon: Clock,
      highlight: true,
    },
    {
      name: "Pricing View",
      standard: "Retail",
      genie: "Wholesale",
      icon: Ship,
      highlight: true,
    },
    {
      name: "Priority Support",
      standard: false,
      genie: true,
      icon: Shield,
    },
    {
      name: "Service History",
      standard: true,
      genie: true,
      icon: Clock,
    },
    {
      name: "Photo Documentation",
      standard: true,
      genie: true,
      icon: Crown,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Anchor className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  const isMember = profile?.membership_tier === "genie";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/80"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Genie Membership</h1>
              <p className="text-sm text-primary-foreground/80">
                Unlock exclusive benefits
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Current Status */}
        {isMember && (
          <Card className="bg-gradient-gold text-foreground border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-foreground/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">You're a Genie Member!</h2>
                  <p className="text-sm opacity-80">
                    Enjoy wholesale pricing and reduced fees
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Cards */}
        <div className="grid gap-4">
          {/* Standard Plan */}
          <Card className={`${!isMember ? "ring-2 ring-primary" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Standard</CardTitle>
                </div>
                {!isMember && (
                  <Badge variant="secondary">Current Plan</Badge>
                )}
              </div>
              <CardDescription>
                Basic access to Boat Genie services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">Free</div>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-2 text-sm">
                    {typeof feature.standard === "boolean" ? (
                      feature.standard ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )
                    ) : (
                      <feature.icon className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="flex-1">{feature.name}</span>
                    {typeof feature.standard === "string" && (
                      <span className="text-muted-foreground">{feature.standard}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Genie Plan */}
          <Card className={`${isMember ? "ring-2 ring-accent" : ""} bg-gradient-to-br from-primary/5 to-accent/10`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg">Genie Member</CardTitle>
                </div>
                {isMember ? (
                  <Badge className="bg-gradient-gold text-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-accent text-accent">
                    Recommended
                  </Badge>
                )}
              </div>
              <CardDescription>
                Premium benefits for serious boaters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">
                $29<span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li 
                    key={feature.name} 
                    className={`flex items-center gap-2 text-sm ${feature.highlight ? "font-medium" : ""}`}
                  >
                    {typeof feature.genie === "boolean" ? (
                      feature.genie ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground" />
                      )
                    ) : (
                      <feature.icon className={`w-4 h-4 ${feature.highlight ? "text-accent" : "text-muted-foreground"}`} />
                    )}
                    <span className="flex-1">{feature.name}</span>
                    {typeof feature.genie === "string" && (
                      <span className={feature.highlight ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                        {feature.genie}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {!isMember && (
                <Button 
                  className="w-full mt-6 bg-gradient-gold hover:opacity-90 text-foreground font-semibold touch-target shadow-gold"
                  onClick={handleUpgrade}
                  disabled={upgrading}
                >
                  {upgrading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Genie
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Why Upgrade?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Save on Every Service</h4>
                <p className="text-sm text-muted-foreground">
                  No more 5% service fees. Pay wholesale prices on all services.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Emergency Savings</h4>
                <p className="text-sm text-muted-foreground">
                  Pay only $50 instead of $150 for emergency services.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Priority Support</h4>
                <p className="text-sm text-muted-foreground">
                  Get faster response times from our support team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Membership;
