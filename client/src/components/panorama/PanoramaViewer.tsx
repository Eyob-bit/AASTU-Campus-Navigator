import { useEffect, useRef } from "react";
import {
  EquirectGeometry,
  ImageUrlSource,
  RectilinearView,
  Viewer,
} from "marzipano";
import { ChevronLeft, ChevronRight, CheckCircle2, Compass, ArrowUp, MapPin } from "lucide-react";
import { useAppStore } from "@/store";
import { getPanoramaImageUrl } from "@/utils";
import type { PathNode } from "@/types";

interface PanoramaViewerProps {
  imageUrl?: string | null;
  className?: string;
}

export function PanoramaViewer({
  imageUrl: initialImageUrl,
  className,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  const {
    navigation,
    destinationTarget,
    currentStepIndex,
    setCurrentStepIndex,
    setNavStep,
  } = useAppStore();

  const path: PathNode[] = navigation?.path ?? [];
  const currentPathNode = path[currentStepIndex];

  // Determine current image URL from step path or props
  const activeImageUrl = getPanoramaImageUrl(
    currentPathNode?.imagePath ??
    initialImageUrl ??
    navigation?.entryScene.imagePath
  );

  useEffect(() => {
    if (!containerRef.current || !activeImageUrl) {
      return;
    }

    // Destroy existing viewer instance before re-creating
    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    const viewer = new Viewer(containerRef.current);
    const source = ImageUrlSource.fromString(activeImageUrl);
    const geometry = new EquirectGeometry([{ tileSize: 1024, size: 4096 }]);
    const view = new RectilinearView({ yaw: 0, pitch: 0, fov: 1.2 });
    const scene = viewer.createScene({ source, geometry, view });

    scene.switchTo();
    viewerRef.current = viewer;

    return () => {
      scene.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [activeImageUrl]);

  const totalSteps = path.length > 0 ? path.length : 1;
  const isFinalStep = currentStepIndex >= totalSteps - 1;

  const handleNextStep = () => {
    if (isFinalStep) {
      setNavStep("DESTINATION_REACHED");
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (!activeImageUrl) {
    return (
      <div
        className={
          className ??
          "flex h-[75vh] w-full items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-[#0B132B]/90 text-slate-400"
        }
      >
        Select a destination to load guided indoor panorama.
      </div>
    );
  }

  return (
    <div className={className ?? "relative h-[calc(100dvh-5rem)] w-full overflow-hidden bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl"}>
      {/* 360 Marzipano Viewer Container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Top Floating Guided Progress Banner */}
      <div className="absolute top-4 inset-x-4 z-20 max-w-xl mx-auto">
        <div className="rounded-2xl border border-cyan-500/40 bg-[#0B132B]/90 p-3.5 backdrop-blur-xl shadow-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  INDOOR GUIDED NAV
                </span>
                <h4 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  {destinationTarget?.name ?? navigation?.office.name ?? "Indoor Navigation"}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full">
              <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            </div>
          </div>

          {/* Progress Segment Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex gap-0.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-full transition-all duration-300 ${
                  i <= currentStepIndex ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-slate-700/50"
                }`}
              />
            ))}
          </div>

          {currentPathNode && (
            <p className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate pt-0.5">
              <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Current Spot: <strong className="text-white">{currentPathNode.name}</strong></span>
            </p>
          )}
        </div>
      </div>

      {/* Center Guided Arrow Hotspot Button Overlay (Street View style) */}
      {!isFinalStep && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <button
            onClick={handleNextStep}
            className="pointer-events-auto flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.6)] border-2 border-cyan-300 group-hover:scale-110 transition-all animate-bounce">
              <ArrowUp className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <span className="rounded-full bg-[#0B132B]/90 border border-cyan-400/50 px-3 py-1 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-lg group-hover:text-white">
              Tap to Advance →
            </span>
          </button>
        </div>
      )}

      {/* Bottom Floating Step Navigation Controls */}
      <div className="absolute bottom-6 inset-x-4 z-20 max-w-md mx-auto">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#0B132B]/95 p-3 backdrop-blur-xl shadow-2xl">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Step"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={handleNextStep}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer active:scale-95"
          >
            {isFinalStep ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Arrived at Office</span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
