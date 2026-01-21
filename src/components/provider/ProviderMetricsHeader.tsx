import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Clock, DollarSign } from "lucide-react";

interface ProviderMetricsHeaderProps {
  activeJobs: number;
  pendingQuotes: number;
  totalEarnings: number;
}

export function ProviderMetricsHeader({ 
  activeJobs, 
  pendingQuotes, 
  totalEarnings 
}: ProviderMetricsHeaderProps) {
  const metrics = [
    {
      label: "Active Jobs",
      value: activeJobs,
      icon: Briefcase,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Pending Quotes",
      value: pendingQuotes,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Total Earnings",
      value: `$${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
