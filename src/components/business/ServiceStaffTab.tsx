import { useServiceManagement } from "@/hooks/useServiceManagement";
import { ServiceStaffManager } from "@/components/service/ServiceStaffManager";

export function ServiceStaffTab() {
  const serviceManagement = useServiceManagement();

  return <ServiceStaffManager {...serviceManagement} />;
}
