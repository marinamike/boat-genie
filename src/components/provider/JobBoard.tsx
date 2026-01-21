import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, 
  Clock, 
  Ship, 
  AlertTriangle, 
  Calendar,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Play,
  Pause
} from "lucide-react";
import { useJobBoard, WishFormItem, WorkOrderItem } from "@/hooks/useJobBoard";
import { formatDistanceToNow, format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const urgencyColors: Record<string, string> = {
  urgent: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  normal: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-muted text-muted-foreground",
};

export function JobBoard() {
  const { availableWishes, activeWorkOrders, loading, claimWish, updateWorkOrderStatus } = useJobBoard();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (wishId: string) => {
    setClaimingId(wishId);
    await claimWish(wishId);
    setClaimingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="available" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="available" className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Available ({availableWishes.length})
        </TabsTrigger>
        <TabsTrigger value="active" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Active ({activeWorkOrders.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="available" className="space-y-4">
        {availableWishes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No Available Jobs</h3>
              <p className="text-muted-foreground text-center">
                Check back later for new service requests
              </p>
            </CardContent>
          </Card>
        ) : (
          availableWishes.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              onClaim={() => handleClaim(wish.id)}
              claiming={claimingId === wish.id}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="active" className="space-y-4">
        {activeWorkOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No Active Jobs</h3>
              <p className="text-muted-foreground text-center">
                Claim a job from the available tab to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          activeWorkOrders.map((wo) => (
            <WorkOrderCard
              key={wo.id}
              workOrder={wo}
              onUpdateStatus={updateWorkOrderStatus}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function WishCard({ 
  wish, 
  onClaim, 
  claiming 
}: { 
  wish: WishFormItem; 
  onClaim: () => void; 
  claiming: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{wish.service_type}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Ship className="w-4 h-4" />
              {wish.boat?.name || "Unknown Boat"}
              {wish.boat?.length_ft && ` • ${wish.boat.length_ft}ft`}
            </CardDescription>
          </div>
          {wish.urgency && (
            <Badge className={urgencyColors[wish.urgency] || urgencyColors.normal}>
              {wish.urgency === "urgent" && <AlertTriangle className="w-3 h-3 mr-1" />}
              {wish.urgency}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {wish.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(new Date(wish.created_at), { addSuffix: true })}
            </span>
            {wish.preferred_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(wish.preferred_date), "MMM d")}
              </span>
            )}
          </div>
        </div>

        <Button 
          onClick={onClaim} 
          disabled={claiming}
          className="w-full"
        >
          {claiming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              Claim This Job
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function WorkOrderCard({ 
  workOrder, 
  onUpdateStatus 
}: { 
  workOrder: WorkOrderItem;
  onUpdateStatus: (id: string, status: string) => Promise<boolean>;
}) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    await onUpdateStatus(workOrder.id, status);
    setUpdating(false);
  };

  const nextActions = getNextActions(workOrder.status);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {workOrder.title}
              {workOrder.is_emergency && (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Ship className="w-4 h-4" />
              {workOrder.boat?.name || "Unknown Boat"}
              {workOrder.boat?.length_ft && ` • ${workOrder.boat.length_ft}ft`}
            </CardDescription>
          </div>
          <Badge variant="outline" className={statusColors[workOrder.status]}>
            {workOrder.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {workOrder.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workOrder.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {workOrder.scheduled_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(workOrder.scheduled_date), "MMM d, yyyy")}
            </span>
          )}
          {workOrder.retail_price && (
            <span className="font-medium text-foreground">
              ${workOrder.retail_price.toFixed(2)}
            </span>
          )}
        </div>

        {nextActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full" disabled={updating}>
                {updating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Update Status
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {nextActions.map((action) => (
                <DropdownMenuItem
                  key={action.status}
                  onClick={() => handleStatusChange(action.status)}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
}

function getNextActions(status: string) {
  const actions: { label: string; status: string; icon: React.ElementType }[] = [];
  
  switch (status) {
    case "pending":
      actions.push({ label: "Start Work", status: "in_progress", icon: Play });
      break;
    case "in_progress":
      actions.push({ label: "Pause Work", status: "pending", icon: Pause });
      actions.push({ label: "Mark Complete", status: "completed", icon: CheckCircle2 });
      break;
  }
  
  return actions;
}
