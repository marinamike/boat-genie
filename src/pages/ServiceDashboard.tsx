import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar, ClipboardCheck, Anchor, Users, FileText, Briefcase } from "lucide-react";
import { useServiceManagement } from "@/hooks/useServiceManagement";
import { useJobBoard } from "@/hooks/useJobBoard";
import { useServiceMenu } from "@/hooks/useServiceMenu";
import { ServiceWorkOrders } from "@/components/service/ServiceWorkOrders";
import { YardCalendar } from "@/components/service/YardCalendar";
import { ServiceQCQueue } from "@/components/service/ServiceQCQueue";
import { BoatsOnBlocksList } from "@/components/service/BoatsOnBlocksList";
import { ServiceStaffManager } from "@/components/service/ServiceStaffManager";
import { YardEquipmentSettings } from "@/components/service/YardEquipmentSettings";
import { LeadStream } from "@/components/provider/LeadStream";
import type { ProviderService } from "@/hooks/useProviderMetrics";

export default function ServiceDashboard() {
  const [activeTab, setActiveTab] = useState("workorders");
  const serviceManagement = useServiceManagement();
  const { availableWishes, pendingQuotedWishes, submitQuote, submittingQuote } = useJobBoard();
  const { activeMenuItems } = useServiceMenu();

  // Map business_service_menu items to ProviderService shape for LeadStream
  const providerServices: ProviderService[] = activeMenuItems.map(item => ({
    id: item.id,
    service_name: item.name,
    price: item.default_price,
    pricing_model: item.pricing_model,
    is_locked: true,
    category: item.category,
  }));

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service & Refit</h1>
        <p className="text-muted-foreground">
          Work orders, yard scheduling, and quality control
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
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
          <TabsTrigger value="staff" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Setup</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workorders" className="mt-4">
          <ServiceWorkOrders {...serviceManagement} />
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <LeadStream
            wishes={availableWishes}
            providerServices={providerServices}
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

        <TabsContent value="staff" className="mt-4">
          <ServiceStaffManager {...serviceManagement} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <YardEquipmentSettings {...serviceManagement} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
