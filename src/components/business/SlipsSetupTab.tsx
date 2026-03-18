import { useState } from "react";
import { useYardAssets } from "@/hooks/useYardAssets";
import { SlipSettings } from "@/components/slips/SlipSettings";
import { AssetForm } from "@/components/slips/AssetForm";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { YardAsset } from "@/hooks/useYardAssets";

export function SlipsSetupTab() {
  const yardAssets = useYardAssets();
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const handleCreateAsset = async (data: Partial<YardAsset>) => {
    const result = await yardAssets.createAsset(data);
    if (result) {
      setShowCreateSheet(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateSheet(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Slip / Space
        </Button>
      </div>

      <SlipSettings
        {...yardAssets}
        updateAsset={yardAssets.updateAsset}
        deleteMeter={yardAssets.deleteMeter}
      />

      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Slip / Space</SheetTitle>
          </SheetHeader>
          <AssetForm
            onSubmit={handleCreateAsset}
            onCancel={() => setShowCreateSheet(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
