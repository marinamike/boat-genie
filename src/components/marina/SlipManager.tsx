import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlipCard } from "./SlipCard";
import { Anchor, Warehouse, Ship } from "lucide-react";
import type { MarinaSlip } from "@/hooks/useMarinaSettings";

interface SlipManagerProps {
  slips: MarinaSlip[];
  onMoveBoat: (boatId: string, boatLengthFt: number, targetSlipId: string, sourceSlipId?: string) => Promise<boolean>;
  onRemoveBoat: (slipId: string) => Promise<boolean>;
  showDryStack?: boolean;
}

function SortableSlip({ 
  slip, 
  onRemoveBoat 
}: { 
  slip: MarinaSlip; 
  onRemoveBoat?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: slip.id, 
    disabled: !slip.is_occupied,
    data: { slip }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SlipCard
        slip={slip}
        isDragging={isDragging}
        onRemoveBoat={onRemoveBoat}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function SlipManager({ 
  slips, 
  onMoveBoat, 
  onRemoveBoat,
  showDryStack = true 
}: SlipManagerProps) {
  const [activeSlip, setActiveSlip] = useState<MarinaSlip | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stagingSlips = slips.filter((s) => s.slip_type === "staging");
  const dockSlips = slips.filter((s) => s.slip_type === "dock");
  const dryStackSlips = slips.filter((s) => s.slip_type === "dry_stack");

  const handleDragStart = (event: DragStartEvent) => {
    const slip = slips.find((s) => s.id === event.active.id);
    if (slip) setActiveSlip(slip);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSlip(null);

    if (!over || active.id === over.id) return;

    const sourceSlip = slips.find((s) => s.id === active.id);
    const targetSlip = slips.find((s) => s.id === over.id);

    if (!sourceSlip?.boat || !targetSlip) return;

    // Check if boat fits in target slip
    if (sourceSlip.current_boat_length_ft && sourceSlip.current_boat_length_ft > targetSlip.max_length_ft) {
      return;
    }

    await onMoveBoat(
      sourceSlip.current_boat_id!,
      sourceSlip.current_boat_length_ft!,
      targetSlip.id,
      sourceSlip.id
    );
  };

  const renderSlipList = (slipList: MarinaSlip[]) => (
    <SortableContext items={slipList.map((s) => s.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
        {slipList.map((slip) => (
          <SortableSlip
            key={slip.id}
            slip={slip}
            onRemoveBoat={slip.is_occupied ? () => onRemoveBoat(slip.id) : undefined}
          />
        ))}
      </div>
    </SortableContext>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="w-5 h-5 text-primary" />
          Slip Manager
        </CardTitle>
        <CardDescription>
          Drag and drop boats between slips and staging areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Tabs defaultValue="staging">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="staging" className="flex items-center gap-1.5">
                <Anchor className="w-4 h-4" />
                Staging
              </TabsTrigger>
              <TabsTrigger value="dock" className="flex items-center gap-1.5">
                <Ship className="w-4 h-4" />
                Docks
              </TabsTrigger>
              {showDryStack && (
                <TabsTrigger value="dry_stack" className="flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4" />
                  Dry Stack
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="staging" className="mt-0">
              {renderSlipList(stagingSlips)}
            </TabsContent>

            <TabsContent value="dock" className="mt-0">
              {renderSlipList(dockSlips)}
            </TabsContent>

            {showDryStack && (
              <TabsContent value="dry_stack" className="mt-0">
                {renderSlipList(dryStackSlips)}
              </TabsContent>
            )}
          </Tabs>

          <DragOverlay>
            {activeSlip && (
              <SlipCard slip={activeSlip} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}

export default SlipManager;
