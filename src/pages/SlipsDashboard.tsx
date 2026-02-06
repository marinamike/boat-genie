import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, FileText, Zap, Settings, Calendar } from "lucide-react";
import { ReservationManager } from "@/components/marina/ReservationManager";
import { DockGrid } from "@/components/slips/DockGrid";
import { LeaseManager } from "@/components/slips/LeaseManager";
import { MeterReadings } from "@/components/slips/MeterReadings";
import { SlipSettings } from "@/components/slips/SlipSettings";
import { useYardAssets } from "@/hooks/useYardAssets";

export default function SlipsDashboard() {
  const [activeTab, setActiveTab] = useState("grid");
  const yardAssets = useYardAssets();

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Slips & Storage</h1>
        <p className="text-muted-foreground">
          Manage docks, yard storage, and utility billing
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dock Grid</span>
          </TabsTrigger>
          <TabsTrigger value="leases" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Leases</span>
          </TabsTrigger>
          <TabsTrigger value="meters" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Meters</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Reservations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-4">
          <DockGrid {...yardAssets} />
        </TabsContent>

        <TabsContent value="leases" className="mt-4">
          <LeaseManager {...yardAssets} />
        </TabsContent>

        <TabsContent value="meters" className="mt-4">
          <MeterReadings {...yardAssets} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SlipSettings {...yardAssets} />
        </TabsContent>

        <TabsContent value="reservations" className="mt-4">
          <ReservationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
