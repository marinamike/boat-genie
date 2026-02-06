import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Ship, CheckCircle, XCircle, Zap, Loader2 } from "lucide-react";
import { useMarinaReservations, MarinaReservation } from "@/hooks/useMarinaReservations";
import { useBusiness } from "@/contexts/BusinessContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface PendingReservationsCardProps {
  onApprove?: (reservation: MarinaReservation) => void;
  onReject?: (reservation: MarinaReservation) => void;
}

export function PendingReservationsCard({ onApprove, onReject }: PendingReservationsCardProps) {
  const { business } = useBusiness();
  const { reservations, loading } = useMarinaReservations("marina", business?.id);
  const navigate = useNavigate();

  const pendingReservations = reservations.filter(r => r.status === "pending");

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Pending Reservations
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Pending Reservations
          {pendingReservations.length > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {pendingReservations.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingReservations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No pending reservations
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {pendingReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm truncate">
                          {reservation.boat?.name || "Unknown Vessel"}
                        </span>
                      </div>
                      {reservation.boat && (
                        <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                          {reservation.boat.length_ft && `${reservation.boat.length_ft}ft`}
                          {reservation.boat.make && ` ${reservation.boat.make}`}
                          {reservation.boat.model && ` ${reservation.boat.model}`}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 ml-6">
                        <span>{format(new Date(reservation.requested_arrival), "MMM d")}</span>
                        {reservation.requested_departure && (
                          <>
                            <span>→</span>
                            <span>{format(new Date(reservation.requested_departure), "MMM d")}</span>
                          </>
                        )}
                        <Badge variant="outline" className="capitalize text-xs">
                          {reservation.stay_type}
                        </Badge>
                      </div>
                      {reservation.power_requirements && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 ml-6">
                          <Zap className="w-3 h-3" />
                          {reservation.power_requirements}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {onApprove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onApprove(reservation)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {onReject && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onReject(reservation)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {pendingReservations.length > 0 && (
          <Button 
            variant="link" 
            className="w-full mt-2 text-xs"
            onClick={() => navigate("/marina/reservations")}
          >
            View All Reservations
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
