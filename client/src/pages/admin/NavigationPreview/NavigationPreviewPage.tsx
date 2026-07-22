import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight, Home, ArrowLeft, RotateCcw, AlertTriangle, Loader2, Play, Image as ImageIcon,
} from "lucide-react";
import { useScenePreview } from "@/hooks/useScenePreview";
import { useCampusHierarchy } from "@/hooks/useCampusHierarchy";
import { floorApi } from "@/api/floor.api";
import type { PanoramaScene } from "@/types";
import { ScenePreviewViewer } from "./ScenePreviewViewer";
import { getPanoramaImageUrl, formatFloorLabel } from "@/utils";
import { Card, Skeleton, Button } from "@/components/ui";

// ─── Entry point (handles both /nav-preview and /nav-preview/:sceneId) ────────────
export function NavigationPreviewPage() {
  const params = useParams<{ sceneId: string }>();

  if (!params.sceneId) {
    return <NoSceneSelected />;
  }

  return <ScenePreview sceneId={params.sceneId} />;
}

// ─── Interactive Scene Selector when no sceneId in URL ─────────────────────────
function NoSceneSelected() {
  const navigate = useNavigate();
  const { buildings, floorOptions, isLoading: hierarchyLoading, error: hierarchyError, refresh } = useCampusHierarchy();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [scenes, setScenes] = useState<PanoramaScene[]>([]);
  const [scenesLoading, setScenesLoading] = useState<boolean>(false);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [buildings, selectedBuildingId]);

  const buildingFloors = floorOptions.filter((f) => f.buildingId === selectedBuildingId);
  useEffect(() => {
    if (buildingFloors.length > 0) {
      setSelectedFloorId(buildingFloors[0].id);
    } else {
      setSelectedFloorId("");
    }
  }, [selectedBuildingId, floorOptions]);

  useEffect(() => {
    if (!selectedFloorId) {
      setScenes([]);
      return;
    }
    setScenesLoading(true);
    floorApi.getScenes(selectedFloorId)
      .then((data) => setScenes(data.scenes))
      .catch(() => setScenes([]))
      .finally(() => setScenesLoading(false));
  }, [selectedFloorId]);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw className="text-indigo-600" size={18} />
              Navigation Preview
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Select a building, floor, and scene to launch interactive indoor navigation preview.
            </p>
          </div>
          <Link to="/dashboard/panoramas" className="self-start sm:self-auto">
            <Button variant="outline" size="sm">
              Panorama Gallery →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Building Selector */}
          <Card className="p-4 sm:p-5">
            <h2 className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 sm:mb-3">
              1. Select Building
            </h2>
            {hierarchyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : hierarchyError ? (
              <p className="text-xs text-red-500">{hierarchyError}</p>
            ) : (
              <div className="space-y-1 max-h-48 sm:max-h-64 overflow-y-auto">
                {buildings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBuildingId(b.id)}
                    className={`w-full text-left px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      selectedBuildingId === b.id
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Floor Selector */}
          <Card className="p-4 sm:p-5">
            <h2 className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 sm:mb-3">
              2. Select Floor
            </h2>
            {!selectedBuildingId ? (
              <p className="text-xs text-gray-400">Select a building first</p>
            ) : buildingFloors.length === 0 ? (
              <p className="text-xs text-gray-400">No floors added to this building.</p>
            ) : (
              <div className="space-y-1 max-h-48 sm:max-h-64 overflow-y-auto">
                {buildingFloors.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFloorId(f.id)}
                    className={`w-full text-left px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      selectedFloorId === f.id
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {formatFloorLabel(f.floorNumber)}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Scene Selector */}
          <Card className="p-4 sm:p-5 sm:col-span-2 md:col-span-1">
            <h2 className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 sm:mb-3">
              3. Choose Scene
            </h2>
            {!selectedFloorId ? (
              <p className="text-xs text-gray-400">Select a floor first</p>
            ) : scenesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : scenes.length === 0 ? (
              <p className="text-xs text-gray-400">No scenes uploaded for this floor.</p>
            ) : (
              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                {scenes.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/dashboard/nav-preview/${s.id}`)}
                    className="group flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={14} className="sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {s.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{s.key}</p>
                      </div>
                    </div>
                    <Play size={13} className="text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 ml-1" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Main Interactive Viewer (Fully Responsive Layout) ───────────────────────
function ScenePreview({ sceneId }: { sceneId: string }) {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { scene, elements, floor, building, isLoading, error, reload, navigateTo, history, goBack } =
    useScenePreview(sceneId);

  function handleArrowClick(nextSceneId: string) {
    if (!nextSceneId) return;
    setIsTransitioning(true);
    setTimeout(() => {
      navigateTo(nextSceneId);
      navigate(`/dashboard/nav-preview/${nextSceneId}`, { replace: false });
      setTimeout(() => setIsTransitioning(false), 150);
    }, 450);
  }

  function handleGoBack() {
    if (history.length === 0) return;
    const prevId = history[history.length - 1];
    goBack();
    navigate(`/dashboard/nav-preview/${prevId}`, { replace: true });
  }

  // Keyboard navigation: ESC / Backspace = go back
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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Breadcrumb — scrollable on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white border-b border-gray-100 text-xs sm:text-sm flex-shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <Home size={13} className="sm:w-3.5 sm:h-3.5" />
        </Link>
        <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
        <Link to="/dashboard/nav-preview" className="text-gray-500 hover:text-gray-700 flex-shrink-0">
          Nav Preview
        </Link>
        {building && (
          <>
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            <span className="text-gray-500 flex-shrink-0">{building.name}</span>
          </>
        )}
        {floor && (
          <>
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            <span className="text-gray-500 flex-shrink-0">{formatFloorLabel(floor.floorNumber)}</span>
          </>
        )}
        {scene && (
          <>
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-[200px] flex-shrink-0">
              {scene.name}
            </span>
          </>
        )}
      </div>

      {/* Main viewer container */}
      <div className="flex-1 relative overflow-hidden m-2 sm:m-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-950 min-h-0 flex flex-col justify-center items-center">
        {isLoading && <LoadingState />}
        {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
        {!isLoading && !error && !imageUrl && <EmptyState />}
        {!isLoading && !error && imageUrl && (
          <ScenePreviewViewer
            imageUrl={imageUrl}
            elements={elements}
            onArrowClick={handleArrowClick}
            isTransitioning={isTransitioning}
          />
        )}

        {/* Back button overlay */}
        {history.length > 0 && !isLoading && (
          <button
            onClick={handleGoBack}
            className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white/90 backdrop-blur-md rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-gray-800 hover:bg-white shadow-lg transition-all cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={13} className="sm:w-3.5 sm:h-3.5" />
            Back
          </button>
        )}

        {/* Entry scene badge */}
        {scene?.isEntryScene && (
          <span className="absolute top-2 left-20 sm:top-4 sm:left-24 z-20 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-500/90 text-white text-[10px] sm:text-xs font-semibold rounded-md sm:rounded-lg backdrop-blur-md shadow-md">
            Entry Scene
          </span>
        )}
      </div>

      {/* Footer status bar (responsive grid / wrapping) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-6 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-t border-gray-100 text-xs sm:text-sm flex-shrink-0">
        <StatusItem label="Current Scene" value={isLoading ? "Loading…" : (scene?.name ?? "—")} />
        <Divider />
        <StatusItem label="Building" value={isLoading ? "Loading…" : (building?.name ?? "—")} />
        <Divider />
        <StatusItem label="Floor" value={isLoading ? "Loading…" : (floor ? formatFloorLabel(floor.floorNumber) : "—")} />
        {!isLoading && elements.length > 0 && (
          <>
            <Divider />
            <StatusItem label="Elements" value={`${elements.length}`} />
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          Interactive Preview
        </div>
      </div>
    </div>
  );
}

// ─── Loading / Empty / Error states ──────────────────────────────────────────
function LoadingState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
      <Loader2 size={28} className="animate-spin mb-2 sm:mb-3 text-indigo-400 sm:w-8 sm:h-8" />
      <p className="text-xs sm:text-sm font-medium">Loading navigation scene…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 p-4 text-center">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center mb-2 sm:mb-3">
        <RotateCcw size={20} className="sm:w-6 sm:h-6" />
      </div>
      <p className="text-xs sm:text-sm font-medium">No panorama image available for this scene.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 p-4 text-center">
      <AlertTriangle size={28} className="mb-2 sm:mb-3 text-red-400 sm:w-8 sm:h-8" />
      <p className="text-xs sm:text-sm mb-3 sm:mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white font-medium transition-colors cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</span>
      <span className="text-gray-900 font-semibold text-xs sm:text-sm leading-tight truncate max-w-[100px] sm:max-w-[160px]">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="hidden sm:block w-px h-7 bg-gray-100 flex-shrink-0" />;
}
