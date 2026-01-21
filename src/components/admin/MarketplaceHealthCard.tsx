import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ClipboardList, Briefcase, DollarSign } from "lucide-react";
import type { MarketplaceHealth } from "@/hooks/useAdminDashboard";

interface MarketplaceHealthCardProps {
  health: MarketplaceHealth;
}

export function MarketplaceHealthCard({ health }: MarketplaceHealthCardProps) {
  const stats = [
    {
      label: "Total Wishes",
      value: health.totalWishes,
      icon: ClipboardList,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Active Work Orders",
      value: health.activeWorkOrders,
      icon: Briefcase,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Completed Jobs",
      value: health.completedWorkOrders,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Platform Revenue",
      value: `$${health.totalPlatformRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      isHighlight: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Marketplace Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`p-4 rounded-xl ${stat.bgColor} ${stat.isHighlight ? "col-span-2 sm:col-span-1" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
