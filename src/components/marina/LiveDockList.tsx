import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Anchor, Ship, Wrench, LogOut, RefreshCw, Clock, User, Loader2 } from "lucide-react";
import { useLiveDockStatus, DockStatusWithDetails } from "@/hooks/useLiveDockStatus";
import { formatDistanceToNow, format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

const stayTypeBadgeVariant = (stayType: string | null) => {
  switch (stayType) {
    case "transient":
      return "secondary";
    case "monthly":
      return "default";
    case "seasonal":
      return "outline";
    case "annual":
      return "default";
    default:
      return "secondary";
  }
};

const stayTypeLabel = (stayType: string | null) => {
  switch (stayType) {
    case "transient":
      return "Transient";
    case "monthly":
      return "Monthly";
    case "seasonal":
      return "Seasonal";
    case "annual":
      return "Annual";
    default:
      return "Unknown";
  }
};

const formatDuration = (checkedInAt: string) => {
  const start = new Date(checkedInAt);
  const now = new Date();
  
  const days = differenceInDays(now, start);
  const hours = differenceInHours(now, start) % 24;
  const minutes = differenceInMinutes(now, start) % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (parts.length === 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  
  return parts.join(", ");
};

export function LiveDockList() {
  const { dockStatus, loading, refetch, checkOutBoat } = useLiveDockStatus();
  const [checkoutTarget, setCheckoutTarget] = useState<DockStatusWithDetails | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleConfirmCheckout = async () => {
    if (!checkoutTarget) return;
    setProcessing(true);
    await checkOutBoat(checkoutTarget.id);
    setProcessing(false);
    setCheckoutTarget(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5" />
            Who's on Site
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Anchor className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Ship className="w-5 h-5" />
          Who's on Site
          <Badge variant="secondary" className="ml-2">
            {dockStatus.length} vessels
          </Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={refetch}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {dockStatus.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ship className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No vessels currently on dock</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {dockStatus.map((status) => (
                <div
                  key={status.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">
                          {status.boat?.name || "Unknown Vessel"}
                        </span>
                        {status.slip_number && (
                          <Badge variant="outline" className="shrink-0">
                            Slip {status.slip_number}
                          </Badge>
                        )}
                        <Badge variant={stayTypeBadgeVariant(status.stay_type)} className="shrink-0">
                          {stayTypeLabel(status.stay_type)}
                        </Badge>
                      </div>
                      {status.boat && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {status.boat.make} {status.boat.model}
                          {status.boat.length_ft && ` • ${status.boat.length_ft}ft`}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        Checked in {formatDistanceToNow(new Date(status.checked_in_at), { addSuffix: true })}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCheckoutTarget(status)}
                      className="shrink-0"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Check Out
                    </Button>
                  </div>

                  {/* Active Work Orders */}
                  {status.active_work_orders && status.active_work_orders.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Wrench className="w-3.5 h-3.5" />
                          Active Work Orders
                        </div>
                        {status.active_work_orders.map((wo) => (
                          <div
                            key={wo.id}
                            className="flex items-center gap-2 text-sm bg-primary/5 rounded px-2 py-1.5"
                          >
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span className="font-medium">{wo.provider_name || "Provider"}</span>
                            {wo.service_type && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">{wo.service_type}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={!!checkoutTarget} onOpenChange={(open) => !open && setCheckoutTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out Vessel</DialogTitle>
            <DialogDescription>
              Review the stay duration before checking out this vessel.
            </DialogDescription>
          </DialogHeader>
          {checkoutTarget && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-lg">
                    {checkoutTarget.boat?.name || "Unknown Vessel"}
                  </span>
                </div>
                {checkoutTarget.boat && (
                  <p className="text-sm text-muted-foreground">
                    {checkoutTarget.boat.make} {checkoutTarget.boat.model}
                    {checkoutTarget.boat.length_ft && ` • ${checkoutTarget.boat.length_ft}ft`}
                  </p>
                )}
                {checkoutTarget.slip_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Slip {checkoutTarget.slip_number}</Badge>
                    <Badge variant={stayTypeBadgeVariant(checkoutTarget.stay_type)}>
                      {stayTypeLabel(checkoutTarget.stay_type)}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Checked In</p>
                  <p className="font-medium">
                    {format(new Date(checkoutTarget.checked_in_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium text-primary">
                    {formatDuration(checkoutTarget.checked_in_at)}
                  </p>
                </div>
              </div>

              {checkoutTarget.boat?.length_ft && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                  <p className="text-muted-foreground mb-1">Billing Reference</p>
                  <p className="font-medium">
                    Vessel Length: {checkoutTarget.boat.length_ft}ft
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Final billing calculated based on stay duration and per-foot rates
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutTarget(null)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCheckout} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
              Confirm Check Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
