import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { EquirectGeometry, ImageUrlSource, RectilinearView, Viewer } from "marzipano";
import { ArrowRight, Info, DoorOpen } from "lucide-react";
import type { SceneElement } from "@/types";

interface ScenePreviewViewerProps {
  imageUrl: string;
  elements: SceneElement[];
  onArrowClick: (nextSceneId: string) => void;
  isTransitioning?: boolean;
}

export function ScenePreviewViewer({
  imageUrl,
  elements,
  onArrowClick,
  isTransitioning = false,
}: ScenePreviewViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [tooltip, setTooltip] = useState<{ element: SceneElement; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !imageUrl) return;

    const viewer = new Viewer(containerRef.current);
    const source = ImageUrlSource.fromString(imageUrl);
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
  }, [imageUrl]);

  // Close tooltip on outside click
  useEffect(() => {
    function handleClick() {
      setTooltip(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Panorama container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ opacity: isTransitioning ? 0 : 1, transition: "opacity 0.35s ease" }}
      />

      {/* Overlay markers */}
      <div className="absolute inset-0 pointer-events-none">
        {elements.map((el) => (
          <ElementMarker
            key={el.id}
            element={el}
            onArrowClick={onArrowClick}
            onInfoClick={(e: MouseEvent<HTMLButtonElement>, x: number, y: number) => {
              e.stopPropagation();
              setTooltip((prev: { element: SceneElement; x: number; y: number } | null) =>
                prev?.element.id === el.id ? null : { element: el, x, y }
              );
            }}
          />
        ))}
      </div>

      {/* Info / Office tooltip */}
      {tooltip && (
        <InfoTooltip
          element={tooltip.element}
          x={tooltip.x}
          y={tooltip.y}
          onClose={() => setTooltip(null)}
        />
      )}
    </div>
  );
}

// ─── Individual Marker ────────────────────────────────────────────────────────

interface MarkerProps {
  element: SceneElement;
  onArrowClick: (nextSceneId: string) => void;
  onInfoClick: (e: MouseEvent<HTMLButtonElement>, x: number, y: number) => void;
}

function ElementMarker({ element, onArrowClick, onInfoClick }: MarkerProps) {
  const left = `${element.x * 100}%`;
  const top = `${element.y * 100}%`;

  if (element.type === "ARROW") {
    return (
      <button
        className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 border-2 border-white/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 hover:scale-110 transition-all duration-200 shadow-lg cursor-pointer"
        style={{ left, top, transform: `translate(-50%, -50%) rotate(${element.rotation ?? 0}deg)` }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          if (element.nextSceneId) onArrowClick(element.nextSceneId);
        }}
        aria-label={`Navigate: ${element.label ?? "Next scene"}`}
        title={element.label ?? "Go to next scene"}
      >
        <ArrowRight size={20} />
      </button>
    );
  }

  if (element.type === "INFORMATION") {
    return (
      <button
        className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-blue-500/80 border-2 border-white/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-blue-600/90 hover:scale-110 transition-all duration-200 shadow-lg cursor-pointer text-sm font-bold"
        style={{ left, top }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => onInfoClick(e, element.x, element.y)}
        aria-label={`Info: ${element.label ?? "Information"}`}
      >
        <Info size={14} />
      </button>
    );
  }

  if (element.type === "OFFICE_LABEL") {
    return (
      <button
        className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/85 backdrop-blur-sm border border-white/60 text-gray-900 text-xs font-medium shadow-lg hover:bg-white hover:scale-105 transition-all duration-200 cursor-pointer"
        style={{ left, top }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => onInfoClick(e, element.x, element.y)}
        aria-label={`Office: ${element.label ?? "Office"}`}
      >
        <DoorOpen size={12} className="text-blue-600 flex-shrink-0" />
        <span className="whitespace-nowrap">{element.label ?? "Office"}</span>
      </button>
    );
  }

  return null;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface InfoTooltipProps {
  element: SceneElement;
  x: number;
  y: number;
  onClose: () => void;
}

function InfoTooltip({ element, x, y, onClose }: InfoTooltipProps) {
  const isOffice = element.type === "OFFICE_LABEL";

  // Anchor tooltip above the marker; clamp so it doesn't bleed off edges.
  // x/y are 0-1 normalized — convert to % and offset upward.
  const left = `clamp(120px, ${x * 100}%, calc(100% - 120px))`;
  const top = `clamp(8px, calc(${y * 100}% - 56px), calc(100% - 80px))`;

  return (
    <div
      className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-52"
      style={{ left, top, transform: "translateX(-50%)" }}
      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {isOffice ? element.label ?? "Office" : element.label ?? "Information"}
          </p>
          {isOffice && (
            <p className="text-xs text-gray-500 mt-0.5">Office</p>
          )}
          {!isOffice && element.label && (
            <p className="text-xs text-gray-500 mt-1">{element.label}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
