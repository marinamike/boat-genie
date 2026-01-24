import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Ship, 
  Calendar, 
  TrendingUp, 
  ExternalLink,
  Loader2,
  Anchor,
  CheckCircle,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MarinaLead {
  id: string;
  marina_name: string;
  marina_email: string | null;
  vessel_type: string;
  vessel_length_ft: number | null;
  vessel_beam_ft: number | null;
  vessel_draft_ft: number | null;
  power_requirements: string | null;
  stay_type: string | null;
  requested_dates: string | null;
  lead_status: string;
  created_at: string;
  sent_at: string | null;
  claimed_at: string | null;
}

interface LeadStats {
  total: number;
  pending: number;
  sent: number;
  claimed: number;
  topMarinas: { name: string; count: number; email?: string }[];
}

export function MarinaLeadTracker() {
  const [leads, setLeads] = useState<MarinaLead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimDialog, setClaimDialog] = useState<{ name: string; email?: string } | null>(null);
  const [managerEmail, setManagerEmail] = useState("");
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("marina_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeads((data as MarinaLead[]) || []);

      // Calculate stats
      if (data) {
        const marinaCounts: Record<string, { count: number; email?: string }> = {};
        data.forEach((lead) => {
          if (!marinaCounts[lead.marina_name]) {
            marinaCounts[lead.marina_name] = { count: 0, email: lead.marina_email || undefined };
          }
          marinaCounts[lead.marina_name].count++;
        });

        const topMarinas = Object.entries(marinaCounts)
          .map(([name, data]) => ({ name, count: data.count, email: data.email }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setStats({
          total: data.length,
          pending: data.filter((l) => l.lead_status === "pending").length,
          sent: data.filter((l) => l.sent_at).length,
          claimed: data.filter((l) => l.claimed_at).length,
          topMarinas,
        });
      }
    } catch (error) {
      console.error("Error fetching marina leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleManualClaim = async () => {
    if (!claimDialog || !managerEmail) return;
    setClaiming(true);

    try {
      // Create a new marina record
      const { data: { user } } = await supabase.auth.getUser();
      
      // First, check if a marina with this name already exists
      const { data: existingMarina } = await supabase
        .from("marinas")
        .select("id")
        .eq("marina_name", claimDialog.name)
        .maybeSingle();

      if (existingMarina) {
        // Update existing marina as claimed
        await supabase
          .from("marinas")
          .update({ is_claimed: true })
          .eq("id", existingMarina.id);
      } else {
        // Create new marina record
        await supabase.from("marinas").insert({
          marina_name: claimDialog.name,
          contact_email: claimDialog.email || managerEmail,
          manager_id: user?.id, // Temporarily assign to admin
          is_claimed: true,
        });
      }

      // Mark all leads for this marina as claimed
      await supabase
        .from("marina_leads")
        .update({ 
          lead_status: "claimed",
          claimed_at: new Date().toISOString(),
        })
        .eq("marina_name", claimDialog.name);

      toast({ title: "Marina claimed successfully" });
      setClaimDialog(null);
      setManagerEmail("");
      fetchLeads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Marina Lead Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
              <p className="text-xs text-muted-foreground">Emails Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.claimed}</div>
              <p className="text-xs text-muted-foreground">Claimed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Unclaimed Marinas - Sales Targets */}
      {stats && stats.topMarinas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Hot Sales Targets (Sorted by Request Volume)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topMarinas.map((marina, index) => (
                <div
                  key={marina.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="font-medium">{marina.name}</span>
                      {marina.email && (
                        <p className="text-xs text-muted-foreground">{marina.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{marina.count} leads</Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setClaimDialog({ name: marina.name, email: marina.email })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Claim
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Anchor className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No leads generated yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Anchor className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{lead.marina_name}</span>
                          <Badge
                            variant={
                              lead.lead_status === "claimed"
                                ? "default"
                                : lead.sent_at
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {lead.lead_status === "claimed"
                              ? "Claimed"
                              : lead.sent_at
                              ? "Sent"
                              : "Pending"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Ship className="w-3.5 h-3.5" />
                            {lead.vessel_length_ft || "?"}ft {lead.vessel_type}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(lead.created_at), "MMM d, yyyy")}
                          </div>
                        </div>

                        {lead.marina_email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📧 {lead.marina_email}
                          </p>
                        )}
                      </div>

                      {lead.marina_email && (
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a href={`mailto:${lead.marina_email}`}>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Manual Claim Dialog */}
      <Dialog open={!!claimDialog} onOpenChange={() => setClaimDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Manually Claim Marina
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Claiming <strong>{claimDialog?.name}</strong> will mark all leads for this marina as claimed and create a marina profile.
            </p>
            <div className="space-y-2">
              <Label>Marina Manager Email</Label>
              <Input
                type="email"
                placeholder="dockmaster@marina.com"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This email will receive an invite to manage their marina profile.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialog(null)}>Cancel</Button>
            <Button onClick={handleManualClaim} disabled={claiming || !managerEmail}>
              {claiming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Claim Marina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
