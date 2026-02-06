import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Radar, Phone, Mail, TrendingUp, DollarSign, Anchor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarinaLead {
  marina_name: string;
  marina_email: string | null;
  lead_count: number;
  potential_value: number;
  last_request: string;
}

export function LeadRadar() {
  const [leads, setLeads] = useState<MarinaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingMarina, setClaimingMarina] = useState<string | null>(null);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedMarina, setSelectedMarina] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      // Get aggregated lead data by marina name
      const { data, error } = await supabase
        .from("marina_leads")
        .select("marina_name, marina_email, created_at, vessel_length_ft")
        .eq("lead_status", "pending")
        .is("marina_id", null); // Unclaimed marinas

      if (error) throw error;

      // Aggregate by marina name
      const aggregated = (data || []).reduce((acc, lead) => {
        const name = lead.marina_name;
        if (!acc[name]) {
          acc[name] = {
            marina_name: name,
            marina_email: lead.marina_email,
            lead_count: 0,
            potential_value: 0,
            last_request: lead.created_at,
          };
        }
        acc[name].lead_count++;
        // Estimate value: $50/ft/month average
        acc[name].potential_value += (lead.vessel_length_ft || 30) * 50;
        if (lead.created_at > acc[name].last_request) {
          acc[name].last_request = lead.created_at;
        }
        return acc;
      }, {} as Record<string, MarinaLead>);

      // Sort by lead count descending
      const sorted = Object.values(aggregated).sort((a, b) => b.lead_count - a.lead_count);
      setLeads(sorted);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to load lead radar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleClaimManually = async () => {
    if (!selectedMarina || !claimEmail) return;

    setClaimingMarina(selectedMarina);
    try {
      // Update all leads for this marina with the email
      const { error } = await supabase
        .from("marina_leads")
        .update({ 
          marina_email: claimEmail,
          lead_status: "claimed",
          claimed_at: new Date().toISOString()
        })
        .eq("marina_name", selectedMarina)
        .eq("lead_status", "pending");

      if (error) throw error;

      toast({
        title: "Marina Claimed",
        description: `${selectedMarina} has been assigned to ${claimEmail}`,
      });

      setClaimDialogOpen(false);
      setClaimEmail("");
      setSelectedMarina(null);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim marina",
        variant: "destructive",
      });
    } finally {
      setClaimingMarina(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-primary" />
          Lead Radar
        </CardTitle>
        <CardDescription>
          Unclaimed marinas receiving "Ghost Requests"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No unclaimed marina leads at this time.</p>
          </div>
        ) : (
          leads.map((lead, index) => (
            <Card key={lead.marina_name} className={index < 3 ? "border-l-4 border-l-primary" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{lead.marina_name}</h3>
                      {index < 3 && (
                        <Badge variant="default" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Hot
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {lead.lead_count} pending requests
                      </span>
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="w-3 h-3" />
                        ${lead.potential_value.toLocaleString()}/mo potential
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Last request: {new Date(lead.last_request).toLocaleDateString()}
                    </p>
                  </div>

                  <Dialog open={claimDialogOpen && selectedMarina === lead.marina_name} onOpenChange={(open) => {
                    setClaimDialogOpen(open);
                    if (!open) setSelectedMarina(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedMarina(lead.marina_name)}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Claim
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Claim {lead.marina_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                          Got them on the phone? Enter their email to claim this marina.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="claimEmail">Marina Contact Email</Label>
                          <Input
                            id="claimEmail"
                            type="email"
                            placeholder="manager@marina.com"
                            value={claimEmail}
                            onChange={(e) => setClaimEmail(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={handleClaimManually}
                          disabled={!claimEmail || claimingMarina === lead.marina_name}
                          className="w-full"
                        >
                          {claimingMarina === lead.marina_name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Claim Marina"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
