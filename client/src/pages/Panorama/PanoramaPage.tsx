import { PageContainer } from "@/components/common";
import { PanoramaViewer } from "@/components/panorama";
import { useAppStore } from "@/store";
import { getPanoramaImageUrl } from "@/utils";

export function PanoramaPage() {
  const { navigation, selectedResult } = useAppStore();

  const imageUrl = getPanoramaImageUrl(
    navigation?.entryScene.imagePath ??
    selectedResult?.entryScene?.imagePath
  );

  return (
    <PageContainer
      title="Panorama Viewer"
      description="Explore connected indoor scenes and interactive navigation elements."
    >
      <PanoramaViewer imageUrl={imageUrl} />
    </PageContainer>
  );
}
