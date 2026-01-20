import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  Wrench, 
  Camera, 
  DollarSign, 
  AlertTriangle 
} from "lucide-react";

type EscrowStatus = Database["public"]["Enums"]["escrow_status"];

interface EscrowStatusBadgeProps {
  status: EscrowStatus;
  className?: string;
}

const statusConfig: Record<EscrowStatus, {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  none: {
    label: "No Escrow",
    className: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  pending_quote: {
    label: "Awaiting Quote",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  quoted: {
    label: "Quote Received",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FileText,
  },
  approved: {
    label: "Quote Approved",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  work_started: {
    label: "Work In Progress",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Wrench,
  },
  pending_photos: {
    label: "Awaiting Photos",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Camera,
  },
  pending_release: {
    label: "Pending Release",
    className: "bg-cyan-100 text-cyan-800 border-cyan-200",
    icon: DollarSign,
  },
  released: {
    label: "Funds Released",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: DollarSign,
  },
  disputed: {
    label: "Disputed",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
  },
};

export function EscrowStatusBadge({ status, className }: EscrowStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.none;
  const IconComponent = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} font-medium ${className || ""}`}
    >
      <IconComponent className="w-3 h-3 mr-1.5" />
      {config.label}
    </Badge>
  );
}

export default EscrowStatusBadge;
