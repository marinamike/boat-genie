import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Ship, CheckCircle, XCircle, Clock, MapPin, Loader2, AlertTriangle, DollarSign } from "lucide-react";
import { useMarinaReservations, MarinaReservation, ReservationStatus } from "@/hooks/useMarinaReservations";
import { useBusiness } from "@/contexts/BusinessContext";
import { useLiveDockStatus, DockStatusWithDetails } from "@/hooks/useLiveDockStatus";
import { useYardAssets } from "@/hooks/useYardAssets";
import { CheckoutBillingSheet } from "@/components/slips/CheckoutBillingSheet";
import { supabase } from "@/integrations/supabase/client";
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

interface BoatDimensions {
  loa: number | null;
  beam: number | null;
  draft: number | null;
}

export function ReservationManager() {
  const { business } = useBusiness();
  const { reservations, loading, approveReservation, rejectReservation, refetch } = useMarinaReservations("marina", business?.id);
  const { checkInBoat, checkOutBoat } = useLiveDockStatus();
  const { assets, meters } = useYardAssets();
  
  const [selectedReservation, setSelectedReservation] = useState<MarinaReservation | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "check-in" | null>(null);
  const [assignedSlip, setAssignedSlip] = useState("");
  const [dockLocation, setDockLocation] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [boatDimensions, setBoatDimensions] = useState<BoatDimensions | null>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  
  // Checkout billing state
  const [checkoutReservation, setCheckoutReservation] = useState<MarinaReservation | null>(null);
  const [checkoutDockStatus, setCheckoutDockStatus] = useState<DockStatusWithDetails | null>(null);
  const [showBillingSheet, setShowBillingSheet] = useState(false);

  const pendingReservations = reservations.filter(r => r.status === "pending");
  const approvedReservations = reservations.filter(r => r.status === "approved");
  const activeReservations = reservations.filter(r => r.status === "checked_in");

  // Fetch boat specs when dialog opens for approve/check-in
  useEffect(() => {
    const fetchBoatSpecs = async () => {
      if (!selectedReservation?.boat_id || (actionType !== "approve" && actionType !== "check-in")) {
        setBoatDimensions(null);
        return;
      }

      setLoadingSpecs(true);
      try {
        const { data } = await supabase
          .from("boat_specs")
          .select("loa_ft, beam_ft, draft_engines_down_ft")
          .eq("boat_id", selectedReservation.boat_id)
          .maybeSingle();

        if (data) {
          setBoatDimensions({
            loa: data.loa_ft,
            beam: data.beam_ft,
            draft: data.draft_engines_down_ft,
          });
        } else {
          // Fallback to boats table
          setBoatDimensions({
            loa: selectedReservation.boat?.length_ft || null,
            beam: null,
            draft: null,
          });
        }
      } catch (error) {
        console.error("Error fetching boat specs:", error);
        setBoatDimensions({
          loa: selectedReservation.boat?.length_ft || null,
          beam: null,
          draft: null,
        });
      } finally {
        setLoadingSpecs(false);
      }
    };

    fetchBoatSpecs();
  }, [selectedReservation?.boat_id, actionType]);

  // Filter slips that fit the boat
  const fittingSlips = useMemo(() => {
    if (!assets.length) return [];

    const boatLoa = boatDimensions?.loa || selectedReservation?.boat?.length_ft || 0;
    const boatBeam = boatDimensions?.beam || 0;
    const boatDraft = boatDimensions?.draft || 0;

    return assets.filter((slip) => {
      // Must be available (no boat currently assigned)
      if (!slip.is_available || slip.current_boat_id) return false;

      // Check LOA if slip has a max
      if (slip.max_loa_ft && boatLoa > 0 && boatLoa > slip.max_loa_ft) return false;

      // Check beam if slip has a max and boat has beam specs
      if (slip.max_beam_ft && boatBeam > 0 && boatBeam > slip.max_beam_ft) return false;

      // Check draft if slip has a max and boat has draft specs
      if (slip.max_draft_ft && boatDraft > 0 && boatDraft > slip.max_draft_ft) return false;

      return true;
    });
  }, [assets, boatDimensions, selectedReservation?.boat?.length_ft]);

  // Find slip asset for checkout billing
  const checkoutSlipAsset = useMemo(() => {
    if (!checkoutReservation?.assigned_slip) return null;
    return assets.find((a) => a.asset_name === checkoutReservation.assigned_slip);
  }, [checkoutReservation, assets]);

  const openAction = async (reservation: MarinaReservation, type: "approve" | "reject" | "check-in") => {
    setSelectedReservation(reservation);
    setActionType(type);
    setAssignedSlip(reservation.assigned_slip || "");
    setDockLocation(reservation.assigned_dock_location || "");
    setAdminNotes(reservation.admin_notes || "");
    setRejectionReason("");
  };

  const openCheckout = async (reservation: MarinaReservation) => {
    // Fetch dock_status record for the reservation
    const { data } = await supabase
      .from("dock_status")
      .select("id, boat_id, slip_number, stay_type, is_active, checked_in_at, checked_out_at")
      .eq("reservation_id", reservation.id)
      .eq("is_active", true)
      .maybeSingle();
    
    if (data) {
      // Fetch boat details
      const { data: boat } = await supabase
        .from("boats")
        .select("id, name, make, model, length_ft")
        .eq("id", data.boat_id)
        .single();

      setCheckoutDockStatus({
        ...data,
        boat: boat || null,
        active_work_orders: [],
      });
      setCheckoutReservation(reservation);
      setShowBillingSheet(true);
    }
  };

  const closeDialog = () => {
    setSelectedReservation(null);
    setActionType(null);
    setAssignedSlip("");
    setDockLocation("");
    setAdminNotes("");
    setRejectionReason("");
  };

  const handleCheckoutComplete = async () => {
    if (!checkoutDockStatus) return;
    await checkOutBoat(checkoutDockStatus.id);
    setCheckoutDockStatus(null);
    setCheckoutReservation(null);
    setShowBillingSheet(false);
    refetch();
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
    refetch();
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
          {reservation.status === "checked_in" && (
            <Button size="sm" variant="outline" onClick={() => openCheckout(reservation)}>
              <DollarSign className="w-4 h-4 mr-1" />
              Check Out
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
            {selectedReservation?.boat && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium">{selectedReservation.boat.name}</p>
                <p className="text-muted-foreground">
                  {selectedReservation.boat.make} {selectedReservation.boat.model}
                  {(boatDimensions?.loa || selectedReservation.boat.length_ft) && 
                    ` • ${boatDimensions?.loa || selectedReservation.boat.length_ft}ft LOA`}
                  {boatDimensions?.beam && ` • ${boatDimensions.beam}ft beam`}
                  {boatDimensions?.draft && ` • ${boatDimensions.draft}ft draft`}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="slip">Assign Slip Number</Label>
              {loadingSpecs ? (
                <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading available slips...
                </div>
              ) : fittingSlips.length > 0 ? (
                <Select value={assignedSlip} onValueChange={setAssignedSlip}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a slip..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fittingSlips.map((slip) => (
                      <SelectItem key={slip.id} value={slip.asset_name}>
                        <div className="flex flex-col">
                          <span>
                            {slip.dock_section && `${slip.dock_section} - `}{slip.asset_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Max: {slip.max_loa_ft || "∞"}ft
                            {slip.max_beam_ft && ` × ${slip.max_beam_ft}ft beam`}
                            {slip.max_draft_ft && ` × ${slip.max_draft_ft}ft draft`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    No slips available that fit this vessel
                  </div>
                  <Input
                    id="slip"
                    placeholder="Enter slip manually..."
                    value={assignedSlip}
                    onChange={(e) => setAssignedSlip(e.target.value)}
                  />
                </div>
              )}
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
                {loadingSpecs ? (
                  <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading available slips...
                  </div>
                ) : fittingSlips.length > 0 ? (
                  <Select value={assignedSlip} onValueChange={setAssignedSlip}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a slip..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fittingSlips.map((slip) => (
                        <SelectItem key={slip.id} value={slip.asset_name}>
                          <span>
                            {slip.dock_section && `${slip.dock_section} - `}{slip.asset_name}
                            <span className="text-xs text-muted-foreground ml-2">
                              (Max: {slip.max_loa_ft || "∞"}ft)
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="slip-checkin"
                    placeholder="Enter slip manually..."
                    value={assignedSlip}
                    onChange={(e) => setAssignedSlip(e.target.value)}
                  />
                )}
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

      {/* Checkout Billing Sheet */}
      <CheckoutBillingSheet
        open={showBillingSheet}
        onOpenChange={setShowBillingSheet}
        dockStatus={checkoutDockStatus}
        reservationId={checkoutReservation?.id}
        slipAsset={checkoutSlipAsset}
        meters={meters}
        onCheckoutComplete={handleCheckoutComplete}
      />
    </>
  );
}
