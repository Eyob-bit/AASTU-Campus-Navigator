import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import { sceneApi } from "@/api/scene.api";
import { PublicPanoramaPage } from "./PublicPanoramaPage";
import { Loader2 } from "lucide-react";

export function PanoramaPage() {
  const navigate = useNavigate();
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

    sceneApi
      .getDefault()
      .then((scene) => {
        if (scene && scene.id) {
          setTargetSceneId(scene.id);
          // Update URL silently
          navigate(`/panorama/${scene.id}`, { replace: true });
        }
      })
      .catch((err) => {
        console.error("Failed to load default panorama scene:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [destinationTarget, navigate]);

  if (isLoading || !targetSceneId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-50">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">Loading 360° Panorama Scene…</p>
      </div>
    );
  }

  return <PublicPanoramaPage overrideSceneId={targetSceneId} />;
}
