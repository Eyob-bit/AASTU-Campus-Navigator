import { useEffect, useRef, useState } from "react";
import { EquirectGeometry, ImageUrlSource, RectilinearView, Viewer } from "marzipano";
import type { Scene } from "marzipano";
import { Loader2 } from "lucide-react";
import type { SceneElement, SceneElementType } from "@/types";
import type { DraftElement } from "./ElementPropertyPanel";
import { cn } from "@/utils/cn";

// ── Coordinate helpers ────────────────────────────────────────────────────────
// Match the convention used in ScenePreviewViewer (the working production viewer):
//   yaw   = (x - 0.5) * 2π
//   pitch = (y - 0.5) * π
function xyToSpherical(x: number, y: number) {
  return {
    yaw:   (x - 0.5) * 2 * Math.PI,
    pitch: (y - 0.5) * Math.PI,
  };
}
function sphericalToXY(yaw: number, pitch: number) {
  // Normalize yaw into [-π, π] range so full 360° rotational panning wraps correctly
  let normYaw = (yaw + Math.PI) % (2 * Math.PI);
  if (normYaw < 0) normYaw += 2 * Math.PI;
  normYaw -= Math.PI;

  const normPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

  return {
    x: Math.max(0, Math.min(1, normYaw / (2 * Math.PI) + 0.5)),
    y: Math.max(0, Math.min(1, normPitch / Math.PI + 0.5)),
  };
}

interface EditorPanorama360ViewerProps {
  imageUrl: string;
  isPlacingElement?: boolean;
  onClick?: (x: number, y: number) => void;
  onBgClick?: () => void;
  elements: SceneElement[];
  selectedElementId: string | null;
  draft: DraftElement | null;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export function EditorPanorama360Viewer({
  imageUrl,
  isPlacingElement = false,
  onClick,
  onBgClick,
  elements,
  selectedElementId,
  draft,
  onSelect,
  onDragEnd,
}: EditorPanorama360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Viewer | null>(null);
  const viewRef      = useRef<RectilinearView | null>(null);
  const sceneRef     = useRef<Scene | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hotspotsRef  = useRef<Map<string, any>>(new Map()); // id → Marzipano Hotspot instance

  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoading,     setImageLoading]     = useState(false);
  const [marzipanoError,   setMarzipanoError]   = useState<string | null>(null);
  const [viewerReady,      setViewerReady]      = useState(0);

  // Set to true by a hotspot's native mousedown so React's synthetic onMouseDown
  // on the container skips background handling (React events fire after native DOM).
  const hotspotClickedRef = useRef(false);
  const bgDragOrigin      = useRef<{ x: number; y: number } | null>(null);

