import { Cloud, Sun, Wind, Droplets, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarineWeatherData } from "@/hooks/useMarineWeather";

interface MarineWeatherWidgetProps {
  data: MarineWeatherData | null;
  loading?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
  className?: string;
}

export function MarineWeatherWidget({
  data,
  loading,
  onRefresh,
  compact = false,
  className,
}: MarineWeatherWidgetProps) {
  if (loading) {
    return (
      <div className={cn(
        "bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4",
        "animate-pulse",
        className
      )}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { conditions, warnings, location } = data;
  const hasWarnings = warnings.length > 0;

  // Get weather icon based on conditions
  const getWeatherIcon = () => {
    const sky = conditions.skyCondition.toLowerCase();
    if (sky.includes("clear") || sky.includes("sunny")) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    }
    return <Cloud className="w-8 h-8 text-muted-foreground" />;
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg",
        className
      )}>
        {getWeatherIcon()}
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold">{conditions.temperature}°F</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wind className="w-4 h-4" />
            <span>{conditions.windSpeed}kts {conditions.windDirection}</span>
          </div>
          {hasWarnings && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Advisory
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl",
      hasWarnings 
        ? "bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20" 
        : "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/10",
      className
    )}>
      {/* Warning Banner */}
      {hasWarnings && (
        <div className="bg-destructive/90 text-destructive-foreground px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold text-sm">{warnings[0].message}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {getWeatherIcon()}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{conditions.temperature}°</span>
                <span className="text-lg text-muted-foreground">F</span>
              </div>
              <p className="text-sm text-muted-foreground">{conditions.skyCondition}</p>
            </div>
          </div>
          
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Wind & Conditions */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{conditions.windSpeed} kts</p>
              <p className="text-xs text-muted-foreground">{conditions.windDirection}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{conditions.humidity}%</p>
              <p className="text-xs text-muted-foreground">Humidity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <svg 
              className="w-5 h-5 text-primary" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <div>
              <p className="text-sm font-medium">{conditions.visibility} mi</p>
              <p className="text-xs text-muted-foreground">Visibility</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            📍 {location.name}
          </p>
        </div>
      </div>
    </div>
  );
}
