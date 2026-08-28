import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { PublicPanoramaPage } from "./PublicPanoramaPage";
import { Loader2 } from "lucide-react";

export function PanoramaPage() {
  const { destinationTarget } = useAppStore();
  const [targetSceneId, setTargetSceneId] = useState<string | null>(
    destinationTarget?.entrySceneId || null
  );
  const [isLoading, setIsLoading] = useState(!targetSceneId);

  useEffect(() => {
    if (destinationTarget?.entrySceneId) {
      setTargetSceneId(destinationTarget.entrySceneId);
      setIsLoading(false);
      return;
    }

    setTargetSceneId(null);
    setIsLoading(false);
  }, [destinationTarget]);

  if (isLoading || !targetSceneId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-50">
        {targetSceneId === null && destinationTarget ? (
          <p className="text-sm font-medium text-slate-300">
            Indoor view is not available for this floor yet.
          </p>
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
        )}
        <p className="text-sm font-medium text-slate-300">Loading 360° Panorama Scene…</p>
      </div>
    );
  }

  return <PublicPanoramaPage overrideSceneId={targetSceneId} />;
}
