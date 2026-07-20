import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight, Home, ArrowLeft, RotateCcw, AlertTriangle, Loader2,
} from "lucide-react";
import { useScenePreview } from "@/hooks/useScenePreview";
import { ScenePreviewViewer } from "./ScenePreviewViewer";

// ─── Entry list (no sceneId param) ────────────────────────────────────────────
export function NavigationPreviewPage() {
  const params = useParams<{ sceneId: string }>();

  if (!params.sceneId) {
    return <NoSceneSelected />;
  }

  return <ScenePreview sceneId={params.sceneId} />;
}

// ─── No sceneId selected ──────────────────────────────────────────────────────
function NoSceneSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-24 px-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <RotateCcw size={28} className="text-blue-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Navigation Preview</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Open a scene from the{" "}
        <Link to="/dashboard/panoramas" className="text-blue-600 hover:underline">
          Panorama Scenes
        </Link>{" "}
        or navigate directly to{" "}
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/dashboard/nav-preview/:sceneId</code>.
      </p>
    </div>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────
function ScenePreview({ sceneId }: { sceneId: string }) {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { scene, elements, floor, building, isLoading, error, reload, navigateTo, history, goBack } =
    useScenePreview(sceneId);

  function handleArrowClick(nextSceneId: string) {
    setIsTransitioning(true);
    setTimeout(() => {
      navigateTo(nextSceneId);
      navigate(`/dashboard/nav-preview/${nextSceneId}`, { replace: false });
      setTimeout(() => setIsTransitioning(false), 350);
    }, 350);
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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-100 text-sm">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">
          <Home size={14} />
        </Link>
        <ChevronRight size={13} className="text-gray-300" />
        <span className="text-gray-500">Navigation Preview</span>
        {scene && (
          <>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-900 font-medium truncate">{scene.name}</span>
          </>
        )}
      </div>

      {/* Panorama viewer area */}
      <div className="flex-1 relative overflow-hidden m-4 rounded-2xl border border-gray-200 bg-gray-900 min-h-0">
        {isLoading && <LoadingState />}
        {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
        {!isLoading && !error && !scene?.imagePath && <EmptyState />}
        {!isLoading && !error && scene?.imagePath && (
          <ScenePreviewViewer
            imageUrl={scene.imagePath.startsWith("/") ? scene.imagePath : `/${scene.imagePath}`}
            elements={elements}
            onArrowClick={handleArrowClick}
            isTransitioning={isTransitioning}
          />
        )}

        {/* Back button overlay */}
        {history.length > 0 && !isLoading && (
          <button
            onClick={handleGoBack}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-medium text-gray-700 hover:bg-white shadow-md transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        )}

        {/* Entrance badge */}
        {scene?.isEntryScene && (
          <span className="absolute top-4 right-4 z-10 px-2.5 py-1 bg-green-500/90 text-white text-xs font-medium rounded-lg backdrop-blur-sm">
            Entry Scene
          </span>
        )}
      </div>

      {/* Footer status bar */}
      <div className="flex items-center gap-6 px-6 py-3 bg-white border-t border-gray-100 text-sm flex-shrink-0">
        <StatusItem label="Current Scene" value={isLoading ? "Loading…" : (scene?.name ?? "—")} />
        <Divider />
        <StatusItem label="Building" value={isLoading ? "Loading…" : (building?.name ?? "—")} />
        <Divider />
        <StatusItem label="Floor" value={isLoading ? "Loading…" : (floor ? `Floor ${floor.floorNumber}` : "—")} />
        {!isLoading && elements.length > 0 && (
          <>
            <Divider />
            <StatusItem label="Elements" value={`${elements.length}`} />
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Read-only
        </div>
      </div>
    </div>
  );
}

// ─── Loading / Empty / Error states ──────────────────────────────────────────
function LoadingState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
      <Loader2 size={32} className="animate-spin mb-3" />
      <p className="text-sm">Loading panorama…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
        <RotateCcw size={24} />
      </div>
      <p className="text-sm">No panorama available.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
      <AlertTriangle size={32} className="mb-3 text-red-400" />
      <p className="text-sm mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm text-white transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</span>
      <span className="text-gray-900 font-medium text-sm leading-tight truncate max-w-[160px]">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-8 bg-gray-100 flex-shrink-0" />;
}
