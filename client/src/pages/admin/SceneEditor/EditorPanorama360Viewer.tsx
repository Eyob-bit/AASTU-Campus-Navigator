import { useEffect, useRef, useState } from "react";
import { EquirectGeometry, ImageUrlSource, RectilinearView, Viewer } from "marzipano";
import { Loader2 } from "lucide-react";
import type { SceneElement, SceneElementType } from "@/types";
import type { DraftElement } from "./ElementPropertyPanel";
import { cn } from "@/utils/cn";

interface EditorPanorama360ViewerProps {
  imageUrl: string;
  isPlacingElement?: boolean;
  onClick?: (x: number, y: number) => void;
  onBgMouseDown?: () => void;
  elements: SceneElement[];
  selectedElementId: string | null;
  draft: DraftElement | null;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

const COLOUR_MAP: Record<SceneElementType, string> = {
  ARROW: "bg-blue-600 border-blue-400 text-white",
  OFFICE_LABEL: "bg-emerald-600 border-emerald-400 text-white",
  INFORMATION: "bg-amber-500 border-amber-300 text-white",
};

const SELECTED_RING: Record<SceneElementType, string> = {
  ARROW: "ring-2 ring-blue-300 ring-offset-2 ring-offset-black/50",
  OFFICE_LABEL: "ring-2 ring-emerald-300 ring-offset-2 ring-offset-black/50",
  INFORMATION: "ring-2 ring-amber-300 ring-offset-2 ring-offset-black/50",
};

export function EditorPanorama360Viewer({
  imageUrl,
  isPlacingElement = false,
  onClick,
  onBgMouseDown,
  elements,
  selectedElementId,
  draft,
  onSelect,
  onDragEnd,
}: EditorPanorama360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const viewRef = useRef<RectilinearView | null>(null);

  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [marzipanoError, setMarzipanoError] = useState<string | null>(null);

  // Handle cross-origin image resolution (e.g. Cloudinary) via blob URL
  useEffect(() => {
    if (!imageUrl) {
      setResolvedImageUrl(null);
      return;
    }

    const isExternal = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
    if (!isExternal) {
      setResolvedImageUrl(imageUrl);
      return;
    }

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

  // Store current props in refs for event handlers to avoid stale closures
  const isPlacingRef = useRef(isPlacingElement);
  isPlacingRef.current = isPlacingElement;

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const onBgMouseDownRef = useRef(onBgMouseDown);
  onBgMouseDownRef.current = onBgMouseDown;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  // Initialize Marzipano Viewer
  useEffect(() => {
    if (!containerRef.current || !resolvedImageUrl) return;

    let isMounted = true;
    containerRef.current.innerHTML = "";

    const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;

    try {
      const viewer = new Viewer(containerRef.current);
      const source = ImageUrlSource.fromString(resolvedImageUrl);
      const width = isMobile ? 2048 : 4096;
      const geometry = new EquirectGeometry([{ width }]);
      const view = new RectilinearView({ yaw: 0, pitch: 0, fov: 1.2 });
      const scene = viewer.createScene({ source, geometry, view });
      scene.switchTo();

      if (isMounted) {
        viewerRef.current = viewer;
        viewRef.current = view;
        setMarzipanoError(null);
      }
    } catch (err) {
      console.warn("Marzipano 360° viewer error:", err);
      if (isMounted) {
        setMarzipanoError("Failed to load 360° WebGL view.");
      }
    }

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (_) {}
        viewerRef.current = null;
        viewRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [resolvedImageUrl]);

  // Handle clicking the 360 panorama canvas for element placement or bg selection clear
  function handleContainerClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current || !viewRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const coords = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const spherical = viewRef.current.screenToCoordinates(coords);

    if (isPlacingRef.current && onClickRef.current && spherical) {
      const x = Math.max(0, Math.min(1, spherical.yaw / (2 * Math.PI) + 0.5));
      const y = Math.max(0, Math.min(1, spherical.pitch / Math.PI + 0.5));
      onClickRef.current(x, y);
    } else if (!isPlacingRef.current) {
      onBgMouseDownRef.current?.();
    }
  }

  // Mount/update Marzipano Hotspots whenever elements, selectedElementId, or draft change
  useEffect(() => {
    if (!viewerRef.current || !containerRef.current) return;

    // Get active scene from Marzipano viewer instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeScene = (viewerRef.current as any)._scene;
    if (!activeScene) return;

    const hotspotContainer = activeScene.hotspotContainer();
    // Clear existing hotspots
    const containerDom = containerRef.current.querySelector(".marzipano-hotspot-container") || containerRef.current;

    // Remove old element DOM nodes created by hotspots
    const oldHotspots = containerDom.querySelectorAll("[data-editor-hotspot]");
    oldHotspots.forEach((node) => node.remove());

    // Helper to create and attach hotspot DOM node
    const renderHotspot = (
      id: string,
      type: SceneElementType,
      x: number,
      y: number,
      label: string | null,
      rotation: number | null,
      isSelected: boolean,
      isDraft: boolean
    ) => {
      const yaw = (x - 0.5) * 2 * Math.PI;
      const pitch = (y - 0.5) * Math.PI;

      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-editor-hotspot", id);
      wrapper.className = cn(
        "pointer-events-auto select-none transition-transform z-30",
        isDraft ? "cursor-default" : "cursor-grab active:cursor-grabbing hover:scale-110"
      );

      // Stop Marzipano from handling drag/pan when interacting with hotspots
      const stopProp = (e: Event) => {
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      };
      wrapper.addEventListener("pointerdown", stopProp);
      wrapper.addEventListener("touchstart", stopProp);

      if (isDraft) {
        wrapper.innerHTML = `
          <div class="relative -translate-x-1/2 -translate-y-1/2">
            <span class="w-8 h-8 rounded-full border-2 border-dashed border-white bg-black/40 flex items-center justify-center animate-pulse shadow-lg">
              <span class="w-2 h-2 rounded-full bg-white"></span>
            </span>
          </div>
        `;
      } else {
        const colour = COLOUR_MAP[type] || "bg-blue-600 border-blue-400 text-white";
        const ring = isSelected ? SELECTED_RING[type] : "";
        const displayLabel = label ?? type;
        const rotateStyle = rotation ? `transform: rotate(${rotation}deg);` : "";

        wrapper.innerHTML = `
          <div class="flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2">
            <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${colour} ${ring}">
              <div style="${rotateStyle}" class="flex items-center justify-center">
                ${
                  type === "ARROW"
                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`
                    : type === "OFFICE_LABEL"
                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12h12"/><path d="M6 7h12"/><path d="M6 17h12"/></svg>`
                    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
                }
              </div>
            </div>
            ${
              displayLabel !== type
                ? `<span class="text-[10px] font-semibold text-white bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded shadow whitespace-nowrap max-w-[90px] truncate">${displayLabel}</span>`
                : ""
            }
          </div>
        `;

        // Handle dragging marker in 360 space
        let dragOrigin: { mx: number; my: number; startX: number; startY: number } | null = null;
        let isDragging = false;

        const handleMouseDown = (e: MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          dragOrigin = { mx: e.clientX, my: e.clientY, startX: x, startY: y };
          isDragging = false;

          const onMouseMove = (me: MouseEvent) => {
            if (!dragOrigin || !containerRef.current || !viewRef.current) return;
            const dist = Math.abs(me.clientX - dragOrigin.mx) + Math.abs(me.clientY - dragOrigin.my);
            if (dist > 4) isDragging = true;

            const rect = containerRef.current.getBoundingClientRect();
            const coords = { x: me.clientX - rect.left, y: me.clientY - rect.top };
            const spherical = viewRef.current.screenToCoordinates(coords);

            if (spherical && hotspotRef) {
              hotspotRef.setCoordinates({ yaw: spherical.yaw, pitch: spherical.pitch });
            }
          };

          const onMouseUp = (me: MouseEvent) => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            if (!dragOrigin) return;

            if (!isDragging) {
              onSelectRef.current(id);
            } else if (containerRef.current && viewRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const coords = { x: me.clientX - rect.left, y: me.clientY - rect.top };
              const spherical = viewRef.current.screenToCoordinates(coords);
              if (spherical) {
                const nx = Math.max(0, Math.min(1, spherical.yaw / (2 * Math.PI) + 0.5));
                const ny = Math.max(0, Math.min(1, spherical.pitch / Math.PI + 0.5));
                onDragEndRef.current(id, nx, ny);
              }
            }
            dragOrigin = null;
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        };

        wrapper.addEventListener("mousedown", handleMouseDown);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hotspotRef: any = hotspotContainer.createHotspot(wrapper, { yaw, pitch });
    };

    // Render draft hotspot if present
    if (draft) {
      renderHotspot("draft", draft.type, draft.x, draft.y, null, null, false, true);
    }

    // Render existing elements as hotspots
    elements.forEach((el) => {
      renderHotspot(
        el.id,
        el.type,
        el.x,
        el.y,
        el.label,
        el.rotation,
        el.id === selectedElementId,
        false
      );
    });
  }, [elements, selectedElementId, draft]);

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        "relative w-full h-full min-h-[420px] overflow-hidden rounded-xl border border-gray-200 bg-gray-950 select-none",
        isPlacingElement ? "cursor-crosshair" : "cursor-default"
      )}
    >
      {/* Marzipano 360 Container */}
      <div ref={containerRef} className="w-full h-full min-h-[420px]" />

      {/* Loading overlay */}
      {imageLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-sm text-indigo-400">
          <Loader2 size={32} className="animate-spin mb-2" />
          <span className="text-xs font-medium text-slate-300">Loading 360° environment…</span>
        </div>
      )}

      {marzipanoError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
          {marzipanoError}
        </div>
      )}
    </div>
  );
}
