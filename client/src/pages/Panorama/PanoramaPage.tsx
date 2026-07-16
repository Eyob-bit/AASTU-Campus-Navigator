import { PageContainer } from "@/components/common";
import { PanoramaViewer } from "@/components/panorama";
import { useAppStore } from "@/store";

export function PanoramaPage() {
  const { navigation, selectedResult } = useAppStore();

  const imageUrl =
    navigation?.entryScene.imagePath ??
    selectedResult?.entryScene?.imagePath ??
    null;

  return (
    <PageContainer
      title="Panorama Viewer"
      description="Explore connected indoor scenes and interactive navigation elements."
    >
      <PanoramaViewer imageUrl={imageUrl} />
    </PageContainer>
  );
}
