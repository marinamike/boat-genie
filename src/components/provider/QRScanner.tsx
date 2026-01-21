import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X } from "lucide-react";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  onScanFailed: () => void;
}

export function QRScanner({ open, onClose, onScan, onScanFailed }: QRScannerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScanned = useRef(false);

  useEffect(() => {
    if (!open) {
      hasScanned.current = false;
      return;
    }

    const initScanner = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (!hasScanned.current) {
              hasScanned.current = true;
              onScan(decodedText);
            }
          },
          () => {
            // QR code scan error - ignore, keep scanning
          }
        );

        setIsInitializing(false);
      } catch (err: any) {
        console.error("QR Scanner error:", err);
        setError(err?.message || "Failed to start camera");
        setIsInitializing(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [open, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      scannerRef.current = null;
    }
    onClose();
  };

  const handleManualFallback = () => {
    handleClose();
    onScanFailed();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Marina QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div 
            id="qr-reader" 
            className="w-full aspect-square bg-muted rounded-lg overflow-hidden relative"
          >
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Starting camera...</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <p className="font-medium">Camera Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Point your camera at the marina QR code to verify your arrival.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="secondary" className="flex-1" onClick={handleManualFallback}>
              Manual Check-In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
