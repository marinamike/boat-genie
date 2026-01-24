import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Clock, 
  Ship, 
  User,
  MessageSquare,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, differenceInDays } from "date-fns";

interface StaleWorkOrder {
  id: string;
  title: string;
  boat_name: string;
  provider_name?: string;
  status: string;
  created_at: string;
  last_updated: string;
  days_stale: number;
}

export function StaleWorkOrderAlerts() {
  const [staleOrders, setStaleOrders] = useState<StaleWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaleOrders = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch work orders in progress for more than 7 days without QC request
        const { data: workOrders } = await supabase
          .from("work_orders")
          .select(`
            id,
            title,
            status,
            created_at,
            updated_at,
            provider_id,
            boats:boat_id (name)
          `)
          .eq("status", "in_progress")
          .lt("updated_at", sevenDaysAgo.toISOString())
          .order("updated_at", { ascending: true });

        if (!workOrders || workOrders.length === 0) {
          setStaleOrders([]);
          setLoading(false);
          return;
        }

        // Get provider names
        const providerIds = [...new Set(workOrders.map(wo => wo.provider_id).filter(Boolean))];
        let providerMap = new Map<string, string>();

        if (providerIds.length > 0) {
          const { data: providers } = await supabase
            .from("provider_profiles")
            .select("user_id, business_name")
            .in("user_id", providerIds);

          providerMap = new Map((providers || []).map(p => [p.user_id, p.business_name || "Unknown"]));
        }

        const stale: StaleWorkOrder[] = workOrders.map(wo => ({
          id: wo.id,
          title: wo.title,
          boat_name: (wo.boats as any)?.name || "Unknown",
          provider_name: wo.provider_id ? providerMap.get(wo.provider_id) : undefined,
          status: wo.status,
          created_at: wo.created_at,
          last_updated: wo.updated_at,
          days_stale: differenceInDays(new Date(), new Date(wo.updated_at)),
        }));

        setStaleOrders(stale);
      } catch (error) {
        console.error("Error fetching stale orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaleOrders();
  }, []);

  if (loading) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (staleOrders.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5" />
          Stale Work Orders
          <Badge variant="destructive" className="ml-auto">
            {staleOrders.length} alerts
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          In progress for 7+ days without QC request
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {staleOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{order.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Ship className="w-3 h-3" />
                        {order.boat_name}
                      </div>
                      {order.provider_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.provider_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {order.days_stale} days
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
