import { useState } from "react";
import { useYardAssets } from "@/hooks/useYardAssets";
import { SlipSettings } from "@/components/slips/SlipSettings";
import { AssetForm } from "@/components/slips/AssetForm";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
    <>
      <SlipSettings
        {...yardAssets}
        updateAsset={yardAssets.updateAsset}
        deleteMeter={yardAssets.deleteMeter}
        onAddAsset={() => setShowCreateSheet(true)}
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
    </>
  );
}
