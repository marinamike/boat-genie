import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Anchor, 
  Zap, 
  Waves, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Clock,
  FileText,
  Wrench
} from "lucide-react";
import { useBoatEquipment, BoatEquipment } from "@/hooks/useBoatEquipment";
import { useMaintenanceRecommendations } from "@/hooks/useEquipmentSpecs";

interface EquipmentInventoryProps {
  boatId: string;
  onOpenWish?: (description: string) => void;
}

export function EquipmentInventory({ boatId, onOpenWish }: EquipmentInventoryProps) {
  const { equipment, loading, engines, generators, seakeepers } = useBoatEquipment(boatId);
  const { recommendations } = useMaintenanceRecommendations(boatId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Anchor className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No equipment added yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add engines, generators, and seakeepers in your boat settings
          </p>
        </CardContent>
      </Card>
    );
  }

  const getEquipmentRecommendations = (equipmentId: string) => {
    return recommendations.filter(r => r.boat_equipment_id === equipmentId);
  };

  const renderEquipmentCards = (items: BoatEquipment[], title: string, icon: React.ReactNode) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-medium">{title}</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <EquipmentDetailCard 
              key={item.id} 
              item={item}
              recommendations={getEquipmentRecommendations(item.id)}
              onOpenWish={onOpenWish}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderEquipmentCards(engines, "Engines", <Anchor className="w-4 h-4 text-primary" />)}
      {engines.length > 0 && (generators.length > 0 || seakeepers.length > 0) && <Separator />}
      {renderEquipmentCards(generators, "Generators", <Zap className="w-4 h-4 text-primary" />)}
      {generators.length > 0 && seakeepers.length > 0 && <Separator />}
      {renderEquipmentCards(seakeepers, "Seakeepers", <Waves className="w-4 h-4 text-primary" />)}
    </div>
  );
}

interface EquipmentDetailCardProps {
  item: BoatEquipment;
  recommendations: Array<{
    id: string;
    title: string;
    description: string | null;
    due_at_hours: number | null;
    due_at_date: string | null;
  }>;
  onOpenWish?: (description: string) => void;
}

function EquipmentDetailCard({ item, recommendations, onOpenWish }: EquipmentDetailCardProps) {
  const hasManual = !!item.manual_url;
  const nextService = recommendations[0];
  const hoursUntilService = nextService?.due_at_hours 
    ? nextService.due_at_hours - item.current_hours 
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{item.brand} {item.model}</CardTitle>
            <CardDescription>{item.position_label}</CardDescription>
          </div>
          {hasManual && (
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Manual
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{item.current_hours}</span>
            <span className="text-muted-foreground">hrs</span>
          </div>
          {item.serial_number && (
            <div className="text-muted-foreground truncate">
              SN: {item.serial_number}
            </div>
          )}
        </div>

        {/* Manual Link */}
        {hasManual && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.open(item.manual_url!, "_blank")}
          >
            <FileText className="w-4 h-4 mr-2" />
            View Manual
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
        )}

        {/* Next Service */}
        {nextService && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="w-4 h-4 text-primary" />
              Next Service
            </div>
            <p className="text-sm text-muted-foreground">{nextService.title}</p>
            {hoursUntilService !== null && (
              <div className="flex items-center gap-2">
                {hoursUntilService <= 50 ? (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Due in {hoursUntilService} hrs
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    In {hoursUntilService} hrs
                  </Badge>
                )}
              </div>
            )}
            {onOpenWish && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => onOpenWish(`${nextService.title} for ${item.brand} ${item.model}`)}
              >
                Turn into Wish
              </Button>
            )}
          </div>
        )}

        {!hasManual && !nextService && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            Upload a manual in your Digital Locker to track service intervals
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default EquipmentInventory;
