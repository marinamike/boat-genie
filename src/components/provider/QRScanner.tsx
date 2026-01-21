import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const isRunning = useRef(false);
  const containerIdRef = useRef(`qr-reader-${Date.now()}`);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isRunning.current) {
      try {
        isRunning.current = false;
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Ignore stop errors - scanner may already be stopped
        console.log("Scanner stop handled:", err);
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      hasScanned.current = false;
      stopScanner();
      return;
    }

    // Generate new container ID each time dialog opens
    containerIdRef.current = `qr-reader-${Date.now()}`;

    const initScanner = async () => {
      setIsInitializing(true);
      setError(null);

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 200));

      const container = document.getElementById(containerIdRef.current);
      if (!container) {
        setError("Scanner container not found");
        setIsInitializing(false);
        return;
      }

      try {
        const scanner = new Html5Qrcode(containerIdRef.current);
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
              stopScanner().then(() => onScan(decodedText));
            }
          },
          () => {
            // QR code scan error - ignore, keep scanning
          }
        );

        isRunning.current = true;
        setIsInitializing(false);
      } catch (err: any) {
        console.error("QR Scanner error:", err);
        setError(err?.message || "Failed to start camera");
        setIsInitializing(false);
      }
    };

    initScanner();

    return () => {
      stopScanner();
    };
  }, [open, onScan, stopScanner]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleManualFallback = async () => {
    await stopScanner();
    onClose();
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
          <DialogDescription>
            Point your camera at the marina QR code to verify your arrival.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div 
            id={containerIdRef.current}
            className="w-full aspect-square bg-muted rounded-lg overflow-hidden relative"
          >
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
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

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={handleManualFallback}>
              Manual Check-In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}