import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Ship, 
  User, 
  MapPin, 
  DollarSign,
  Camera,
  Clock,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import type { QCQueueItem } from "@/hooks/useQCQueue";
import { QCChecklist } from "@/components/qc/QCChecklist";
import { supabase } from "@/integrations/supabase/client";

interface QCInspectorProps {
  item: QCQueueItem;
  onBack: () => void;
  onComplete: () => void;
}

interface CompletionPhoto {
  id: string;
  image_url: string;
  created_at: string;
}

export function QCInspector({ item, onBack, onComplete }: QCInspectorProps) {
  const [photos, setPhotos] = useState<CompletionPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      // Fetch completion photos from messages
      const { data } = await supabase
        .from("messages")
        .select("id, image_url, created_at")
        .eq("work_order_id", item.id)
        .eq("message_type", "image")
        .not("image_url", "is", null)
        .order("created_at", { ascending: false });

      setPhotos((data || []).filter(m => m.image_url) as CompletionPhoto[]);
      setLoadingPhotos(false);
    };

    fetchPhotos();
  }, [item.id]);

  const laborBalance = (item.escrow_amount || 0) - (item.materials_deposit || 0);

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {item.boat_name}
            {item.is_emergency && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">{item.title}</p>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-4 pr-4">
          {/* Boat & Job Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Owner</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {item.owner_name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p className="font-medium">{item.provider_name || "Unassigned"}</p>
                </div>
                {item.marina_name && (
                  <div>
                    <p className="text-muted-foreground">Marina</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {item.marina_name}
                    </p>
                  </div>
                )}
                {item.boat_length_ft && (
                  <div>
                    <p className="text-muted-foreground">Boat Length</p>
                    <p className="font-medium">{item.boat_length_ft} ft</p>
                  </div>
                )}
              </div>

              {item.qc_requested_at && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    QC requested {format(new Date(item.qc_requested_at), "PPp")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Photos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Completion Photos ({photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPhotos ? (
                <div className="text-center py-4 text-muted-foreground">Loading photos...</div>
              ) : photos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No completion photos uploaded
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={photo.image_url}
                        alt="Completion photo"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* QC Checklist */}
          <QCChecklist
            workOrderId={item.id}
            boatId={item.boat_id}
            isVerifier={true}
            escrowStatus={item.escrow_status}
            materialsDeposit={item.materials_deposit || 0}
            laborBalance={laborBalance > 0 ? laborBalance : item.escrow_amount || 0}
            providerId={item.provider_id || undefined}
            providerName={item.provider_name || undefined}
            onComplete={onComplete}
          />

          {/* Payment Summary */}
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Escrow Balance</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  ${(item.escrow_amount || 0).toFixed(2)}
                </span>
              </div>
              {(item.materials_deposit || 0) > 0 && (
                <div className="mt-2 pt-2 border-t border-green-500/20 flex justify-between text-sm">
                  <span className="text-muted-foreground">Materials (released)</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ${(item.materials_deposit || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Verify all items to release funds to provider
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
