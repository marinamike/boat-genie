import { useYardAssets } from "@/hooks/useYardAssets";
import { SlipSettings } from "@/components/slips/SlipSettings";

export function SlipsSetupTab() {
  const yardAssets = useYardAssets();

  return (
    <SlipSettings
      {...yardAssets}
      updateAsset={yardAssets.updateAsset}
      deleteMeter={yardAssets.deleteMeter}
    />
  );
}
