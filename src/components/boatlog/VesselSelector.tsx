import { Ship, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Boat {
  id: string;
  name: string;
  make?: string | null;
  model?: string | null;
}

interface VesselSelectorProps {
  boats: Boat[];
  selectedBoatId: string | null;
  onSelect: (boatId: string) => void;
}

export function VesselSelector({ boats, selectedBoatId, onSelect }: VesselSelectorProps) {
  if (boats.length <= 1) {
    return null;
  }

  return (
    <div className="bg-muted/30 border-b border-border">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 p-3">
          {boats.map((boat) => {
            const isSelected = boat.id === selectedBoatId;
            return (
              <Button
                key={boat.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex items-center gap-2 shrink-0 transition-all",
                  isSelected && "shadow-md"
                )}
                onClick={() => onSelect(boat.id)}
              >
                <Ship className="w-4 h-4" />
                <span className="font-medium">{boat.name}</span>
                {boat.make && boat.model && (
                  <span className="text-xs opacity-70">
                    {boat.make} {boat.model}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
