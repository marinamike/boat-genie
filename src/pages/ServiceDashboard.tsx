import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Wrench, Calendar, ClipboardCheck, Anchor, Briefcase, DollarSign } from "lucide-react";
import { useServiceManagement } from "@/hooks/useServiceManagement";
import { useJobBoard } from "@/hooks/useJobBoard";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ServiceWorkOrders } from "@/components/service/ServiceWorkOrders";
import { YardCalendar } from "@/components/service/YardCalendar";
import { ServiceQCQueue } from "@/components/service/ServiceQCQueue";
import { BoatsOnBlocksList } from "@/components/service/BoatsOnBlocksList";
import { LeadStream } from "@/components/provider/LeadStream";
import { ProviderMetricsHeader } from "@/components/provider/ProviderMetricsHeader";
import { EarningsTab } from "@/components/provider/EarningsTab";
import type { CompletedJob } from "@/hooks/useProviderMetrics";

export default function ServiceDashboard() {
  const [activeTab, setActiveTab] = useState("workorders");
  const serviceManagement = useServiceManagement();
  const { availableWishes, pendingQuotedWishes, submitQuote, submittingQuote } = useJobBoard();
  const { business, refreshBusiness } = useBusiness();
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const isAvailable = business?.accepting_jobs ?? true;

  const handleToggleAvailability = async (checked: boolean) => {
    if (!business?.id) return;
    setTogglingAvailability(true);
    const { error } = await supabase
      .from("businesses")
      .update({ accepting_jobs: checked } as any)
      .eq("id", business.id);
    if (error) {
      toast.error("Failed to update availability");
    } else {
      toast.success(checked ? "Now accepting jobs" : "Marked as unavailable");
      await refreshBusiness();
    }
    setTogglingAvailability(false);
  };

  // Map completed work orders to CompletedJob shape for EarningsTab
  const completedJobs: CompletedJob[] = serviceManagement.completedWorkOrders
    .filter(wo => wo.status === "paid")
    .map(wo => ({
      id: wo.id,
      title: wo.title,
      completed_at: wo.completed_at,
      wholesale_price: wo.wholesale_price,
      lead_fee: wo.lead_fee,
      funds_released_at: wo.funds_released_at,
      boat_name: wo.boat_name,
    }));

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service & Refit</h1>
          <p className="text-muted-foreground">
            Work orders, yard scheduling, and quality control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${isAvailable ? "text-green-600" : "text-muted-foreground"}`}>
            {isAvailable ? "Available" : "Unavailable"}
          </span>
          <Switch
            checked={isAvailable}
            onCheckedChange={handleToggleAvailability}
            disabled={togglingAvailability}
          />
        </div>
      </div>

      <ProviderMetricsHeader
        activeJobs={serviceManagement.activeJobsCount}
        pendingQuotes={serviceManagement.pendingQuotesCount}
        totalEarnings={serviceManagement.totalEarnings}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="workorders" className="flex items-center gap-1">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Leads</span>
            {availableWishes.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {availableWishes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Yard</span>
          </TabsTrigger>
          <TabsTrigger value="qc" className="flex items-center gap-1">
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">QC</span>
          </TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center gap-1">
            <Anchor className="w-4 h-4" />
            <span className="hidden sm:inline">On Blocks</span>
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Earnings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workorders" className="mt-4">
          <ServiceWorkOrders {...serviceManagement} />
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <LeadStream
            wishes={availableWishes}
            pendingWishes={pendingQuotedWishes}
            businessId={business?.id || ""}
            onSubmitQuote={submitQuote}
            submitting={submittingQuote}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <YardCalendar {...serviceManagement} />
        </TabsContent>

        <TabsContent value="qc" className="mt-4">
          <ServiceQCQueue {...serviceManagement} />
        </TabsContent>

        <TabsContent value="blocks" className="mt-4">
          <BoatsOnBlocksList {...serviceManagement} />
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <EarningsTab
            completedJobs={completedJobs}
            totalEarnings={serviceManagement.totalEarnings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
