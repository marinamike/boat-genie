import { Badge } from "@/components/ui/badge";
import type { LaunchStatus } from "@/hooks/useLaunchQueue";
import { 
  Clock, 
  ArrowUp, 
  Waves, 
  Anchor, 
  Ship,
  RotateCcw,
  XCircle
} from "lucide-react";

interface LaunchStatusBadgeProps {
  status: LaunchStatus;
  className?: string;
}

const statusConfig: Record<LaunchStatus, {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  queued: {
    label: "In Queue",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
  },
  on_deck: {
    label: "On Deck",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: ArrowUp,
  },
  splashing: {
    label: "Splashing",
    className: "bg-cyan-100 text-cyan-800 border-cyan-200",
    icon: Waves,
  },
  splashed: {
    label: "Splashed",
    className: "bg-teal-100 text-teal-800 border-teal-200",
    icon: Anchor,
  },
  in_water: {
    label: "In Water",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: Ship,
  },
  hauling: {
    label: "Hauling",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    icon: ArrowUp,
  },
  re_racked: {
    label: "Re-Racked",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    icon: RotateCcw,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: XCircle,
  },
};

export function LaunchStatusBadge({ status, className }: LaunchStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.queued;
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

export default LaunchStatusBadge;
