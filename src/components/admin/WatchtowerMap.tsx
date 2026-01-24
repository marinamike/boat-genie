import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Building2, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MapSkeleton } from "@/components/ui/marine-loading";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MarinaPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isSubscriber: boolean;
  leadCount?: number;
}

interface JobCluster {
  lat: number;
  lng: number;
  count: number;
}

export function WatchtowerMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [marinas, setMarinas] = useState<MarinaPin[]>([]);
  const [jobs, setJobs] = useState<JobCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch marinas with coordinates
        const { data: marinasData } = await supabase
          .from("marinas")
          .select("id, marina_name, latitude, longitude, is_claimed");

        // Fetch lead counts per marina
        const { data: leadsData } = await supabase
          .from("marina_leads")
          .select("marina_name");

        const leadCounts: Record<string, number> = {};
        (leadsData || []).forEach(l => {
          leadCounts[l.marina_name] = (leadCounts[l.marina_name] || 0) + 1;
        });

        const marinaPins: MarinaPin[] = (marinasData || [])
          .filter(m => m.latitude && m.longitude)
          .map(m => ({
            id: m.id,
            name: m.marina_name,
            lat: Number(m.latitude),
            lng: Number(m.longitude),
            isSubscriber: m.is_claimed || false,
            leadCount: leadCounts[m.marina_name] || 0,
          }));

        setMarinas(marinaPins);

        // Fetch active work orders with boat locations (using marina locations as proxy)
        const { data: workOrdersData } = await supabase
          .from("work_orders")
          .select(`
            id,
            boats:boat_id (
              boat_profiles (marina_name)
            )
          `)
          .in("status", ["pending", "assigned", "in_progress"]);

        // Group jobs by approximate location
        const jobLocations: JobCluster[] = [];
        // For now, use marina locations as job clusters
        marinaPins.forEach(marina => {
          const jobCount = (workOrdersData || []).filter((wo: any) => 
            wo.boats?.boat_profiles?.[0]?.marina_name === marina.name
          ).length;
          
          if (jobCount > 0) {
            jobLocations.push({
              lat: marina.lat,
              lng: marina.lng,
              count: jobCount,
            });
          }
        });

        setJobs(jobLocations);
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || loading) return;

    // Initialize map with default center (Fort Lauderdale area)
    mapboxgl.accessToken = "pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbTlyZnM4cjEwY2V0MmxxM2R4ZHRocndzIn0.GkpD6N9D_sIxwC2JeqgJMQ";
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-80.1373, 26.1224], // Fort Lauderdale
      zoom: 10,
    });

    map.current.on("load", () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [loading]);

  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll(".mapboxgl-marker");
    existingMarkers.forEach(m => m.remove());

    // Add marina pins
    marinas.forEach(marina => {
      const el = document.createElement("div");
      el.className = "marina-marker";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.cursor = "pointer";
      el.style.backgroundColor = marina.isSubscriber ? "#22c55e" : "#9ca3af";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 150px;">
          <p style="font-weight: 600; margin: 0 0 4px 0;">${marina.name}</p>
          <p style="font-size: 12px; color: #666; margin: 0;">
            ${marina.isSubscriber ? "✅ Subscriber" : "📧 Lead Target"}
          </p>
          ${marina.leadCount ? `<p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">${marina.leadCount} leads received</p>` : ""}
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([marina.lng, marina.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add job clusters
    jobs.forEach(job => {
      if (job.count === 0) return;

      const el = document.createElement("div");
      el.className = "job-cluster";
      el.style.width = `${Math.min(20 + job.count * 8, 50)}px`;
      el.style.height = `${Math.min(20 + job.count * 8, 50)}px`;
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "rgba(249, 115, 22, 0.8)";
      el.style.border = "2px solid white";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "white";
      el.style.fontWeight = "bold";
      el.style.fontSize = "12px";
      el.textContent = String(job.count);

      new mapboxgl.Marker(el)
        .setLngLat([job.lng, job.lat])
        .addTo(map.current!);
    });

    // Fit bounds if we have marinas
    if (marinas.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      marinas.forEach(m => bounds.extend([m.lng, m.lat]));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [marinas, jobs, mapReady]);

  const subscriberCount = marinas.filter(m => m.isSubscriber).length;
  const leadCount = marinas.filter(m => !m.isSubscriber).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Watchtower Map
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600 gap-1">
              <Building2 className="w-3 h-3" />
              {subscriberCount} Subscribers
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Building2 className="w-3 h-3" />
              {leadCount} Leads
            </Badge>
            {jobs.reduce((sum, j) => sum + j.count, 0) > 0 && (
              <Badge variant="outline" className="text-orange-600 border-orange-500 gap-1">
                <Briefcase className="w-3 h-3" />
                {jobs.reduce((sum, j) => sum + j.count, 0)} Active Jobs
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <MapSkeleton className="h-[400px]" />
        ) : (
          <div className="relative">
            <div 
              ref={mapContainer} 
              className="w-full h-[400px] rounded-lg overflow-hidden"
            />
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-white" />
                <span>Subscriber Marina</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400 border border-white" />
                <span>Lead Target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 border border-white flex items-center justify-center text-white text-[8px] font-bold">
                  3
                </div>
                <span>Active Jobs</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