  // ── Cross-origin image resolution ────────────────────────────────────────────
  useEffect(() => {
    if (!imageUrl) { setResolvedImageUrl(null); return; }

    const isExternal = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
    if (!isExternal) { setResolvedImageUrl(imageUrl); return; }

    let blobUrl: string | null = null;
    let cancelled = false;
    setImageLoading(true);
    setResolvedImageUrl(null);

    fetch(imageUrl, { mode: "cors", cache: "force-cache" })
      .then((res) => { if (!res.ok) throw new Error("fetch failed"); return res.blob(); })
      .then((blob) => { if (!cancelled) { blobUrl = URL.createObjectURL(blob); setResolvedImageUrl(blobUrl); } })
      .catch(() => { if (!cancelled) setResolvedImageUrl(imageUrl); })
      .finally(() => { if (!cancelled) setImageLoading(false); });

    return () => {
      cancelled = true;
      setImageLoading(false);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [imageUrl]);

  // ── Keep callback refs fresh ─────────────────────────────────────────────────
  const isPlacingRef = useRef(isPlacingElement);
  isPlacingRef.current = isPlacingElement;
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  const onBgClickRef = useRef(onBgClick);
  onBgClickRef.current = onBgClick;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  const selectedElementIdRef = useRef(selectedElementId);
  selectedElementIdRef.current = selectedElementId;

  // ── Initialize Marzipano Viewer ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !resolvedImageUrl) return;

    let isMounted = true;
    containerRef.current.innerHTML = "";
    sceneRef.current = null;
    hotspotsRef.current.clear();

    const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;

    try {
      const viewer   = new Viewer(containerRef.current);
      const source   = ImageUrlSource.fromString(resolvedImageUrl);
      const width    = isMobile ? 2048 : 4096;
      const geometry = new EquirectGeometry([{ width }]);
      const view     = new RectilinearView({ yaw: 0, pitch: 0, fov: 1.2 });
      const scene    = viewer.createScene({ source, geometry, view });
      scene.switchTo();

      if (isMounted) {
        viewerRef.current = viewer;
        viewRef.current   = view;
        sceneRef.current  = scene;
        setMarzipanoError(null);
        setViewerReady((n) => n + 1);
      }
    } catch (err) {
      console.warn("Marzipano 360° viewer error:", err);
      if (isMounted) setMarzipanoError("Failed to load 360° WebGL view.");
    }

    return () => {
      isMounted = false;
      hotspotsRef.current.clear();
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch (_) {}
        viewerRef.current = null;
        viewRef.current   = null;
        sceneRef.current  = null;
      }
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [resolvedImageUrl]);

  // ── Mount / update 3-D hotspots ──────────────────────────────────────────────
  // Key design: we NEVER destroy and recreate hotspots just because selectedElementId
  // changed — that caused visible "leaving" of position. Instead:
  //   • element added/removed → create/destroy only that hotspot
  //   • element moved (x/y changed) → call setCoordinates on existing hotspot
  //   • selection changed → update ring styling in the DOM only
  //   • draft changed → update the draft hotspot
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const hotspotContainer = scene.hotspotContainer();

    // ── Helper: build a hotspot DOM element ──────────────────────────────────
    const buildWrapper = (
      id: string,
      type: SceneElementType,
      x: number,
      y: number,
      label: string | null,
      rotation: number | null,
      isSelected: boolean,
      isDraft: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): { wrapper: HTMLDivElement; hotspotInstance: any } => {
      const { yaw, pitch } = xyToSpherical(x, y);

      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-editor-hotspot", id);
      // No position style — let Marzipano fully control placement
      wrapper.style.cssText = "pointer-events:auto; user-select:none; z-index:30;";

      if (isDraft) {
        wrapper.innerHTML = `
          <div style="
            transform:translate(-50%,-50%);
            width:2rem; height:2rem; border-radius:50%;
            border:2px dashed white; background:rgba(0,0,0,0.4);
            display:flex; align-items:center; justify-content:center;
            animation:editorPulse 1.5s ease-in-out infinite;
          ">
            <div style="width:0.5rem;height:0.5rem;border-radius:50%;background:white;"></div>
          </div>
        `;
        ["pointerdown","mousedown","touchstart","click"].forEach((evt) =>
          wrapper.addEventListener(evt, (e) => { e.stopPropagation(); e.stopImmediatePropagation(); })
        );
        const hp = hotspotContainer.createHotspot(wrapper, { yaw, pitch });
        return { wrapper, hotspotInstance: hp };
      }

      // Saved element
      const bgColour =
        type === "ARROW"        ? "#2563eb" :
        type === "OFFICE_LABEL" ? "#059669" : "#f59e0b";

      const borderColour =
        type === "ARROW"        ? "#60a5fa" :
        type === "OFFICE_LABEL" ? "#34d399" : "#fcd34d";

      const ringStyle = isSelected
        ? `box-shadow:0 0 0 3px ${borderColour}, 0 0 0 5px rgba(0,0,0,0.35);`
        : "";

      const rotateStyle = rotation ? `transform:rotate(${rotation}deg);` : "";

      const svgIcon =
        type === "ARROW"
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`
          : type === "OFFICE_LABEL"
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12h12"/><path d="M6 7h12"/><path d="M6 17h12"/></svg>`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

      const displayLabel = label ?? "";
      const labelHtml = displayLabel
        ? `<span style="
              margin-top:2px; font-size:10px; font-weight:600; color:white;
              background:rgba(0,0,0,0.75); backdrop-filter:blur(4px);
              padding:1px 7px; border-radius:4px; white-space:nowrap;
              max-width:110px; overflow:hidden; text-overflow:ellipsis; display:block;
            ">${displayLabel}</span>`
        : "";

      wrapper.innerHTML = `
        <div data-inner="1" style="
          transform:translate(-50%,-50%);
          display:flex; flex-direction:column; align-items:center; gap:2px;
          cursor:grab;
        ">
          <div data-circle="1" style="
            width:2rem; height:2rem; border-radius:50%;
            border:2px solid ${borderColour}; background:${bgColour};
            display:flex; align-items:center; justify-content:center;
            box-shadow:0 2px 10px rgba(0,0,0,0.55);
            transition:transform 0.12s, box-shadow 0.12s;
            ${ringStyle}
          ">
            <div style="${rotateStyle} display:flex; align-items:center; justify-content:center;">
              ${svgIcon}
            </div>
          </div>
          ${labelHtml}
        </div>
      `;

      let dragOrigin: { mx: number; my: number } | null = null;
      let isDragging = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let hotspotInstance: any = null;

      const handleMouseDown = (e: MouseEvent) => {
        hotspotClickedRef.current = true;
        e.stopPropagation();
        e.preventDefault();

        dragOrigin = { mx: e.clientX, my: e.clientY };
        isDragging = false;

        const onMouseMove = (me: MouseEvent) => {
          if (!dragOrigin || !containerRef.current || !viewRef.current) return;
          const dist = Math.abs(me.clientX - dragOrigin.mx) + Math.abs(me.clientY - dragOrigin.my);
          if (dist > 6) {
            isDragging = true;
            if (hotspotInstance && typeof hotspotInstance.setCoordinates === "function") {
              const rect = containerRef.current.getBoundingClientRect();
              const sph  = viewRef.current.screenToCoordinates({ x: me.clientX - rect.left, y: me.clientY - rect.top });
              if (sph) hotspotInstance.setCoordinates({ yaw: sph.yaw, pitch: sph.pitch });
            }
          }
        };

        const onMouseUp = (me: MouseEvent) => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup",   onMouseUp);
          if (!dragOrigin) return;

          if (!isDragging) {
            onSelectRef.current(id);
          } else if (containerRef.current && viewRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const sph  = viewRef.current.screenToCoordinates({ x: me.clientX - rect.left, y: me.clientY - rect.top });
            if (sph) {
              const { x: nx, y: ny } = sphericalToXY(sph.yaw, sph.pitch);
              onDragEndRef.current(id, nx, ny);
            }
          }
          dragOrigin = null;
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup",   onMouseUp);
      };

      wrapper.addEventListener("pointerdown", (e) => e.stopPropagation());
      wrapper.addEventListener("touchstart",  (e) => e.stopPropagation(), { passive: true });
      wrapper.addEventListener("click",       (e) => e.stopPropagation());
      wrapper.addEventListener("mousedown",   handleMouseDown);

      hotspotInstance = hotspotContainer.createHotspot(wrapper, { yaw, pitch });
      return { wrapper, hotspotInstance };
    };

    // ── Draft hotspot ─────────────────────────────────────────────────────────
    const DRAFT_KEY = "__draft__";
    const prevDraftHp = hotspotsRef.current.get(DRAFT_KEY);

    if (draft) {
      if (prevDraftHp) {
        // Update position in place — no DOM rebuild
        const { yaw, pitch } = xyToSpherical(draft.x, draft.y);
        try { prevDraftHp.setCoordinates({ yaw, pitch }); } catch (_) {}
      } else {
        const { hotspotInstance } = buildWrapper(DRAFT_KEY, draft.type, draft.x, draft.y, null, null, false, true);
        hotspotsRef.current.set(DRAFT_KEY, hotspotInstance);
      }
    } else if (prevDraftHp) {
      try { prevDraftHp.destroy(); } catch (_) {}
      hotspotsRef.current.delete(DRAFT_KEY);
    }

    // ── Saved element hotspots ────────────────────────────────────────────────
    const incomingIds = new Set(elements.map((e) => e.id));

    // Remove hotspots for deleted elements
    for (const [id, hp] of hotspotsRef.current.entries()) {
      if (id === DRAFT_KEY) continue;
      if (!incomingIds.has(id)) {
        try { hp.destroy(); } catch (_) {}
        hotspotsRef.current.delete(id);
      }
    }

    for (const el of elements) {
      const existingHp = hotspotsRef.current.get(el.id);

      if (existingHp) {
        // ── Element already exists → update in place, never destroy/recreate ──
        // 1. Update position if coordinates changed
        const { yaw, pitch } = xyToSpherical(el.x, el.y);
        try { existingHp.setCoordinates({ yaw, pitch }); } catch (_) {}

        // 2. Update ring (selection highlight) in the DOM without rebuilding
        const wrapper = existingHp._element ?? containerRef.current?.querySelector(`[data-editor-hotspot="${el.id}"]`);
        if (wrapper) {
          const circle = wrapper.querySelector("[data-circle]") as HTMLElement | null;
          if (circle) {
            const borderColour =
              el.type === "ARROW"        ? "#60a5fa" :
              el.type === "OFFICE_LABEL" ? "#34d399" : "#fcd34d";
            circle.style.boxShadow = el.id === selectedElementId
              ? `0 0 0 3px ${borderColour}, 0 0 0 5px rgba(0,0,0,0.35)`
              : "0 2px 10px rgba(0,0,0,0.55)";
          }
        }
      } else {
        // ── New element → create fresh hotspot ────────────────────────────────
        const isSelected = el.id === selectedElementId;
        const { hotspotInstance } = buildWrapper(el.id, el.type, el.x, el.y, el.label, el.rotation, isSelected, false);
        hotspotsRef.current.set(el.id, hotspotInstance);
      }
    }

  // Re-run when viewer initializes OR elements list changes OR selection changes.
  // selectedElementId triggers only lightweight DOM ring updates (no hotspot rebuild).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerReady, elements, selectedElementId, draft]);

  // ── Background interaction ────────────────────────────────────────────────────
  function handleBgMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (hotspotClickedRef.current) {
      hotspotClickedRef.current = false;
      return;
    }
    bgDragOrigin.current = { x: e.clientX, y: e.clientY };
  }

  function handleBgMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (!bgDragOrigin.current || !containerRef.current || !viewRef.current) return;

    const dx = Math.abs(e.clientX - bgDragOrigin.current.x);
    const dy = Math.abs(e.clientY - bgDragOrigin.current.y);
    bgDragOrigin.current = null;

    if (dx > 8 || dy > 8) return; // panning gesture — ignore

    if (isPlacingRef.current && onClickRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const sph  = viewRef.current.screenToCoordinates({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      if (sph) {
        const { x, y } = sphericalToXY(sph.yaw, sph.pitch);
        onClickRef.current(x, y);
      }
    } else if (!isPlacingRef.current) {
      onBgClickRef.current?.();
    }
  }

  return (
    <div
      onMouseDown={handleBgMouseDown}
      onMouseUp={handleBgMouseUp}
      className={cn(
        "relative w-full h-full min-h-[420px] overflow-hidden rounded-xl border border-gray-200 bg-gray-950 select-none",
        isPlacingElement ? "cursor-crosshair" : "cursor-default"
      )}
    >
      <div ref={containerRef} className="w-full h-full min-h-[420px]" />

      <style>{`
        @keyframes editorPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

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
