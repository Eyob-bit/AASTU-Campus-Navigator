import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Loader2,
  AlertTriangle,
  DoorOpen,
  Building,
  User,
  Compass,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useScenePreview } from "@/hooks/useScenePreview";
import { useIndoorNavigationRoute } from "@/hooks/useIndoorNavigationRoute";
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
    floor,
    floorScenes,
    isLoading,
    error,
    reload,
    navigateTo,
    history,
    goBack,
  } = useScenePreview(activeSceneId);

  // Compute exact next arrow on the shortest BFS route to the destination office
  const {
    isRouteActive,
    highlightedNextSceneId,
    highlightedElementId,
    isAtDestination,
    isCrossFloor,
    targetFloorNumber,
    targetBuildingName,
    noRouteFound,
    destinationSceneId,
  } = useIndoorNavigationRoute({
    currentSceneId: activeSceneId,
    currentFloorId: scene?.floorId,
    floorScenes,
  });

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

  const targetOfficeId =
    destinationTarget?.officeId ||
    (destinationTarget?.type === "OFFICE" ? destinationTarget.id : null) ||
    (destinationTarget?.type === "STAFF" ? destinationTarget.officeId : null);

  if (!activeSceneId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950 text-white/60 text-sm">
        No scene selected.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden select-none">
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
            highlightedNextSceneId={highlightedNextSceneId}
            highlightedElementId={highlightedElementId}
            isRouteActive={isRouteActive}
            targetOfficeId={targetOfficeId}
            targetOfficeName={destinationTarget?.officeName || destinationTarget?.name}
          />
        )}
      </div>

      {/* Top Left Navigation Bar: Back button & Scene badges */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0B132B]/90 backdrop-blur-md rounded-xl text-xs font-semibold text-white hover:bg-slate-800 shadow-lg transition-all cursor-pointer border border-slate-700/80"
          aria-label="Go back"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {scene?.isEntryScene && (
          <span className="px-3 py-2 bg-emerald-500/90 text-white text-xs font-bold rounded-xl backdrop-blur-md shadow-md flex items-center gap-1.5">
            🚪 Building Entrance
          </span>
        )}
      </div>

      {/* Top Center Floating Indoor Guidance Status Banner */}
      {isRouteActive && !isAtDestination && (
        <div className="absolute top-4 inset-x-16 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-md w-full px-2">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#0B132B]/95 border border-cyan-500/50 shadow-[0_0_25px_rgba(0,240,255,0.25)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                <Compass size={18} className="animate-spin-slow" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                    INDOOR ROUTE
                  </span>
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  <span className="text-[10px] text-slate-300">
                    Floor {floor?.floorNumber ?? ""}
                  </span>
                </div>
                <p className="text-xs font-bold text-white truncate">
                  Follow glowing arrow to{" "}
                  <span className="text-cyan-300">
                    {destinationTarget?.officeName || destinationTarget?.name}
                  </span>
                  {destinationTarget?.roomNumber && ` (Rm ${destinationTarget.roomNumber})`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold shrink-0">
              <Sparkles size={12} className="animate-pulse" />
              <span>Next Step</span>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Floor Alert Banner */}
      {isCrossFloor && (
        <div className="absolute top-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-lg w-full">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0B132B]/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Layers size={20} />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  FLOOR TRANSITION REQUIRED
                </span>
                <p className="text-xs text-slate-200">
                  Target office <strong className="text-white">{destinationTarget?.name}</strong> is on{" "}
                  <strong className="text-amber-300">Floor {targetFloorNumber ?? "different"}</strong>
                  {targetBuildingName ? ` in ${targetBuildingName}` : ""}.
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Please proceed to Floor {targetFloorNumber ?? ""} to continue guided indoor navigation.
                </p>
              </div>
            </div>

            {destinationTarget?.entrySceneId && (
              <button
                onClick={() => {
                  if (destinationTarget.entrySceneId) {
                    navigate(`/panorama/${destinationTarget.entrySceneId}`);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition-all cursor-pointer shadow-md"
              >
                Go to Floor {targetFloorNumber ?? ""} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* No Connected Route Notice */}
      {noRouteFound && !isCrossFloor && (
        <div className="absolute top-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-md w-full">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#0B132B]/90 border border-slate-700/80 text-slate-300 text-xs backdrop-blur-xl shadow-xl">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span>Target office is on this floor, but no connected panorama route was found.</span>
          </div>
        </div>
      )}

      {/* Destination Reached / Current Scene Overlay Badge */}
      {destinationTarget &&
        (isAtDestination ||
          activeSceneId === destinationSceneId ||
          destinationTarget.entrySceneId === activeSceneId) && (
          <div className="absolute bottom-6 left-4 z-40 max-w-xs sm:max-w-sm rounded-2xl border border-cyan-500/50 bg-[#0B132B]/95 p-3.5 text-slate-100 shadow-[0_0_30px_rgba(0,240,255,0.2)] backdrop-blur-xl space-y-1.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                  <DoorOpen size={16} />
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                    {isAtDestination ? "DESTINATION REACHED" : "INDOOR TARGET OFFICE"}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">
                    {destinationTarget.name}
                  </h4>
                </div>
              </div>
              {isAtDestination && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                  <CheckCircle2 size={12} />
                  <span>Arrived</span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-800">
              {destinationTarget.roomNumber && (
                <p className="flex items-center gap-1.5">
                  <span className="text-slate-400">Room:</span>
                  <strong className="text-cyan-300">{destinationTarget.roomNumber}</strong>
                  <span>·</span>
                  <span>Floor {destinationTarget.floorNumber ?? floor?.floorNumber ?? ""}</span>
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
                  <span>
                    {destinationTarget.staffName} ({destinationTarget.staffPosition})
                  </span>
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


