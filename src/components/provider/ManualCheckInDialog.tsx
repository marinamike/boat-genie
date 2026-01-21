import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQRCheckIn } from "@/hooks/useQRCheckIn";

interface ManualCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  workOrderId: string;
  boatId: string;
  marinaLat: number | null;
  marinaLng: number | null;
  onSuccess: () => void;
}

export function ManualCheckInDialog({
  open,
  onClose,
  workOrderId,
  boatId,
  marinaLat,
  marinaLng,
  onSuccess,
}: ManualCheckInDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "requesting_gps" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { performManualCheckIn, gpsPosition, gpsError, MANUAL_CHECKIN_REASONS } = useQRCheckIn();

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setStatus("requesting_gps");
    setErrorMessage(null);

    try {
      setStatus("verifying");
      const result = await performManualCheckIn(
        workOrderId,
        boatId,
        marinaLat,
        marinaLng,
        selectedReason
      );

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setStatus("error");
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to complete check-in");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setSelectedReason("");
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Manual Check-In
          </DialogTitle>
          <DialogDescription>
            GPS verification required. You must be within 500 feet of the marina.
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="font-medium text-lg">Check-In Complete!</p>
            <p className="text-sm text-muted-foreground">Owner has been notified.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* GPS Status */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {status === "requesting_gps" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting GPS location...</span>
                  </>
                ) : gpsPosition ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>GPS location acquired</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>GPS will be requested when you submit</span>
                  </>
                )}
              </div>
              {gpsError && (
                <p className="text-xs text-destructive mt-1">{gpsError}</p>
              )}
            </div>

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Why couldn't you scan the QR code?
              </Label>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {MANUAL_CHECKIN_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason} id={reason} />
                    <Label htmlFor={reason} className="text-sm font-normal cursor-pointer">
                      {reason}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Warning about logging */}
            <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs">
              <p className="font-medium">Note:</p>
              <p>Manual check-ins are logged in the boat's permanent record for transparency.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={!selectedReason || status === "requesting_gps" || status === "verifying"}
              >
                {status === "verifying" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Verify & Check-In
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
