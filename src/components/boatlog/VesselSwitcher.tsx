import { useState } from "react";
import { Ship, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Vessel } from "@/contexts/VesselContext";

interface VesselSwitcherProps {
  vessels: Vessel[];
  activeVessel: Vessel | null;
  onSelect: (vesselId: string) => void;
}

export function VesselSwitcher({ vessels, activeVessel, onSelect }: VesselSwitcherProps) {
  const [open, setOpen] = useState(false);

  if (!activeVessel) return null;

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
      <div className="px-4 py-3">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-3 hover:bg-primary/10"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-lg border-2 border-primary/20">
                  {activeVessel.image_url ? (
                    <AvatarImage src={activeVessel.image_url} alt={activeVessel.name} />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-primary/10">
                    <Ship className="w-6 h-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="font-semibold text-base">{activeVessel.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[activeVessel.make, activeVessel.model].filter(Boolean).join(" ")}
                    {activeVessel.length_ft && ` • ${activeVessel.length_ft}ft`}
                  </p>
                </div>
              </div>
              {vessels.length > 1 && (
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    open && "rotate-180"
                  )}
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          
          {vessels.length > 1 && (
            <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-md">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Switch Vessel
              </div>
              {vessels.map((vessel) => {
                const isActive = vessel.id === activeVessel.id;
                return (
                  <DropdownMenuItem
                    key={vessel.id}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer",
                      isActive && "bg-primary/5"
                    )}
                    onClick={() => {
                      onSelect(vessel.id);
                      setOpen(false);
                    }}
                  >
                    <Avatar className="h-10 w-10 rounded-lg">
                      {vessel.image_url ? (
                        <AvatarImage src={vessel.image_url} alt={vessel.name} />
                      ) : null}
                      <AvatarFallback className="rounded-lg bg-muted">
                        <Ship className="w-5 h-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{vessel.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[vessel.make, vessel.model].filter(Boolean).join(" ")}
                        {vessel.length_ft && ` • ${vessel.length_ft}ft`}
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>
    </div>
  );
}
