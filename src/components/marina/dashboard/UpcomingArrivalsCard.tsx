import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CalendarClock, 
  Ship, 
  Loader2, 
  LogIn, 
  ChevronRight,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { useLiveDockStatus } from "@/hooks/useLiveDockStatus";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UpcomingArrival {
  id: string;
  boat_id: string;
  boat_name: string;
  boat_make?: string;
  boat_model?: string;
  boat_length_ft?: number;
  owner_name?: string;
  owner_id: string;
  assigned_slip?: string;
  requested_arrival: string;
  stay_type: string;
}

export function UpcomingArrivalsCard() {
  const [arrivals, setArrivals] = useState<UpcomingArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInDialog, setCheckInDialog] = useState<UpcomingArrival | null>(null);
  const [slipNumber, setSlipNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const { checkInBoat } = useLiveDockStatus();
  const { toast } = useToast();

  const fetchArrivals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get marina for current user
      const { data: marina } = await supabase
        .from("marinas")
        .select("id")
        .eq("manager_id", user.id)
        .maybeSingle();

      if (!marina) return;

      // Fetch approved reservations that haven't been checked in
      const { data, error } = await supabase
        .from("marina_reservations")
        .select(`
          id,
          boat_id,
          owner_id,
          assigned_slip,
          requested_arrival,
          stay_type,
          boats:boat_id (name, make, model, length_ft),
          profiles:owner_id (full_name)
        `)
        .eq("marina_id", marina.id)
        .eq("status", "approved")
        .order("requested_arrival", { ascending: true });

      if (error) throw error;

      const mapped: UpcomingArrival[] = (data || []).map((r: any) => ({
        id: r.id,
        boat_id: r.boat_id,
        boat_name: r.boats?.name || "Unknown",
        boat_make: r.boats?.make,
        boat_model: r.boats?.model,
        boat_length_ft: r.boats?.length_ft,
        owner_name: r.profiles?.full_name,
        owner_id: r.owner_id,
        assigned_slip: r.assigned_slip,
        requested_arrival: r.requested_arrival,
        stay_type: r.stay_type,
      }));

      setArrivals(mapped);
    } catch (error) {
      console.error("Error fetching upcoming arrivals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
  }, []);

  // Real-time subscription for reservation changes
  useEffect(() => {
    const channel = supabase
      .channel("upcoming_arrivals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marina_reservations",
        },
        () => {
          fetchArrivals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCheckIn = async () => {
    if (!checkInDialog) return;
    
    setProcessing(true);
    try {
      const slip = slipNumber || checkInDialog.assigned_slip || "";
      
      // Check in to dock_status
      const success = await checkInBoat(
        checkInDialog.boat_id,
        slip,
        checkInDialog.stay_type,
        checkInDialog.id
      );

      if (success) {
        // Update reservation status to checked_in
        const { error } = await supabase
          .from("marina_reservations")
          .update({ 
            status: "checked_in",
            actual_arrival: new Date().toISOString(),
            assigned_slip: slip || checkInDialog.assigned_slip
          })
          .eq("id", checkInDialog.id);

        if (error) throw error;

        toast({
          title: "Check-in Complete",
          description: `${checkInDialog.boat_name} is now on site`,
        });

        fetchArrivals();
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast({
        title: "Error",
        description: "Failed to complete check-in",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setCheckInDialog(null);
      setSlipNumber("");
    }
  };

  const openCheckIn = (arrival: UpcomingArrival) => {
    setCheckInDialog(arrival);
    setSlipNumber(arrival.assigned_slip || "");
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isPast(date) && !isToday(date)) return "Overdue";
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const getDateBadgeVariant = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isPast(date) && !isToday(date)) return "destructive";
    if (isToday(date)) return "default";
    return "secondary";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Upcoming Arrivals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Upcoming Arrivals
            {arrivals.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {arrivals.length} approved
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {arrivals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Ship className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No upcoming arrivals
            </div>
          ) : (
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {arrivals.map((arrival) => (
                  <div
                    key={arrival.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">
                            {arrival.boat_name}
                          </span>
                          <Badge 
                            variant={getDateBadgeVariant(arrival.requested_arrival)} 
                            className="text-xs"
                          >
                            {getDateLabel(arrival.requested_arrival)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {arrival.boat_make} {arrival.boat_model}
                          {arrival.boat_length_ft && ` • ${arrival.boat_length_ft}ft`}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          {arrival.assigned_slip && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Slip {arrival.assigned_slip}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {arrival.stay_type}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="shrink-0"
                        onClick={() => openCheckIn(arrival)}
                      >
                        <LogIn className="w-4 h-4 mr-1" />
                        Check In
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Check-In Dialog */}
      <Dialog open={!!checkInDialog} onOpenChange={() => setCheckInDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Vessel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{checkInDialog?.boat_name}</p>
              <p className="text-sm text-muted-foreground">
                {checkInDialog?.boat_make} {checkInDialog?.boat_model}
                {checkInDialog?.boat_length_ft && ` • ${checkInDialog?.boat_length_ft}ft`}
              </p>
              {checkInDialog?.owner_name && (
                <p className="text-sm text-muted-foreground mt-1">
                  Owner: {checkInDialog.owner_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slip">Assign Slip Number</Label>
              <Input
                id="slip"
                placeholder="e.g., A-15"
                value={slipNumber}
                onChange={(e) => setSlipNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleCheckIn} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
