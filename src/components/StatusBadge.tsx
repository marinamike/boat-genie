import { cn } from "@/lib/utils";

type StatusType = "completed" | "in_progress" | "pending" | "emergency" | "cancelled" | "assigned";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  assigned: {
    label: "Assigned",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  emergency: {
    label: "Emergency",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-500 border-gray-300",
  },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
