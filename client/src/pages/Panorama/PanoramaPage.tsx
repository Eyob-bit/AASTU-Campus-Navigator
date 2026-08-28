import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { PublicPanoramaPage } from "./PublicPanoramaPage";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import { sceneApi } from "@/api/scene.api";
import { useNavigate } from "react-router-dom";

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

    // Try fetching the global default entrance scene
    sceneApi
      .getDefault()
      .then((defScene) => {
        if (defScene?.id) {
          setTargetSceneId(defScene.id);
        } else {
          setTargetSceneId(null);
        }
      })
      .catch(() => {
        setTargetSceneId(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [destinationTarget]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-50">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">Loading 360° Panorama Scene…</p>
      </div>
    );
  }

  if (!targetSceneId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center z-50 animate-fade-in">
        <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-[#0B132B] p-6 shadow-2xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">
              Indoor View Unavailable
            </h3>
            <p className="text-xs text-slate-300">
              360° panorama scenes for {destinationTarget?.buildingName || "this floor"} have not been uploaded yet.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Map</span>
          </button>
        </div>
      </div>
    );
  }

  return <PublicPanoramaPage overrideSceneId={targetSceneId} />;
}
