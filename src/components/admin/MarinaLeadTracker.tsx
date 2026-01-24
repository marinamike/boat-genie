import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  Ship, 
  Calendar, 
  TrendingUp, 
  ExternalLink,
  Loader2,
  Anchor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  topMarinas: { name: string; count: number }[];
}

export function MarinaLeadTracker() {
  const [leads, setLeads] = useState<MarinaLead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          const marinaCounts: Record<string, number> = {};
          data.forEach((lead) => {
            marinaCounts[lead.marina_name] = (marinaCounts[lead.marina_name] || 0) + 1;
          });

          const topMarinas = Object.entries(marinaCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

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

    fetchLeads();
  }, []);

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

      {/* Top Unclaimed Marinas */}
      {stats && stats.topMarinas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Unclaimed Marina Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topMarinas.map((marina, index) => (
                <div
                  key={marina.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{marina.name}</span>
                  </div>
                  <Badge variant="secondary">{marina.count} leads</Badge>
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
    </div>
  );
}
