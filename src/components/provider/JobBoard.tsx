import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Pause,
  MapPin,
  DollarSign,
  Image as ImageIcon
} from "lucide-react";
import { useJobBoard, WishFormItem, WorkOrderItem, QuoteFormData } from "@/hooks/useJobBoard";
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
  assigned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-muted text-muted-foreground",
};

export function JobBoard() {
  const { 
    availableWishes, 
    activeWorkOrders, 
    providerServiceNames,
    loading, 
    submittingQuote,
    submitQuote,
    updateWorkOrderStatus 
  } = useJobBoard();
  
  const [selectedWish, setSelectedWish] = useState<WishFormItem | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const handleOpenQuoteDialog = (wish: WishFormItem) => {
    setSelectedWish(wish);
    setQuoteDialogOpen(true);
  };

  const handleSubmitQuote = async (data: QuoteFormData) => {
    if (!selectedWish) return;
    const success = await submitQuote(selectedWish.id, data);
    if (success) {
      setQuoteDialogOpen(false);
      setSelectedWish(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (providerServiceNames.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">Add Services to Your Menu</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Add at least one service to your Service Menu to see matching jobs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                  No jobs match your services right now
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Your services: {providerServiceNames.join(", ")}
                </p>
              </CardContent>
            </Card>
          ) : (
            availableWishes.map((wish) => (
              <WishCard
                key={wish.id}
                wish={wish}
                onSubmitQuote={() => handleOpenQuoteDialog(wish)}
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
                  Submit a quote to get started
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

      {/* Quote Dialog */}
      <QuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        wish={selectedWish}
        onSubmit={handleSubmitQuote}
        submitting={submittingQuote}
      />
    </>
  );
}

function WishCard({ 
  wish, 
  onSubmitQuote,
}: { 
  wish: WishFormItem; 
  onSubmitQuote: () => void;
}) {
  // Extract general location (city/neighborhood) from marina name
  const getGeneralLocation = (marinaName: string | null | undefined) => {
    if (!marinaName) return "Location not specified";
    // Just show the marina name without specific slip details
    return marinaName;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{wish.service_type}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Ship className="w-4 h-4" />
              {/* Show make/model only, hide boat name */}
              {[wish.boat?.make, wish.boat?.model].filter(Boolean).join(" ") || "Boat details hidden"}
              {wish.boat?.length_ft && ` • ${wish.boat.length_ft}ft`}
            </CardDescription>
          </div>
          {wish.urgency && wish.urgency !== "normal" && (
            <Badge className={urgencyColors[wish.urgency] || urgencyColors.normal}>
              {wish.urgency === "urgent" && <AlertTriangle className="w-3 h-3 mr-1" />}
              {wish.urgency}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Service description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {wish.description}
        </p>

        {/* General location only */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{getGeneralLocation(wish.boat_profile?.marina_name)}</span>
        </div>

        {/* Photo placeholder */}
        {wish.boat?.image_url && (
          <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
            <img 
              src={wish.boat.image_url} 
              alt="Boat" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
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
          onClick={onSubmitQuote} 
          className="w-full"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Submit Quote
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function QuoteDialog({
  open,
  onOpenChange,
  wish,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wish: WishFormItem | null;
  onSubmit: (data: QuoteFormData) => void;
  submitting: boolean;
}) {
  const [laborCost, setLaborCost] = useState("");
  const [materialsCost, setMaterialsCost] = useState("");
  const [materialsDeposit, setMaterialsDeposit] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      laborCost: parseFloat(laborCost) || 0,
      materialsCost: parseFloat(materialsCost) || 0,
      materialsDeposit: parseFloat(materialsDeposit) || 0,
      estimatedCompletionDate: estimatedDate,
      notes: notes || undefined,
    });
  };

  const totalCost = (parseFloat(laborCost) || 0) + (parseFloat(materialsCost) || 0);
  const depositAmount = parseFloat(materialsDeposit) || 0;
  const serviceFee = totalCost * 0.10;
  const ownerTotal = totalCost + serviceFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Quote</DialogTitle>
          <DialogDescription>
            {wish?.service_type} Service • {wish?.boat?.make} {wish?.boat?.model}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labor">Labor Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="labor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Materials Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="materials"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={materialsCost}
                  onChange={(e) => setMaterialsCost(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Materials Deposit Field */}
          <div className="space-y-2">
            <Label htmlFor="deposit">
              Materials Deposit (optional)
              <span className="text-xs text-muted-foreground ml-1">Released immediately on approval</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="deposit"
                type="number"
                step="0.01"
                min="0"
                max={totalCost}
                placeholder="0.00"
                value={materialsDeposit}
                onChange={(e) => setMaterialsDeposit(e.target.value)}
                className="pl-8"
              />
            </div>
            {depositAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Labor balance held in escrow: ${(totalCost - depositAmount).toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Estimated Completion Date</Label>
            <Input
              id="date"
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details for the boat owner..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price breakdown */}
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Quote</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee (10%)</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Owner Pays</span>
              <span>${ownerTotal.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !laborCost || !estimatedDate}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quote"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  const pendingQuote = workOrder.quotes?.find(q => q.status === "pending");

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

        {pendingQuote && (
          <div className="bg-yellow-500/10 rounded-lg p-3 text-sm">
            <p className="text-yellow-600 font-medium">Quote pending approval</p>
            <p className="text-muted-foreground">
              Quoted: ${pendingQuote.total_owner_price.toFixed(2)}
            </p>
          </div>
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
    case "assigned":
      actions.push({ label: "Start Work", status: "in_progress", icon: Play });
      break;
    case "in_progress":
      actions.push({ label: "Pause Work", status: "pending", icon: Pause });
      actions.push({ label: "Mark Complete", status: "completed", icon: CheckCircle2 });
      break;
  }
  
  return actions;
}
