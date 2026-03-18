import { ServiceMenuManager } from "@/components/business/ServiceMenuManager";
import { ServiceStaffTab } from "@/components/business/ServiceStaffTab";
import { YardEquipmentSettings } from "@/components/service/YardEquipmentSettings";
import { useServiceManagement } from "@/hooks/useServiceManagement";
import { Separator } from "@/components/ui/separator";

export function ServiceSetupTab() {
  const serviceManagement = useServiceManagement();

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-4">Service Menu</h3>
        <ServiceMenuManager />
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-semibold mb-4">Service Staff & Specialties</h3>
        <ServiceStaffTab />
      </section>

      <Separator />

      <section>
        <YardEquipmentSettings {...serviceManagement} />
      </section>
    </div>
  );
}
