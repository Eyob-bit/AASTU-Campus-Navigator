import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { EquirectGeometry, ImageUrlSource, RectilinearView, Viewer } from "marzipano";
import { Info, DoorOpen, Eye, Compass, Loader2 } from "lucide-react";
import type { SceneElement } from "@/types";
import { NeonChevronArrow, getNeonChevronArrowHtml } from "@/components/common";

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
  const [use3D, setUse3D] = useState(true); // Default to 360° Interactive View
  const [marzipanoError, setMarzipanoError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ element: SceneElement; x: number; y: number } | null>(null);

  // Resolved URL — cross-origin Cloudinary URLs are converted to blob URLs
  // so WebGL can use them as textures without CORS restrictions.
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setResolvedImageUrl(null);
      return;
    }

    const isExternal = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");

    if (!isExternal) {
      // Same-origin path — no CORS issue, use directly
      setResolvedImageUrl(imageUrl);
      return;
    }

    // Cross-origin (Cloudinary) — fetch as blob so WebGL can use it as a texture
    let blobUrl: string | null = null;
    let cancelled = false;
    setImageLoading(true);
    setResolvedImageUrl(null);

    fetch(imageUrl, { mode: "cors", cache: "force-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("Image fetch failed");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        setResolvedImageUrl(blobUrl);
      })
      .catch(() => {
        // Fallback: use direct URL (may still work on some browsers)
        if (!cancelled) setResolvedImageUrl(imageUrl);
      })
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });

    return () => {
      cancelled = true;
      setImageLoading(false);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [imageUrl]);

  // Initialize Marzipano 360° Viewer and mount 3D spherical hotspots
  useEffect(() => {
    if (!use3D || !containerRef.current || !resolvedImageUrl) return;

    let isMounted = true;
    containerRef.current.innerHTML = "";

    // Detect mobile to use smaller tile size (avoids GPU memory exhaustion)
    const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;

    try {
      const viewer = new Viewer(containerRef.current);
      // resolvedImageUrl is a same-origin blob URL — no WebGL CORS issues
      const source = ImageUrlSource.fromString(resolvedImageUrl);
      const tileSize = isMobile ? 512 : 1024;
      const size = isMobile ? 2048 : 4096;
      const geometry = new EquirectGeometry([{ tileSize, size }]);
      const view = new RectilinearView({ yaw: 0, pitch: 0, fov: 1.2 });
      const scene = viewer.createScene({ source, geometry, view });
      scene.switchTo();

      // Register 3D Spherical Hotspots on Marzipano scene
      const hotspotContainer = scene.hotspotContainer();

      elements.forEach((el) => {
        if (!el.isVisible) return;

        // Convert normalized 0..1 equirectangular image coordinates to spherical radians (yaw, pitch)
        const yaw = (el.x - 0.5) * 2 * Math.PI;
        const pitch = (el.y - 0.5) * Math.PI;

        const wrapper = document.createElement("div");
        wrapper.className = "pointer-events-auto cursor-pointer select-none transition-transform hover:scale-125 z-30";

        // Prevent Marzipano canvas from swallowing pointerdown/mousedown/touchstart events on hotspots
        const stopProp = (e: Event) => {
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        };
        wrapper.addEventListener("pointerdown", stopProp);
        wrapper.addEventListener("mousedown", stopProp);
        wrapper.addEventListener("touchstart", stopProp);

        if (el.type === "ARROW") {
          wrapper.innerHTML = getNeonChevronArrowHtml(el.rotation ?? 0);
          const handleArrowClick = (e: Event) => {
            e.stopPropagation();
            if (el.nextSceneId) onArrowClick(el.nextSceneId);
          };
          wrapper.addEventListener("click", handleArrowClick);
          wrapper.addEventListener("pointerup", handleArrowClick);
        } else if (el.type === "OFFICE_LABEL") {
          wrapper.innerHTML = `
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/80 text-gray-900 text-xs font-bold shadow-2xl hover:bg-white transition-all cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg>
              <span class="whitespace-nowrap">${el.label || "Office"}</span>
            </div>
          `;
          const handleOfficeClick = (e: Event) => {
            e.stopPropagation();
            setTooltip({ element: el, x: el.x, y: el.y });
          };
          wrapper.addEventListener("click", handleOfficeClick);
          wrapper.addEventListener("pointerup", handleOfficeClick);
        } else if (el.type === "INFORMATION") {
          wrapper.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-amber-500/95 border-2 border-white/90 backdrop-blur-md flex items-center justify-center text-white shadow-xl hover:bg-amber-600 transition-all font-bold text-xs cursor-pointer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
          `;
          const handleInfoClick = (e: Event) => {
            e.stopPropagation();
            setTooltip({ element: el, x: el.x, y: el.y });
          };
          wrapper.addEventListener("click", handleInfoClick);
          wrapper.addEventListener("pointerup", handleInfoClick);
        }

        hotspotContainer.createHotspot(wrapper, { yaw, pitch });
      });

      if (isMounted) {
        viewerRef.current = viewer;
        setMarzipanoError(null);
      }
    } catch (err) {
      console.warn("Marzipano 360° viewer error:", err);
      if (isMounted) {
        setMarzipanoError("360° WebGL view unavailable. Switched to 2D view.");
        setUse3D(false);
      }
    }

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (_) {}
        viewerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [resolvedImageUrl, use3D, elements, onArrowClick]);

  // Close tooltip on outside click
  useEffect(() => {
    function handleClick() {
      setTooltip(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-gray-950 select-none">
      {/* View Mode Toggle Control */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 flex items-center gap-0.5 sm:gap-1 bg-black/75 backdrop-blur-md border border-white/20 rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-2xl">
        <button
          onClick={() => setUse3D(true)}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
            use3D
              ? "bg-indigo-600 text-white shadow-md"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title="360° Interactive Spherical Panorama"
        >
          <Compass size={13} className="sm:w-4 sm:h-4" />
          <span>360° View</span>
        </button>
        <button
          onClick={() => setUse3D(false)}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
            !use3D
              ? "bg-indigo-600 text-white shadow-md"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title="Static 2D Layout (Exact Scene Editor Placement)"
        >
          <Eye size={13} className="sm:w-4 sm:h-4" />
          <span>2D Layout</span>
        </button>
      </div>

      {marzipanoError && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">
          {marzipanoError}
        </div>
      )}

      {/* Loading overlay when preparing cross-origin image blob */}
      {imageLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-sm text-cyan-400">
          <Loader2 size={32} className="animate-spin mb-2" />
          <span className="text-xs font-medium text-slate-300">Loading 360° texture…</span>
        </div>
      )}

      {/* Mode 1: 360° Spherical View with Smooth Zoom-Forward Crossfade Transition */}
      {use3D ? (
        <div className="relative w-full h-full">
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "scale(1.12)" : "scale(1)",
              filter: isTransitioning ? "blur(4px)" : "blur(0px)",
              transition: "opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), filter 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {tooltip && (
            <InfoTooltip
              element={tooltip.element}
              x={tooltip.x}
              y={tooltip.y}
              onClose={() => setTooltip(null)}
            />
          )}
        </div>
      ) : (
        /* Mode 2: Static 2D Equirectangular Image with Smooth Zoom-Forward Transition */
        <div className="relative w-full h-full flex items-center justify-center p-1 sm:p-2">
          <div
            className="relative w-full max-h-full overflow-hidden rounded-xl border border-gray-800"
            style={{
              aspectRatio: "2 / 1",
              backgroundImage: `url(${resolvedImageUrl || imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "scale(1.12)" : "scale(1)",
              filter: isTransitioning ? "blur(4px)" : "blur(0px)",
              transition: "opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), filter 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Absolute Marker Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {elements.map((el) => (
                <ElementMarker
                  key={el.id}
                  element={el}
                  onArrowClick={onArrowClick}
                  onInfoClick={(e: MouseEvent<HTMLButtonElement>, x: number, y: number) => {
                    e.stopPropagation();
                    setTooltip((prev) => (prev?.element.id === el.id ? null : { element: el, x, y }));
                  }}
                />
              ))}
            </div>

            {tooltip && (
              <InfoTooltip
                element={tooltip.element}
                x={tooltip.x}
                y={tooltip.y}
                onClose={() => setTooltip(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Individual 2D Marker Fallback ───────────────────────────────────────────

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
        className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 cursor-pointer z-10 focus:outline-none"
        style={{ left, top }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          if (element.nextSceneId) onArrowClick(element.nextSceneId);
        }}
        aria-label={`Navigate: ${element.label ?? "Next scene"}`}
        title={element.label ?? "Go to next scene"}
      >
        <NeonChevronArrow rotation={element.rotation ?? 0} size="md" />
      </button>
    );
  }

  if (element.type === "INFORMATION") {
    return (
      <button
        className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500/90 border sm:border-2 border-white/90 backdrop-blur-sm flex items-center justify-center text-white hover:bg-amber-600 hover:scale-110 transition-all duration-200 shadow-lg cursor-pointer text-xs sm:text-sm font-bold z-10"
        style={{ left, top }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => onInfoClick(e, element.x, element.y)}
        aria-label={`Info: ${element.label ?? "Information"}`}
      >
        <Info size={13} className="sm:hidden" />
        <Info size={15} className="hidden sm:block" />
      </button>
    );
  }

  if (element.type === "OFFICE_LABEL") {
    return (
      <button
        className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/90 backdrop-blur-md border border-white/80 text-gray-900 text-[10px] sm:text-xs font-semibold shadow-lg sm:shadow-xl hover:bg-white hover:scale-105 transition-all duration-200 cursor-pointer z-10"
        style={{ left, top }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => onInfoClick(e, element.x, element.y)}
        aria-label={`Office: ${element.label ?? "Office"}`}
      >
        <DoorOpen size={12} className="text-indigo-600 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
        <span className="whitespace-nowrap truncate max-w-[90px] sm:max-w-[140px]">{element.label ?? "Office"}</span>
      </button>
    );
  }

  return null;
}

// ─── Tooltip Modal ────────────────────────────────────────────────────────────

interface InfoTooltipProps {
  element: SceneElement;
  x: number;
  y: number;
  onClose: () => void;
}

function InfoTooltip({ element, x, y, onClose }: InfoTooltipProps) {
  const isOffice = element.type === "OFFICE_LABEL";

  const left = `clamp(90px, ${x * 100}%, calc(100% - 90px))`;
  const top = `clamp(8px, calc(${y * 100}% - 48px), calc(100% - 70px))`;

  return (
    <div
      className="absolute z-50 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 p-3 sm:p-4 w-44 sm:w-56 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
      style={{ left, top, transform: "translateX(-50%)" }}
      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 mb-0.5 sm:mb-1">
            {isOffice ? "Office" : "Information"}
          </span>
          <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
            {element.label ?? (isOffice ? "Office" : "Information Marker")}
          </p>
          {element.targetOfficeId && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 flex items-center gap-1">
              <DoorOpen size={11} className="text-indigo-500 flex-shrink-0" />
              Connected Office
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-base sm:text-lg leading-none flex-shrink-0 cursor-pointer p-0.5"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
