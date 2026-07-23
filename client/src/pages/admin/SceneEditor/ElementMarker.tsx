import { useRef, useEffect } from "react";
import { ArrowRight, Building2, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import type { SceneElement, SceneElementType } from "@/types";

interface ElementMarkerProps {
  element:    SceneElement;
  isSelected: boolean;
  onSelect:   () => void;
  /** Called with new 0–1 normalised coords only after the drag is released */
  onDragEnd:  (x: number, y: number) => void;
}

const ICON_MAP: Record<SceneElementType, React.ElementType> = {
  ARROW:        ArrowRight,
  OFFICE_LABEL: Building2,
  INFORMATION:  Info,
};

const COLOUR_MAP: Record<SceneElementType, string> = {
  ARROW:        "bg-blue-600   border-blue-400   text-white",
  OFFICE_LABEL: "bg-emerald-600 border-emerald-400 text-white",
  INFORMATION:  "bg-amber-500   border-amber-300   text-white",
};

const SELECTED_RING: Record<SceneElementType, string> = {
  ARROW:        "ring-2 ring-blue-300",
  OFFICE_LABEL: "ring-2 ring-emerald-300",
  INFORMATION:  "ring-2 ring-amber-300",
};

/**
 * A single interactive marker placed on the equirectangular viewer.
 *
 * Positioning: absolute, centred on (x*100%, y*100%).
 * Dragging:    tracked via document-level mouse events so the drag
 *              continues even when the cursor leaves the marker.
 * Clicking:    fires onSelect if the pointer moved < 4px (not a drag).
 */
export function ElementMarker({
  element,
  isSelected,
  onSelect,
  onDragEnd,
}: ElementMarkerProps) {
  const Icon       = ICON_MAP[element.type];
  const colour     = COLOUR_MAP[element.type];
  const ring       = isSelected ? SELECTED_RING[element.type] : "";
  const dragOrigin = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null);
  const buttonRef  = useRef<HTMLButtonElement>(null);

  // Keep track of event listeners for unmount cleanup
  const onMouseMoveRef = useRef<((me: MouseEvent) => void) | null>(null);
  const onMouseUpRef   = useRef<((me: MouseEvent) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (onMouseMoveRef.current) {
        document.removeEventListener("mousemove", onMouseMoveRef.current);
      }
      if (onMouseUpRef.current) {
        document.removeEventListener("mouseup", onMouseUpRef.current);
      }
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();   // don't bubble to the panorama click handler
    e.preventDefault();

    const container = (e.currentTarget.closest("[data-panorama-container]")) as HTMLElement | null;
    if (!container) { onSelect(); return; }

    const rect = container.getBoundingClientRect();
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ex: element.x, ey: element.y };

    function onMove(me: MouseEvent) {
      if (!dragOrigin.current) return;
      const dx = (me.clientX - dragOrigin.current.mx) / rect.width;
      const dy = (me.clientY - dragOrigin.current.my) / rect.height;
      // Visual feedback via CSS transform while dragging — no state update
      const el = buttonRef.current;
      if (el) {
        const nx = Math.max(0, Math.min(1, dragOrigin.current.ex + dx)) * 100;
        const ny = Math.max(0, Math.min(1, dragOrigin.current.ey + dy)) * 100;
        el.style.left = `${nx}%`;
        el.style.top  = `${ny}%`;
      }
    }

    function onUp(me: MouseEvent) {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
      onMouseMoveRef.current = null;
      onMouseUpRef.current = null;
      if (!dragOrigin.current) return;

      const totalDelta = Math.abs(me.clientX - dragOrigin.current.mx) +
                         Math.abs(me.clientY - dragOrigin.current.my);
      if (totalDelta < 4) {
        onSelect();  // treat as a click, not a drag
      } else {
        const dx = (me.clientX - dragOrigin.current.mx) / rect.width;
        const dy = (me.clientY - dragOrigin.current.my) / rect.height;
        const nx = Math.max(0, Math.min(1, dragOrigin.current.ex + dx));
        const ny = Math.max(0, Math.min(1, dragOrigin.current.ey + dy));
        onDragEnd(nx, ny);
      }
      dragOrigin.current = null;
    }

    onMouseMoveRef.current = onMove;
    onMouseUpRef.current = onUp;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }

  const label = element.label ?? element.type;

  return (
    <button
      ref={buttonRef}
      id={`marker-${element.id}`}
      onMouseDown={handleMouseDown}
      title={label}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2",
        "flex flex-col items-center gap-0.5",
        "pointer-events-auto cursor-grab active:cursor-grabbing",
        "focus:outline-none"
      )}
      style={{
        left:        `${element.x * 100}%`,
        top:         `${element.y * 100}%`,
        transform:   element.rotation
          ? `translate(-50%, -50%) rotate(${element.rotation}deg)`
          : "translate(-50%, -50%)",
      }}
    >
      <span
        className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg",
          colour, ring,
        )}
      >
        <Icon size={14} />
      </span>
      {label !== element.type && (
        <span className="text-[10px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap max-w-[80px] truncate">
          {label}
        </span>
      )}
    </button>
  );
}
