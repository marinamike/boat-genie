import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDownToLine, ArrowUpFromLine, Ship, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface ArrivalDeparture {
  id: string;
  type: "arrival" | "departure";
  boat_name: string;
  boat_make?: string;
  boat_model?: string;
  boat_length_ft?: number;
  owner_name?: string;
  slip_number?: string;
  scheduled_date: string;
  stay_type: string;
}

export function ArrivalsDepaturesCard() {
  const [data, setData] = useState<ArrivalDeparture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // Fetch arrivals (approved reservations arriving today/tomorrow)
      const { data: arrivals } = await supabase
        .from("marina_reservations")
        .select(`
          id,
          requested_arrival,
          assigned_slip,
          stay_type,
          boats:boat_id (name, make, model, length_ft),
          profiles:owner_id (full_name)
        `)
        .in("status", ["approved"])
        .gte("requested_arrival", today)
        .lte("requested_arrival", tomorrow);

      // Fetch departures (checked-in reservations departing today/tomorrow)
      const { data: departures } = await supabase
        .from("marina_reservations")
        .select(`
          id,
          requested_departure,
          assigned_slip,
          stay_type,
          boats:boat_id (name, make, model, length_ft),
          profiles:owner_id (full_name)
        `)
        .in("status", ["checked_in"])
        .gte("requested_departure", today)
        .lte("requested_departure", tomorrow);

      const combined: ArrivalDeparture[] = [];

      arrivals?.forEach((a: any) => {
        combined.push({
          id: a.id,
          type: "arrival",
          boat_name: a.boats?.name || "Unknown",
          boat_make: a.boats?.make,
          boat_model: a.boats?.model,
          boat_length_ft: a.boats?.length_ft,
          owner_name: a.profiles?.full_name,
          slip_number: a.assigned_slip,
          scheduled_date: a.requested_arrival,
          stay_type: a.stay_type,
        });
      });

      departures?.forEach((d: any) => {
        combined.push({
          id: d.id,
          type: "departure",
          boat_name: d.boats?.name || "Unknown",
          boat_make: d.boats?.make,
          boat_model: d.boats?.model,
          boat_length_ft: d.boats?.length_ft,
          owner_name: d.profiles?.full_name,
          slip_number: d.assigned_slip,
          scheduled_date: d.requested_departure,
          stay_type: d.stay_type,
        });
      });

      // Sort by date
      combined.sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      );

      setData(combined);
      setLoading(false);
    };

    fetchData();
  }, []);

  const todayItems = data.filter(d => isToday(parseISO(d.scheduled_date)));
  const tomorrowItems = data.filter(d => isTomorrow(parseISO(d.scheduled_date)));

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Ship className="w-4 h-4" />
            Arrivals & Departures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderItem = (item: ArrivalDeparture) => (
    <div
      key={item.id}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div className={`p-1.5 rounded-full ${
        item.type === "arrival" 
          ? "bg-green-500/10 text-green-600" 
          : "bg-orange-500/10 text-orange-600"
      }`}>
        {item.type === "arrival" 
          ? <ArrowDownToLine className="w-4 h-4" /> 
          : <ArrowUpFromLine className="w-4 h-4" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{item.boat_name}</span>
          {item.boat_length_ft && (
            <span className="text-xs text-muted-foreground">{item.boat_length_ft}ft</span>
          )}
        </div>
        {item.slip_number && (
          <span className="text-xs text-muted-foreground">Slip {item.slip_number}</span>
        )}
      </div>
      <Badge variant={item.type === "arrival" ? "default" : "secondary"} className="text-xs capitalize">
        {item.stay_type}
      </Badge>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Ship className="w-4 h-4" />
          Arrivals & Departures
          {data.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {data.length} scheduled
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No arrivals or departures scheduled
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {todayItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Today</p>
                  <div className="space-y-1">
                    {todayItems.map(renderItem)}
                  </div>
                </div>
              )}
              {tomorrowItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tomorrow</p>
                  <div className="space-y-1">
                    {tomorrowItems.map(renderItem)}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
