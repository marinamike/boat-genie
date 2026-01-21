import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HardHat, 
  Ship, 
  Anchor, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Clock,
  MapPin,
  Wifi,
  Info
} from "lucide-react";
import { useLaunchQueue } from "@/hooks/useLaunchQueue";
import { LaunchStatusBadge } from "@/components/launch/LaunchStatusBadge";
import BottomNav from "@/components/BottomNav";
import { formatDistanceToNow } from "date-fns";

interface DockTask {
  id: string;
  type: "line_help" | "pumpout" | "launch" | "haul";
  boat_name: string;
  slip_number?: string;
  status: "pending" | "in_progress" | "completed";
  requested_at: string;
  notes?: string;
}

const DockView = () => {
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [marinaInfo, setMarinaInfo] = useState<{
    name: string;
    rules?: string;
    wifi_password?: string;
  } | null>(null);
  const navigate = useNavigate();
  
  const { queue, publicQueue, settings } = useLaunchQueue();

  // Mock dock tasks - in production these would come from a tasks table
  const [dockTasks] = useState<DockTask[]>([
    {
      id: "1",
      type: "line_help",
      boat_name: "Sea Breeze",
      slip_number: "A-12",
      status: "pending",
      requested_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      notes: "Arriving from fuel dock",
    },
    {
      id: "2",
      type: "pumpout",
      boat_name: "Lucky Lady",
      slip_number: "B-05",
      status: "pending",
      requested_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Check if marina staff
      const { data: staffData } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "marina_staff",
      });

      if (!staffData) {
        navigate("/dashboard");
        return;
      }

      setIsStaff(true);

      // Fetch marina info from settings
      const { data: settingsData } = await supabase
        .from("marina_settings")
        .select("marina_name")
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        setMarinaInfo({
          name: settingsData.marina_name,
          rules: "No wake zone within 100ft of docks. Quiet hours 10PM-7AM.",
          wifi_password: "marina2024",
        });
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const pendingTasks = dockTasks.filter(t => t.status === "pending");
  const launchQueueItems = queue.filter(q => 
    ["queued", "on_deck", "spling", "splashed"].includes(q.status)
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Dock View</h1>
              <p className="text-sm text-primary-foreground/80">
                {marinaInfo?.name || "Marina Staff"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              Tasks ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-1 text-xs">
              <Anchor className="w-4 h-4" />
              Queue ({launchQueueItems.length})
            </TabsTrigger>
            <TabsTrigger value="marina" className="flex items-center gap-1 text-xs">
              <Info className="w-4 h-4" />
              My Marina
            </TabsTrigger>
          </TabsList>

          {/* Dock Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            {pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="font-semibold text-lg">All Clear!</h3>
                  <p className="text-muted-foreground text-center">
                    No pending dock tasks at the moment
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingTasks.map((task) => (
                <DockTaskCard key={task.id} task={task} />
              ))
            )}
          </TabsContent>

          {/* Launch Queue Tab */}
          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Anchor className="w-5 h-5" />
                  Launch Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {launchQueueItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No boats in queue
                  </p>
                ) : (
                  launchQueueItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.boat?.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(item.requested_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <LaunchStatusBadge status={item.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Marina Tab */}
          <TabsContent value="marina" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Marina Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                    Marina Name
                  </h4>
                  <p className="text-lg">{marinaInfo?.name || "N/A"}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2 flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    WiFi Password
                  </h4>
                  <code className="bg-muted px-3 py-2 rounded text-lg font-mono">
                    {marinaInfo?.wifi_password || "N/A"}
                  </code>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Marina Rules
                  </h4>
                  <p className="text-muted-foreground">
                    {marinaInfo?.rules || "No rules configured"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

function DockTaskCard({ task }: { task: DockTask }) {
  const getTaskIcon = (type: DockTask["type"]) => {
    switch (type) {
      case "line_help":
        return Ship;
      case "pumpout":
        return Anchor;
      case "launch":
      case "haul":
        return Anchor;
      default:
        return CheckCircle2;
    }
  };

  const getTaskLabel = (type: DockTask["type"]) => {
    switch (type) {
      case "line_help":
        return "Line Help";
      case "pumpout":
        return "Pumpout";
      case "launch":
        return "Launch";
      case "haul":
        return "Haul Out";
      default:
        return type;
    }
  };

  const Icon = getTaskIcon(task.type);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{task.boat_name}</h3>
              <p className="text-sm text-muted-foreground">
                {task.slip_number && `Slip ${task.slip_number}`}
              </p>
            </div>
          </div>
          <Badge variant="outline">{getTaskLabel(task.type)}</Badge>
        </div>

        {task.notes && (
          <p className="text-sm text-muted-foreground mb-3 bg-muted/50 p-2 rounded">
            {task.notes}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDistanceToNow(new Date(task.requested_at), { addSuffix: true })}
          </span>
          <Button size="sm">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DockView;
