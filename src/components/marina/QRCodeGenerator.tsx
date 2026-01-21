import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Printer, Plus, Trash2, Loader2, Download } from "lucide-react";
import type { MarinaSlip } from "@/hooks/useMarinaSettings";

interface QRCode {
  id: string;
  code: string;
  label: string | null;
  slip_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface QRCodeGeneratorProps {
  marinaId: string | null;
  slips: MarinaSlip[];
}

export function QRCodeGenerator({ marinaId, slips }: QRCodeGeneratorProps) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [selectedSlip, setSelectedSlip] = useState<string>("property");
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQRCodes();
  }, [marinaId]);

  const fetchQRCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("marina_qr_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateUniqueCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MAR-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const code = generateUniqueCode();
      const { error } = await supabase.from("marina_qr_codes").insert({
        marina_id: marinaId,
        slip_id: selectedSlip === "property" ? null : selectedSlip,
        code,
        label: newLabel || (selectedSlip === "property" ? "Property Entrance" : `Slip ${slips.find(s => s.id === selectedSlip)?.slip_number}`),
        created_by: session.user.id,
      });

      if (error) throw error;

      toast({ title: "QR code created" });
      setNewLabel("");
      setSelectedSlip("property");
      fetchQRCodes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("marina_qr_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "QR code deleted" });
      fetchQRCodes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePrint = (qrCode: QRCode) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Marina QR Code - ${qrCode.label}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #000;
              padding: 30px;
              border-radius: 12px;
            }
            h1 { margin: 0 0 10px; font-size: 24px; }
            .code { font-family: monospace; font-size: 14px; color: #666; margin-bottom: 20px; }
            svg { margin: 20px 0; }
            .instructions { font-size: 12px; color: #666; max-width: 200px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${qrCode.label || "Marina Check-In"}</h1>
            <div class="code">${qrCode.code}</div>
            <svg width="200" height="200" viewBox="0 0 200 200">
              ${document.getElementById(`qr-${qrCode.id}`)?.innerHTML || ""}
            </svg>
            <p class="instructions">Scan this code with your phone to verify your arrival at the marina.</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = (qrCode: QRCode) => {
    const svg = document.getElementById(`qr-${qrCode.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `marina-qr-${qrCode.code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Check-In Codes
        </CardTitle>
        <CardDescription>
          Generate QR codes for provider on-site verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New QR Code */}
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <h4 className="font-medium text-sm">Generate New Code</h4>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={selectedSlip} onValueChange={setSelectedSlip}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property">Property Entrance</SelectItem>
                  {slips.map((slip) => (
                    <SelectItem key={slip.id} value={slip.id}>
                      Slip {slip.slip_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Custom Label (optional)</Label>
              <Input
                id="label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., Main Dock Gate"
              />
            </div>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Generate QR Code
            </Button>
          </div>
        </div>

        {/* Existing QR Codes */}
        {qrCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No QR codes generated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Active Codes</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{qr.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{qr.code}</p>
                    </div>
                    <Badge variant={qr.is_active ? "default" : "secondary"}>
                      {qr.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex justify-center bg-white p-3 rounded" ref={printRef}>
                    <QRCodeSVG
                      id={`qr-${qr.id}`}
                      value={qr.code}
                      size={120}
                      level="H"
                      includeMargin
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePrint(qr)}
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(qr)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(qr.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
