import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Sparkles,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Settings,
} from "lucide-react";
import {
  useMaintenanceRecommendations,
  MaintenanceRecommendation,
} from "@/hooks/useEquipmentSpecs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ManufacturerRecommendationsProps {
  boatId: string | null;
  onTurnIntoWish: (recommendation: MaintenanceRecommendation) => void;
}

export function ManufacturerRecommendations({
  boatId,
  onTurnIntoWish,
}: ManufacturerRecommendationsProps) {
  const { recommendations, loading, markCompleted } = useMaintenanceRecommendations(boatId);
  const [isOpen, setIsOpen] = useState(true);

  if (loading || recommendations.length === 0) {
    return null;
  }

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case "engine":
        return <Settings className="w-4 h-4" />;
      case "generator":
        return <Wrench className="w-4 h-4" />;
      case "seakeeper":
        return <Settings className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getDueStatus = (rec: MaintenanceRecommendation) => {
    if (rec.due_at_date) {
      const dueDate = new Date(rec.due_at_date);
      const now = new Date();
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        return { label: "Overdue", variant: "destructive" as const };
      } else if (daysUntil <= 30) {
        return { label: `Due in ${daysUntil} days`, variant: "outline" as const };
      }
      return null;
    }
    if (rec.due_at_hours) {
      return { label: `At ${rec.due_at_hours} hours`, variant: "secondary" as const };
    }
    return null;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Manufacturer Recommendations</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {recommendations.length} scheduled service{recommendations.length !== 1 && "s"}
                  </p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {recommendations.map((rec) => {
              const dueStatus = getDueStatus(rec);

              return (
                <div
                  key={rec.id}
                  className="flex items-start gap-3 p-3 bg-background rounded-lg border"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getEquipmentIcon(rec.equipment_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-sm leading-tight">{rec.title}</h4>
                        {rec.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {rec.description}
                          </p>
                        )}
                      </div>
                      {dueStatus && (
                        <Badge variant={dueStatus.variant} className="flex-shrink-0 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {dueStatus.label}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => onTurnIntoWish(rec)}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Turn into Wish
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => markCompleted(rec.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
