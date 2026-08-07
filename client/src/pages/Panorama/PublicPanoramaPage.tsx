import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Loader2, AlertTriangle, DoorOpen, Building, User } from "lucide-react";
import { useScenePreview } from "@/hooks/useScenePreview";
import { ScenePreviewViewer } from "@/pages/admin/NavigationPreview/ScenePreviewViewer";
import { DestinationReachedModal } from "@/components/navigation";
import { useAppStore } from "@/store";
import { getPanoramaImageUrl } from "@/utils";

interface PublicPanoramaPageProps {
  overrideSceneId?: string;
}

export function PublicPanoramaPage({ overrideSceneId }: PublicPanoramaPageProps = {}) {
  const { sceneId: paramsSceneId } = useParams<{ sceneId: string }>();
  const activeSceneId = overrideSceneId || paramsSceneId || "";
  const navigate = useNavigate();
  const { navStep, destinationTarget } = useAppStore();

  const [isTransitioning, setIsTransitioning] = useState(false);

  const {
    scene,
    elements,
    isLoading,
    error,
    reload,
    navigateTo,
    history,
    goBack,
  } = useScenePreview(activeSceneId);

  function handleArrowClick(nextSceneId: string) {
    if (!nextSceneId) return;
    setIsTransitioning(true);
    setTimeout(() => {
      navigateTo(nextSceneId);
      navigate(`/panorama/${nextSceneId}`, { replace: false });
      setTimeout(() => setIsTransitioning(false), 150);
    }, 450);
  }

  function handleGoBack() {
    if (history.length > 0) {
      const prevId = history[history.length - 1];
      goBack();
      navigate(`/panorama/${prevId}`, { replace: true });
    } else {
      navigate(-1);
    }
  }

  // Keyboard: ESC / Backspace = go back
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace") {
        handleGoBack();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const imageUrl = scene ? getPanoramaImageUrl(scene.imagePath) : null;

  if (!activeSceneId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950 text-white/60 text-sm">
        No scene selected.
      </div>
    );
  }


  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden">
      {/* Full-screen viewer */}
      <div className="absolute inset-0">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 z-10">
            <Loader2 size={32} className="animate-spin mb-3 text-cyan-400" />
            <p className="text-sm font-medium">Loading 360° Panorama…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 p-4 text-center z-10">
            <AlertTriangle size={32} className="mb-3 text-red-400" />
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={reload}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm text-white font-medium transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && !imageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 p-4 text-center z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
              <RotateCcw size={24} />
            </div>
            <p className="text-sm font-medium">No panorama image for this scene.</p>
          </div>
        )}

        {!isLoading && !error && imageUrl && (
          <ScenePreviewViewer
            imageUrl={imageUrl}
            elements={elements}
            onArrowClick={handleArrowClick}
            isTransitioning={isTransitioning}
          />
        )}
      </div>

      {/* Back button overlay — always visible */}
      <button
        onClick={handleGoBack}
        className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3.5 py-2 bg-[#0B132B]/90 backdrop-blur-md rounded-xl text-xs font-semibold text-white hover:bg-slate-800 shadow-lg transition-all cursor-pointer border border-slate-700/80"
        aria-label="Go back"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Entry scene badge */}
      {scene?.isEntryScene && (
        <span className="absolute top-4 left-28 z-50 px-3 py-1.5 bg-emerald-500/90 text-white text-xs font-bold rounded-xl backdrop-blur-md shadow-md flex items-center gap-1.5">
          🚪 Building Entrance
        </span>
      )}


      {/* Target Office Details Overlay Badge (when navigated to an office/staff) */}
      {destinationTarget && (
        <div className="absolute bottom-6 left-4 z-40 max-w-xs sm:max-w-sm rounded-2xl border border-cyan-500/40 bg-[#0B132B]/95 p-3.5 text-slate-100 shadow-2xl backdrop-blur-xl space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
              <DoorOpen size={16} />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                INDOOR TARGET OFFICE
              </span>
              <h4 className="text-xs font-bold text-white truncate">
                {destinationTarget.name}
              </h4>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 space-y-0.5 pt-0.5 border-t border-slate-800">
            {destinationTarget.roomNumber && (
              <p className="flex items-center gap-1.5">
                <span className="text-slate-400">Room:</span>
                <strong className="text-cyan-300">{destinationTarget.roomNumber}</strong>
                <span>·</span>
              <span>Floor {destinationTarget.floorNumber ?? ""}</span>
              </p>
            )}
            {destinationTarget.buildingName && (
              <p className="flex items-center gap-1.5 truncate text-slate-400">
                <Building size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">{destinationTarget.buildingName}</span>
              </p>
            )}
            {destinationTarget.staffName && (
              <p className="flex items-center gap-1.5 text-slate-300">
                <User size={12} className="text-blue-400 shrink-0" />
                <span>{destinationTarget.staffName} ({destinationTarget.staffPosition})</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Destination Reached modal */}
      {navStep === "DESTINATION_REACHED" && <DestinationReachedModal />}
    </div>
  );
}

