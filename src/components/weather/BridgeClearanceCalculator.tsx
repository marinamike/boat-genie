import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ArrowUpDown } from "lucide-react";
import { calculateBridgeClearance } from "@/hooks/useMarineWeather";
import { cn } from "@/lib/utils";

interface BridgeClearanceCalculatorProps {
  boatBridgeClearance: number | null; // Boat's air draft in feet
  currentTideHeight: number;
  bridgeName?: string;
  bridgeHeight?: number; // Default to common FTL bridge height
  className?: string;
}

// Common Fort Lauderdale fixed bridges
const COMMON_BRIDGES = [
  { name: "17th Street Causeway", height: 55 },
  { name: "SE 3rd Avenue Bridge", height: 21 },
  { name: "Andrews Avenue Bridge", height: 21 },
  { name: "Sunrise Boulevard", height: 25 },
];

export function BridgeClearanceCalculator({
  boatBridgeClearance,
  currentTideHeight,
  bridgeName,
  bridgeHeight = 21, // Default to lower fixed bridge height
  className,
}: BridgeClearanceCalculatorProps) {
  const clearanceInfo = useMemo(() => {
    if (!boatBridgeClearance) return null;
    
    return calculateBridgeClearance(
      bridgeHeight,
      boatBridgeClearance,
      currentTideHeight
    );
  }, [boatBridgeClearance, bridgeHeight, currentTideHeight]);

  if (!boatBridgeClearance) {
    return null;
  }

  if (!clearanceInfo) {
    return null;
  }

  const { currentClearance, clearanceAtHighTide, isSafe, warning } = clearanceInfo;

  return (
    <Card className={cn(
      "overflow-hidden",
      !isSafe && "border-destructive/50",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-primary" />
            Bridge Clearance
          </CardTitle>
          {isSafe ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Safe
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Caution
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Visual clearance indicator */}
        <div className="relative bg-muted/30 rounded-lg p-4">
          <div className="flex items-end justify-center gap-4 h-24">
            {/* Bridge */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-3 bg-muted-foreground/30 rounded-t" />
              <div className="w-20 h-1 bg-muted-foreground/50" />
              <p className="text-xs text-muted-foreground mt-1">
                {bridgeName || "Fixed Bridge"}
              </p>
              <p className="text-xs font-medium">{bridgeHeight}ft</p>
            </div>
            
            {/* Clearance indicator */}
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-1 rounded-full transition-all",
                  isSafe ? "bg-green-500" : "bg-destructive"
                )}
                style={{ height: `${Math.max(8, Math.min(60, currentClearance * 8))}px` }}
              />
              <p className={cn(
                "text-lg font-bold mt-1",
                isSafe ? "text-green-600" : "text-destructive"
              )}>
                {currentClearance}ft
              </p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            
            {/* Boat */}
            <div className="flex flex-col items-center">
              <svg 
                className="w-12 h-8 text-primary" 
                viewBox="0 0 48 32" 
                fill="currentColor"
              >
                <path d="M4 24 L24 28 L44 24 L40 20 L8 20 Z" />
                <rect x="20" y="8" width="8" height="12" />
              </svg>
              <p className="text-xs text-muted-foreground mt-1">Your Boat</p>
              <p className="text-xs font-medium">{boatBridgeClearance}ft height</p>
            </div>
          </div>
        </div>

        {/* High tide clearance */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">At High Tide</p>
            <p className="text-xs text-muted-foreground">Estimated clearance</p>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-lg font-bold",
              clearanceAtHighTide > 2 ? "text-green-600" : 
              clearanceAtHighTide > 0 ? "text-yellow-600" : "text-destructive"
            )}>
              {clearanceAtHighTide}ft
            </p>
            {warning && (
              <p className="text-xs text-destructive">{warning}</p>
            )}
          </div>
        </div>

        {/* Common bridges reference */}
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Common Fixed Bridges:</p>
          <div className="grid grid-cols-2 gap-1">
            {COMMON_BRIDGES.slice(0, 4).map(bridge => (
              <div key={bridge.name} className="flex justify-between">
                <span className="truncate">{bridge.name}</span>
                <span className="font-medium ml-1">{bridge.height}ft</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
