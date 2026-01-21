import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CheckInResult {
  success: boolean;
  method: "qr_verified" | "manual_gps";
  message: string;
}

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const MANUAL_CHECKIN_REASONS = [
  "QR Code damaged or unreadable",
  "QR Code missing from location",
  "Low light conditions",
  "Camera malfunction",
  "Other technical issue",
];

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 20902231; // Earth's radius in feet
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useQRCheckIn() {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualCheckIn, setShowManualCheckIn] = useState(false);
  const [gpsPosition, setGpsPosition] = useState<GPSPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const { toast } = useToast();

  const verifyQRCode = useCallback(async (
    scannedCode: string,
    workOrderId: string,
    boatId: string
  ): Promise<CheckInResult> => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Look up the QR code
      const { data: qrCode, error: qrError } = await supabase
        .from("marina_qr_codes")
        .select("id, marina_id, slip_id, label")
        .eq("code", scannedCode)
        .eq("is_active", true)
        .maybeSingle();

      if (qrError || !qrCode) {
        return {
          success: false,
          method: "qr_verified",
          message: "Invalid or inactive QR code. Please use manual check-in.",
        };
      }

      // Record the check-in
      const { error: checkInError } = await supabase
        .from("provider_checkins")
        .insert({
          work_order_id: workOrderId,
          provider_id: session.user.id,
          boat_id: boatId,
          check_in_method: "qr_verified",
          qr_code_id: qrCode.id,
        });

      if (checkInError) throw checkInError;

      // Update work order status
      const { error: updateError } = await supabase
        .from("work_orders")
        .update({
          status: "in_progress",
          provider_checked_in_at: new Date().toISOString(),
          check_in_method: "qr_verified",
        })
        .eq("id", workOrderId);

      if (updateError) throw updateError;

      // Create boat log entry
      await supabase.from("boat_logs").insert({
        boat_id: boatId,
        work_order_id: workOrderId,
        title: "Provider Check-In",
        description: "Provider arrived on-site. Verified via QR code scan.",
        log_type: "service",
        created_by: session.user.id,
      });

      return {
        success: true,
        method: "qr_verified",
        message: "Check-in verified via QR code. Owner has been notified.",
      };
    } catch (error: any) {
      console.error("QR verification error:", error);
      return {
        success: false,
        method: "qr_verified",
        message: error.message || "Failed to verify QR code",
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const requestGPSLocation = useCallback((): Promise<GPSPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS not supported on this device"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setGpsPosition(pos);
          setGpsError(null);
          resolve(pos);
        },
        (error) => {
          let message = "Failed to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location permission denied. Please enable GPS access.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
          }
          setGpsError(message);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const performManualCheckIn = useCallback(async (
    workOrderId: string,
    boatId: string,
    marinaLat: number | null,
    marinaLng: number | null,
    reason: string
  ): Promise<CheckInResult> => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Get GPS location
      const position = await requestGPSLocation();

      // Calculate distance if marina coordinates exist
      let distanceFromMarina: number | null = null;
      if (marinaLat && marinaLng) {
        distanceFromMarina = calculateDistance(
          position.latitude,
          position.longitude,
          marinaLat,
          marinaLng
        );

        // Check if within 500 feet
        if (distanceFromMarina > 500) {
          return {
            success: false,
            method: "manual_gps",
            message: `You are ${Math.round(distanceFromMarina)} feet from the marina. Manual check-in requires being within 500 feet.`,
          };
        }
      }

      // Record the check-in
      const { error: checkInError } = await supabase
        .from("provider_checkins")
        .insert({
          work_order_id: workOrderId,
          provider_id: session.user.id,
          boat_id: boatId,
          check_in_method: "manual_gps",
          gps_latitude: position.latitude,
          gps_longitude: position.longitude,
          gps_accuracy_meters: position.accuracy,
          manual_reason: reason,
          distance_from_marina_ft: distanceFromMarina,
        });

      if (checkInError) throw checkInError;

      // Update work order status
      const { error: updateError } = await supabase
        .from("work_orders")
        .update({
          status: "in_progress",
          provider_checked_in_at: new Date().toISOString(),
          check_in_method: "manual_gps",
        })
        .eq("id", workOrderId);

      if (updateError) throw updateError;

      // Create boat log entry
      await supabase.from("boat_logs").insert({
        boat_id: boatId,
        work_order_id: workOrderId,
        title: "Provider Check-In (Manual)",
        description: `Provider arrived on-site. Manual GPS verification used. Reason: ${reason}`,
        log_type: "service",
        created_by: session.user.id,
      });

      return {
        success: true,
        method: "manual_gps",
        message: "Manual check-in verified via GPS. Owner has been notified.",
      };
    } catch (error: any) {
      console.error("Manual check-in error:", error);
      return {
        success: false,
        method: "manual_gps",
        message: error.message || "Failed to complete manual check-in",
      };
    } finally {
      setIsProcessing(false);
    }
  }, [requestGPSLocation]);

  return {
    isScanning,
    setIsScanning,
    isProcessing,
    showManualCheckIn,
    setShowManualCheckIn,
    gpsPosition,
    gpsError,
    verifyQRCode,
    requestGPSLocation,
    performManualCheckIn,
    MANUAL_CHECKIN_REASONS,
  };
}
