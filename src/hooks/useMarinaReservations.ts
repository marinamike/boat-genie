import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type StayType = "transient" | "monthly" | "seasonal" | "annual";
export type ReservationStatus = "pending" | "approved" | "rejected" | "checked_in" | "checked_out" | "cancelled";

export interface MarinaReservation {
  id: string;
  marina_id: string | null;
  boat_id: string;
  owner_id: string;
  stay_type: StayType;
  status: ReservationStatus;
  requested_arrival: string;
  requested_departure: string | null;
  actual_arrival: string | null;
  actual_departure: string | null;
  assigned_slip: string | null;
  assigned_dock_location: string | null;
  power_requirements: string | null;
  special_requests: string | null;
  insurance_verified: boolean;
  registration_verified: boolean;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  boat?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    length_ft: number | null;
  };
  owner?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface CreateReservationParams {
  marinaId?: string;
  boatId: string;
  stayType: StayType;
  requestedArrival: string;
  requestedDeparture?: string;
  powerRequirements?: string;
  specialRequests?: string;
  // Vessel specs for lead email
  vesselSpecs?: {
    loa: number | null;
    beam: number | null;
    draft: number | null;
    power: string | null;
    vesselType: string;
    imageUrl: string | null;
  };
}

export function useMarinaReservations(role: "owner" | "marina" = "owner") {
  const [reservations, setReservations] = useState<MarinaReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReservations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("marina_reservations")
        .select("*")
        .order("created_at", { ascending: false });

      // If owner, filter by owner_id
      if (role === "owner") {
        query = query.eq("owner_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setReservations([]);
        setLoading(false);
        return;
      }

      // Fetch boat details
      const boatIds = [...new Set(data.map(r => r.boat_id))];
      const { data: boatsData } = await supabase
        .from("boats")
        .select("id, name, make, model, length_ft")
        .in("id", boatIds);

      // Fetch owner profiles for marina view
      let ownersData: any[] = [];
      if (role === "marina") {
        const ownerIds = [...new Set(data.map(r => r.owner_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", ownerIds);
        ownersData = profiles || [];
      }

      // Combine data
      const combined = data.map(reservation => ({
        ...reservation,
        stay_type: reservation.stay_type as StayType,
        status: reservation.status as ReservationStatus,
        boat: boatsData?.find(b => b.id === reservation.boat_id),
        owner: ownersData?.find(o => o.id === reservation.owner_id),
      }));

      setReservations(combined);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [role, toast]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const createReservation = async (params: CreateReservationParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert the reservation
      const { data: reservation, error } = await supabase
        .from("marina_reservations")
        .insert({
          marina_id: params.marinaId || null,
          boat_id: params.boatId,
          owner_id: user.id,
          stay_type: params.stayType,
          requested_arrival: params.requestedArrival,
          requested_departure: params.requestedDeparture || null,
          power_requirements: params.powerRequirements || null,
          special_requests: params.specialRequests || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Check if marina is a subscriber (has is_claimed = true)
      let isMarinaSubscriber = false;
      let marinaData: { marina_name: string; contact_email: string | null; is_claimed: boolean } | null = null;

      if (params.marinaId) {
        const { data: marina } = await supabase
          .from("marinas")
          .select("marina_name, contact_email, is_claimed")
          .eq("id", params.marinaId)
          .single();
        
        marinaData = marina;
        isMarinaSubscriber = marina?.is_claimed === true;
      }

      if (isMarinaSubscriber && marinaData) {
        // Marina is a subscriber - create notification for dockmaster
        const { data: marinaRow } = await supabase
          .from("marinas")
          .select("manager_id")
          .eq("id", params.marinaId)
          .single();

        if (marinaRow?.manager_id) {
          await supabase.from("notifications").insert({
            user_id: marinaRow.manager_id,
            type: "reservation_request",
            title: "New Reservation Request",
            message: `A ${params.vesselSpecs?.loa || "?"}ft vessel has requested a ${params.stayType} stay arriving ${params.requestedArrival}`,
            related_id: reservation.id,
          });
        }

        toast({
          title: "Reservation Submitted",
          description: `Your request has been sent to ${marinaData.marina_name}`,
        });
      } else if (marinaData?.contact_email) {
        // Marina is NOT a subscriber - send lead email
        try {
          await supabase.functions.invoke("send-marina-lead", {
            body: {
              reservationId: reservation.id,
              marinaName: marinaData.marina_name,
              marinaEmail: marinaData.contact_email,
              vesselSpecs: params.vesselSpecs || {
                loa: null,
                beam: null,
                draft: null,
                power: params.powerRequirements || null,
                vesselType: "Vessel",
                imageUrl: null,
              },
              dates: {
                arrival: params.requestedArrival,
                departure: params.requestedDeparture || null,
              },
              stayType: params.stayType,
            },
          });
        } catch (leadError) {
          console.error("Error sending lead email:", leadError);
        }

        toast({
          title: "Request Submitted",
          description: "We've notified the marina about your interest. They'll reach out if a slip is available.",
        });
      } else {
        toast({
          title: "Reservation Submitted",
          description: "Your reservation request has been recorded",
        });
      }

      fetchReservations();
      return true;
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast({
        title: "Error",
        description: "Failed to submit reservation",
        variant: "destructive",
      });
      return false;
    }
  };

  const approveReservation = async (
    reservationId: string,
    assignedSlip?: string,
    assignedDockLocation?: string,
    adminNotes?: string
  ) => {
    try {
      // Get reservation details first
      const { data: reservation } = await supabase
        .from("marina_reservations")
        .select("owner_id, marina_id")
        .eq("id", reservationId)
        .single();

      const { error } = await supabase
        .from("marina_reservations")
        .update({
          status: "approved",
          assigned_slip: assignedSlip || null,
          assigned_dock_location: assignedDockLocation || null,
          admin_notes: adminNotes || null,
        })
        .eq("id", reservationId);

      if (error) throw error;

      // Get marina name for notification
      let marinaName = "the marina";
      if (reservation?.marina_id) {
        const { data: marina } = await supabase
          .from("marinas")
          .select("marina_name")
          .eq("id", reservation.marina_id)
          .single();
        if (marina) marinaName = marina.marina_name;
      }

      // Notify the owner
      if (reservation?.owner_id) {
        const slipMessage = assignedSlip ? ` at Slip ${assignedSlip}` : "";
        await supabase.from("notifications").insert({
          user_id: reservation.owner_id,
          type: "reservation_approved",
          title: "Reservation Approved! 🎉",
          message: `Great news! ${marinaName} has approved your stay${slipMessage}.`,
          related_id: reservationId,
        });
      }

      toast({
        title: "Reservation Approved",
        description: "The reservation has been approved and the owner has been notified",
      });

      fetchReservations();
      return true;
    } catch (error) {
      console.error("Error approving reservation:", error);
      toast({
        title: "Error",
        description: "Failed to approve reservation",
        variant: "destructive",
      });
      return false;
    }
  };

  const rejectReservation = async (reservationId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("marina_reservations")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", reservationId);

      if (error) throw error;

      toast({
        title: "Reservation Rejected",
        description: "The reservation has been rejected",
      });

      fetchReservations();
      return true;
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      toast({
        title: "Error",
        description: "Failed to reject reservation",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkDocumentsVerified = async (boatId: string) => {
    try {
      const { data, error } = await supabase
        .from("vessel_documents")
        .select("category")
        .eq("boat_id", boatId)
        .in("category", ["insurance", "registration"]);

      if (error) throw error;

      const hasInsurance = data?.some(d => d.category === "insurance");
      const hasRegistration = data?.some(d => d.category === "registration");

      return { hasInsurance, hasRegistration };
    } catch (error) {
      console.error("Error checking documents:", error);
      return { hasInsurance: false, hasRegistration: false };
    }
  };

  return {
    reservations,
    loading,
    refetch: fetchReservations,
    createReservation,
    approveReservation,
    rejectReservation,
    checkDocumentsVerified,
  };
}
