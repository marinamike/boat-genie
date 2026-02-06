import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Anchor, Ship, Wrench, LogOut, RefreshCw, Clock, User, DollarSign } from "lucide-react";
import { useLiveDockStatus, DockStatusWithDetails } from "@/hooks/useLiveDockStatus";
import { useYardAssets } from "@/hooks/useYardAssets";
import { CheckoutBillingSheet } from "@/components/slips/CheckoutBillingSheet";
import { formatDistanceToNow } from "date-fns";

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

export function LiveDockList() {
  const { dockStatus, loading, refetch, checkOutBoat } = useLiveDockStatus();
  const { assets, meters } = useYardAssets();
  const [checkoutTarget, setCheckoutTarget] = useState<DockStatusWithDetails | null>(null);
  const [showBillingSheet, setShowBillingSheet] = useState(false);

  // Find the slip asset for the checkout target
  const targetSlipAsset = useMemo(() => {
    if (!checkoutTarget?.slip_number) return null;
    return assets.find((a) => a.asset_name === checkoutTarget.slip_number);
  }, [checkoutTarget, assets]);

  const handleCheckoutClick = (status: DockStatusWithDetails) => {
    setCheckoutTarget(status);
    setShowBillingSheet(true);
  };

  const handleCheckoutComplete = async () => {
    if (!checkoutTarget) return;
    await checkOutBoat(checkoutTarget.id);
    setCheckoutTarget(null);
    setShowBillingSheet(false);
    refetch();
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
                      onClick={() => handleCheckoutClick(status)}
                      className="shrink-0"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
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

      {/* Checkout Billing Sheet */}
      <CheckoutBillingSheet
        open={showBillingSheet}
        onOpenChange={setShowBillingSheet}
        dockStatus={checkoutTarget}
        slipAsset={targetSlipAsset}
        meters={meters}
        onCheckoutComplete={handleCheckoutComplete}
      />
    </Card>
  );
}
