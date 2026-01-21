import { Ship } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Vessel } from "@/contexts/VesselContext";

interface VesselEmptyStateProps {
  vessels: Vessel[];
  onSelectVessel: (vesselId: string) => void;
}

export function VesselEmptyState({ vessels, onSelectVessel }: VesselEmptyStateProps) {
  return (
    <div className="px-4 py-8">
      <Card className="border-2 border-dashed">
        <CardContent className="py-12 text-center">
          <Ship className="w-16 h-16 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="font-semibold text-xl mb-2">Select a Vessel</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Choose a vessel to view its service log and documents
          </p>

          <div className="space-y-3 max-w-sm mx-auto">
            {vessels.map((vessel) => (
              <Button
                key={vessel.id}
                variant="outline"
                className="w-full h-auto p-4 justify-start"
                onClick={() => onSelectVessel(vessel.id)}
              >
                <Avatar className="h-10 w-10 rounded-lg mr-3">
                  {vessel.image_url ? (
                    <AvatarImage src={vessel.image_url} alt={vessel.name} />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-primary/10">
                    <Ship className="w-5 h-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-medium">{vessel.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[vessel.make, vessel.model].filter(Boolean).join(" ")}
                    {vessel.length_ft && ` • ${vessel.length_ft}ft`}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
