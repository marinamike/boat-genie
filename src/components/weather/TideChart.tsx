import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { TideData, TidePoint } from "@/hooks/useMarineWeather";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface TideChartProps {
  data: TideData | null;
  loading?: boolean;
  className?: string;
}

export function TideChart({ data, loading, className }: TideChartProps) {
  // Generate SVG path for tide curve
  const tidePath = useMemo(() => {
    if (!data?.tidePoints || data.tidePoints.length < 2) return "";

    const points = data.tidePoints;
    const now = new Date();
    
    // Chart dimensions
    const width = 300;
    const height = 80;
    const padding = 10;
    
    // Time range (in hours)
    const startTime = new Date(points[0].time).getTime();
    const endTime = new Date(points[points.length - 1].time).getTime();
    const timeRange = endTime - startTime;
    
    // Height range
    const minHeight = Math.min(...points.map(p => p.height));
    const maxHeight = Math.max(...points.map(p => p.height));
    const heightRange = maxHeight - minHeight || 1;
    
    // Scale functions
    const scaleX = (time: Date) => 
      padding + ((time.getTime() - startTime) / timeRange) * (width - 2 * padding);
    const scaleY = (h: number) => 
      height - padding - ((h - minHeight) / heightRange) * (height - 2 * padding);
    
    // Generate smooth curve using cubic bezier
    let path = `M ${scaleX(new Date(points[0].time))} ${scaleY(points[0].height)}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const x0 = scaleX(new Date(points[i].time));
      const y0 = scaleY(points[i].height);
      const x1 = scaleX(new Date(points[i + 1].time));
      const y1 = scaleY(points[i + 1].height);
      
      const cpx = (x0 + x1) / 2;
      path += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }
    
    // Current time marker position
    const nowX = scaleX(now);
    const nowY = scaleY(data.currentHeight);
    
    return { path, nowX, nowY, width, height };
  }, [data]);

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const formatTideTime = (point: TidePoint | null) => {
    if (!point) return "--:--";
    return format(parseISO(point.time), "h:mm a");
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Waves className="w-4 h-4 text-primary" />
            Tides
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {data.currentHeight.toFixed(1)} ft
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tide Curve Visualization */}
        {tidePath && typeof tidePath === 'object' && (
          <div className="relative bg-muted/30 rounded-lg p-2">
            <svg 
              viewBox={`0 0 ${tidePath.width} ${tidePath.height}`}
              className="w-full h-20"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Water fill below curve */}
              <defs>
                <linearGradient id="tideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              {/* Tide curve */}
              <path
                d={tidePath.path}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Current position marker */}
              <circle
                cx={tidePath.nowX}
                cy={tidePath.nowY}
                r="5"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth="2"
              />
              
              {/* "Now" label */}
              <text
                x={tidePath.nowX}
                y={tidePath.nowY - 10}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground"
              >
                Now
              </text>
            </svg>
          </div>
        )}

        {/* Next High/Low */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High Tide</p>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-sm">
                  {formatTideTime(data.nextHigh)}
                </span>
                {data.nextHigh && (
                  <span className="text-xs text-muted-foreground">
                    {data.nextHigh.height.toFixed(1)}ft
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Tide</p>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-sm">
                  {formatTideTime(data.nextLow)}
                </span>
                {data.nextLow && (
                  <span className="text-xs text-muted-foreground">
                    {data.nextLow.height.toFixed(1)}ft
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
