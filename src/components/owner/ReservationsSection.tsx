import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Anchor, Calendar, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Reservation {
  id: string;
  status: string;
  stay_type: string;
  requested_arrival: string;
  requested_departure: string | null;
  assigned_slip: string | null;
  created_at: string;
  marina?: {
    marina_name: string;
  } | null;
  boat?: {
    name: string;
  } | null;
}

interface ReservationsSectionProps {
  userId: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "secondary",
  },
  approved: {
    label: "Confirmed",
    icon: CheckCircle2,
    variant: "default",
  },
  checked_in: {
    label: "Checked In",
    icon: Anchor,
    variant: "default",
  },
  checked_out: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "outline",
  },
  rejected: {
    label: "Declined",
    icon: XCircle,
    variant: "destructive",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    variant: "destructive",
  },
};

const stayTypeLabels: Record<string, string> = {
  transient: "Transient",
  monthly: "Monthly",
  seasonal: "Seasonal",
  annual: "Annual",
  longterm: "Long-Term",
  day_dock: "Day Dock",
};

export function ReservationsSection({ userId }: ReservationsSectionProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      const { data, error } = await supabase
        .from("marina_reservations")
        .select(`
          id,
          status,
          stay_type,
          requested_arrival,
          requested_departure,
          assigned_slip,
          created_at,
          marina:marinas(marina_name),
          boat:boats(name)
        `)
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reservations:", error);
      } else {
        setReservations(data as unknown as Reservation[]);
      }
      setLoading(false);
    };

    fetchReservations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("owner-reservations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marina_reservations",
          filter: `owner_id=eq.${userId}`,
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) return null;
  if (reservations.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold tracking-tight mb-4">My Reservations</h2>
      <div className="space-y-3">
        {reservations.map((reservation) => {
          const status = statusConfig[reservation.status] || statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <Card 
              key={reservation.id} 
              className="transition-all hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium truncate">
                        {reservation.marina?.marina_name || "Marina Request"}
                      </span>
                    </div>
                    
                    {reservation.boat?.name && (
                      <div className="text-sm text-muted-foreground mb-1">
                        {reservation.boat.name}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(reservation.requested_arrival), "MMM d, yyyy")}
                          {reservation.requested_departure && (
                            <> - {format(new Date(reservation.requested_departure), "MMM d, yyyy")}</>
                          )}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stayTypeLabels[reservation.stay_type] || reservation.stay_type}
                      </Badge>
                    </div>

                    {reservation.assigned_slip && reservation.status === "approved" && (
                      <div className="mt-2 text-sm text-foreground">
                        <span className="font-medium">Assigned Slip:</span> {reservation.assigned_slip}
                      </div>
                    )}
                  </div>

                  <Badge variant={status.variant} className="flex items-center gap-1 flex-shrink-0">
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
