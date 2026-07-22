import { useEffect, useRef, useState } from "react";
import { EquirectGeometry, ImageUrlSource, RectilinearView, Viewer } from "marzipano";
import { Eye, Compass } from "lucide-react";
import type { SceneElement } from "@/types";
import { getNeonChevronArrowHtml } from "@/components/common";

interface EditorPanoramaViewerProps {
  imageUrl: string;
  elements?: SceneElement[];
  selectedElementId?: string | null;
  onSelectElement?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onClick?: (x: number, y: number) => void;
  onBgMouseDown?: () => void;
  isPlacingElement?: boolean;
  children?: React.ReactNode;
}

export function EditorPanoramaViewer({
  imageUrl,
  elements = [],
  selectedElementId,
  onSelectElement,
  onDragEnd,
  onClick,
  onBgMouseDown,
  isPlacingElement = false,
  children,
}: EditorPanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const viewRef = useRef<RectilinearView | null>(null);
  const [use3D, setUse3D] = useState(true); // Default to 360° Interactive Editor View
  const [marzipanoError, setMarzipanoError] = useState<string | null>(null);

  // Initialize Marzipano 360° Viewer for Scene Editor
  useEffect(() => {
    if (!use3D || !containerRef.current || !imageUrl) return;

    let isMounted = true;
    containerRef.current.innerHTML = "";

    try {
      const viewer = new Viewer(containerRef.current);
      const source = ImageUrlSource.fromString(imageUrl);
      const geometry = new EquirectGeometry([{ tileSize: 1024, size: 4096 }]);
      const view = new RectilinearView({ yaw: 0, pitch: 0, fov: 1.2 });
      const scene = viewer.createScene({ source, geometry, view });
      scene.switchTo();

      viewRef.current = view;

      // Register 3D Spherical Hotspots on Marzipano scene
      const hotspotContainer = scene.hotspotContainer();

      elements.forEach((el) => {
        if (!el.isVisible) return;

        // Convert normalized 0..1 equirectangular image coordinates to spherical radians (yaw, pitch)
        const initialYaw = (el.x - 0.5) * 2 * Math.PI;
        const initialPitch = (el.y - 0.5) * Math.PI;
        const isSelected = el.id === selectedElementId;

        const wrapper = document.createElement("div");
        wrapper.className = `pointer-events-auto cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-110 z-30 ${
          isSelected ? "ring-4 ring-cyan-400 ring-offset-2 rounded-xl" : ""
        }`;

        const hotspot = hotspotContainer.createHotspot(wrapper, { yaw: initialYaw, pitch: initialPitch });

        if (el.type === "ARROW") {
          wrapper.innerHTML = getNeonChevronArrowHtml(el.rotation ?? 0);
        } else if (el.type === "OFFICE_LABEL") {
          wrapper.innerHTML = `
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
              isSelected ? "bg-indigo-600 text-white" : "bg-white/95 text-gray-900"
            } backdrop-blur-md border border-white/80 text-xs font-bold shadow-2xl transition-all cursor-grab">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#ffffff' : '#4f46e5'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg>
              <span class="whitespace-nowrap">${el.label || "Office"}</span>
            </div>
          `;
        } else if (el.type === "INFORMATION") {
          wrapper.innerHTML = `
            <div class="w-8 h-8 rounded-full ${
              isSelected ? "bg-amber-600" : "bg-amber-500/95"
            } border-2 border-white/90 backdrop-blur-md flex items-center justify-center text-white shadow-xl transition-all font-bold text-xs cursor-grab">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
          `;
        }

        // ── 360° Real-Time Drag and Drop Event Handlers ────────────────────────
        let isDragging = false;
        let startClientX = 0;
        let startClientY = 0;

        const onPointerDown = (pe: PointerEvent) => {
          pe.stopPropagation();
          if (pe.stopImmediatePropagation) pe.stopImmediatePropagation();
          isDragging = false;
          startClientX = pe.clientX;
          startClientY = pe.clientY;
          onSelectElement?.(el.id);

          const onPointerMove = (me: PointerEvent) => {
            const deltaX = Math.abs(me.clientX - startClientX);
            const deltaY = Math.abs(me.clientY - startClientY);
            if (deltaX > 4 || deltaY > 4) {
              isDragging = true;
            }

            if (isDragging && containerRef.current && viewRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const cx = me.clientX - rect.left;
              const cy = me.clientY - rect.top;
              try {
                const coords = viewRef.current.screenToCoordinates({ x: cx, y: cy });
                if (coords && typeof coords.yaw === "number" && typeof coords.pitch === "number") {
                  hotspot.setPosition({ yaw: coords.yaw, pitch: coords.pitch });
                }
              } catch (_) {}
            }
          };

          const onPointerUp = (ue: PointerEvent) => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);

            if (isDragging && containerRef.current && viewRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const cx = ue.clientX - rect.left;
              const cy = ue.clientY - rect.top;
              try {
                const coords = viewRef.current.screenToCoordinates({ x: cx, y: cy });
                if (coords && typeof coords.yaw === "number" && typeof coords.pitch === "number") {
                  let normX = (coords.yaw / (2 * Math.PI)) + 0.5;
                  let normY = (coords.pitch / Math.PI) + 0.5;
                  normX = ((normX % 1) + 1) % 1;
                  normY = Math.max(0, Math.min(1, normY));
                  onDragEnd?.(el.id, normX, normY);
                }
              } catch (_) {}
            }
          };

          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", onPointerUp);
        };

        wrapper.addEventListener("pointerdown", onPointerDown);
      });

      // Track clicks vs camera pan drags on Marzipano canvas
      let startCanvasX = 0;
      let startCanvasY = 0;

      const handleCanvasPointerDown = (pe: PointerEvent) => {
        startCanvasX = pe.clientX;
        startCanvasY = pe.clientY;
      };

      const handleCanvasPointerUp = (pe: PointerEvent) => {
        const deltaX = Math.abs(pe.clientX - startCanvasX);
        const deltaY = Math.abs(pe.clientY - startCanvasY);

        if (deltaX < 5 && deltaY < 5) {
          if (containerRef.current && viewRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const cx = pe.clientX - rect.left;
            const cy = pe.clientY - rect.top;
            try {
              const coords = viewRef.current.screenToCoordinates({ x: cx, y: cy });
              if (coords && typeof coords.yaw === "number" && typeof coords.pitch === "number") {
                let normX = (coords.yaw / (2 * Math.PI)) + 0.5;
                let normY = (coords.pitch / Math.PI) + 0.5;
                normX = ((normX % 1) + 1) % 1;
                normY = Math.max(0, Math.min(1, normY));
                onClick?.(normX, normY);
                return;
              }
            } catch (_) {}
          }
          onBgMouseDown?.();
        }
      };

      const cEl = containerRef.current;
      cEl.addEventListener("pointerdown", handleCanvasPointerDown);
      cEl.addEventListener("pointerup", handleCanvasPointerUp);

      if (isMounted) {
        viewerRef.current = viewer;
        setMarzipanoError(null);
      }
    } catch (err) {
      console.warn("Marzipano 360° editor viewer error:", err);
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
      viewRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [imageUrl, use3D, elements, selectedElementId, onSelectElement, onDragEnd, onClick, onBgMouseDown]);

  function handle2DMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (isPlacingElement && onClick) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      onClick(
        Math.max(0, Math.min(1, x)),
        Math.max(0, Math.min(1, y))
      );
    } else {
      onBgMouseDown?.();
    }
  }

  return (
    <div className="relative w-full h-full min-h-[300px] flex-1 overflow-hidden rounded-xl sm:rounded-2xl border border-gray-800 bg-gray-950 select-none flex flex-col items-center justify-center">
      {/* 360° / 2D Mode Toggle Control */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-1 shadow-2xl">
        <button
          type="button"
          onClick={() => setUse3D(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            use3D
              ? "bg-indigo-600 text-white shadow-md"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title="360° Interactive Spherical Panorama (Drag & Drop or Click to place elements in 3D space)"
        >
          <Compass size={14} />
          <span>360° Editor</span>
        </button>
        <button
          type="button"
          onClick={() => setUse3D(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            !use3D
              ? "bg-indigo-600 text-white shadow-md"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title="Static 2D Equirectangular Layout"
        >
          <Eye size={14} />
          <span>2D Layout</span>
        </button>
      </div>

      {marzipanoError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">
          {marzipanoError}
        </div>
      )}

      {/* Mode 1: 360° Interactive Spherical Panorama Editor */}
      {use3D ? (
        <div
          className="relative w-full h-full"
          style={{ cursor: isPlacingElement ? "crosshair" : "grab" }}
        >
          <div ref={containerRef} className="w-full h-full" />
        </div>
      ) : (
        /* Mode 2: Flat Equirectangular 2D Image Editor (2:1 aspect ratio) */
        <div
          onMouseDown={handle2DMouseDown}
          className="relative w-full max-h-full overflow-hidden rounded-xl bg-gray-900"
          style={{
            aspectRatio: "2 / 1",
            cursor: isPlacingElement ? "crosshair" : "default",
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
