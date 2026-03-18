import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ServiceMenuManager } from "@/components/business/ServiceMenuManager";
import { ServiceStaffTab } from "@/components/business/ServiceStaffTab";
import { YardEquipmentSettings } from "@/components/service/YardEquipmentSettings";
import { useServiceManagement } from "@/hooks/useServiceManagement";

export function ServiceSetupTab() {
  const serviceManagement = useServiceManagement();

  return (
    <Tabs defaultValue="menu" className="w-full">
      <ScrollArea className="w-full">
        <TabsList className="inline-flex w-max">
          <TabsTrigger value="menu">Service Menu</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="qc">QC Templates</TabsTrigger>
          <TabsTrigger value="bays">Haul-Out Bays</TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <TabsContent value="menu" className="mt-4">
        <ServiceMenuManager />
      </TabsContent>

      <TabsContent value="staff" className="mt-4">
        <ServiceStaffTab />
      </TabsContent>

      <TabsContent value="equipment" className="mt-4">
        <YardEquipmentSettings {...serviceManagement} activeSubTab="equipment" />
      </TabsContent>

      <TabsContent value="qc" className="mt-4">
        <YardEquipmentSettings {...serviceManagement} activeSubTab="templates" />
      </TabsContent>

      <TabsContent value="bays" className="mt-4">
        <YardEquipmentSettings {...serviceManagement} activeSubTab="bays" />
      </TabsContent>
    </Tabs>
  );
}
