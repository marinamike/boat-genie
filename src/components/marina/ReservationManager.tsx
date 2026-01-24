import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Ship, CheckCircle, XCircle, Clock, MapPin, Loader2 } from "lucide-react";
import { useMarinaReservations, MarinaReservation, ReservationStatus } from "@/hooks/useMarinaReservations";
import { useLiveDockStatus } from "@/hooks/useLiveDockStatus";
import { format } from "date-fns";

const statusBadgeVariant = (status: ReservationStatus) => {
  switch (status) {
    case "pending":
      return "secondary";
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "checked_in":
      return "default";
    case "checked_out":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

const statusLabel = (status: ReservationStatus) => {
  switch (status) {
    case "pending":
      return "Pending Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "checked_in":
      return "Checked In";
    case "checked_out":
      return "Checked Out";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

export function ReservationManager() {
  const { reservations, loading, approveReservation, rejectReservation } = useMarinaReservations("marina");
  const { checkInBoat } = useLiveDockStatus();
  
  const [selectedReservation, setSelectedReservation] = useState<MarinaReservation | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "check-in" | null>(null);
  const [assignedSlip, setAssignedSlip] = useState("");
  const [dockLocation, setDockLocation] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const pendingReservations = reservations.filter(r => r.status === "pending");
  const approvedReservations = reservations.filter(r => r.status === "approved");
  const activeReservations = reservations.filter(r => r.status === "checked_in");

  const openAction = (reservation: MarinaReservation, type: "approve" | "reject" | "check-in") => {
    setSelectedReservation(reservation);
    setActionType(type);
    setAssignedSlip(reservation.assigned_slip || "");
    setDockLocation(reservation.assigned_dock_location || "");
    setAdminNotes(reservation.admin_notes || "");
    setRejectionReason("");
  };

  const closeDialog = () => {
    setSelectedReservation(null);
    setActionType(null);
    setAssignedSlip("");
    setDockLocation("");
    setAdminNotes("");
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (!selectedReservation) return;
    setProcessing(true);
    await approveReservation(selectedReservation.id, assignedSlip, dockLocation, adminNotes);
    setProcessing(false);
    closeDialog();
  };

  const handleReject = async () => {
    if (!selectedReservation || !rejectionReason) return;
    setProcessing(true);
    await rejectReservation(selectedReservation.id, rejectionReason);
    setProcessing(false);
    closeDialog();
  };

  const handleCheckIn = async () => {
    if (!selectedReservation) return;
    setProcessing(true);
    await checkInBoat(
      selectedReservation.boat_id,
      selectedReservation.assigned_slip || assignedSlip,
      selectedReservation.stay_type,
      selectedReservation.id
    );
    setProcessing(false);
    closeDialog();
  };

  const renderReservationCard = (reservation: MarinaReservation) => (
    <div
      key={reservation.id}
      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Ship className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{reservation.boat?.name || "Unknown Vessel"}</span>
            <Badge variant={statusBadgeVariant(reservation.status)}>
              {statusLabel(reservation.status)}
            </Badge>
          </div>
          
          {reservation.boat && (
            <p className="text-sm text-muted-foreground">
              {reservation.boat.make} {reservation.boat.model}
              {reservation.boat.length_ft && ` • ${reservation.boat.length_ft}ft`}
            </p>
          )}

          {reservation.owner && (
            <p className="text-sm text-muted-foreground mt-1">
              Owner: {reservation.owner.full_name || reservation.owner.email}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {format(new Date(reservation.requested_arrival), "MMM d, yyyy")}
              {reservation.requested_departure && (
                <> - {format(new Date(reservation.requested_departure), "MMM d, yyyy")}</>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {reservation.stay_type}
            </Badge>
          </div>

          {reservation.assigned_slip && (
            <div className="flex items-center gap-1 mt-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Slip {reservation.assigned_slip}
              {reservation.assigned_dock_location && ` - ${reservation.assigned_dock_location}`}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {reservation.status === "pending" && (
            <>
              <Button size="sm" onClick={() => openAction(reservation, "approve")}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => openAction(reservation, "reject")}>
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          {reservation.status === "approved" && (
            <Button size="sm" onClick={() => openAction(reservation, "check-in")}>
              <Clock className="w-4 h-4 mr-1" />
              Check In
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reservation Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reservation Requests
            {pendingReservations.length > 0 && (
              <Badge variant="destructive">{pendingReservations.length} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No reservation requests yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {pendingReservations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Pending Review</h4>
                    <div className="space-y-2">
                      {pendingReservations.map(renderReservationCard)}
                    </div>
                  </div>
                )}

                {approvedReservations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Approved & Awaiting Arrival</h4>
                    <div className="space-y-2">
                      {approvedReservations.map(renderReservationCard)}
                    </div>
                  </div>
                )}

                {activeReservations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Currently Checked In</h4>
                    <div className="space-y-2">
                      {activeReservations.map(renderReservationCard)}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={actionType === "approve"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slip">Assign Slip Number</Label>
              <Input
                id="slip"
                placeholder="e.g., A-15"
                value={assignedSlip}
                onChange={(e) => setAssignedSlip(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Dock Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Main Dock, East Side"
                value={dockLocation}
                onChange={(e) => setDockLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Approve Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === "reject"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectionReason}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Reject Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-In Dialog */}
      <Dialog open={actionType === "check-in"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Vessel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm check-in for {selectedReservation?.boat?.name}?
            </p>
            {!selectedReservation?.assigned_slip && (
              <div className="space-y-2">
                <Label htmlFor="slip-checkin">Assign Slip Number</Label>
                <Input
                  id="slip-checkin"
                  placeholder="e.g., A-15"
                  value={assignedSlip}
                  onChange={(e) => setAssignedSlip(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleCheckIn} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
