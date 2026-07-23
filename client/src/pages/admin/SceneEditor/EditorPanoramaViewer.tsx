/**
 * Flat equirectangular image viewer for the Scene Editor.
 *
 * Coordinate system:
 *   x and y are 0–1 normalised fractions of the image width/height.
 *   This matches the backend validator exactly (x: number.min(0).max(1)).
 *
 * Children (element markers) are rendered as an absolutely-positioned
 * overlay on top of the image and receive pointer events independently.
 *
 * IMPORTANT: We handle `onMouseDown` (not `onClick`) so that
 * `e.stopPropagation()` in ElementMarker.handleMouseDown correctly
 * prevents the panorama from receiving the same interaction.
 */

interface EditorPanoramaViewerProps {
  /** Full URL or proxy-relative path, e.g. /uploads/panoramas/abc.jpg */
  imageUrl:          string;
  /** Called when the user clicks the image with a placement tool active */
  onClick?:          (x: number, y: number) => void;
  /** Called when the user clicks the panorama background (no tool active) */
  onBgMouseDown?:    () => void;
  /** Show crosshair cursor when a placement tool is active */
  isPlacingElement?: boolean;
  children?:         React.ReactNode;
}

export function EditorPanoramaViewer({
  imageUrl,
  onClick,
  onBgMouseDown,
  isPlacingElement = false,
  children,
}: EditorPanoramaViewerProps) {
  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (isPlacingElement && onClick) {
      // Only fire when a placement tool is active and the click didn't
      // originate on a child marker (markers call stopPropagation).
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const x    = (e.clientX - rect.left)  / rect.width;
      const y    = (e.clientY - rect.top)   / rect.height;
      onClick(
        Math.max(0, Math.min(1, x)),
        Math.max(0, Math.min(1, y)),
      );
    } else {
      onBgMouseDown?.();
    }
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-900 select-none"
      style={{
        aspectRatio:  "2 / 1",   // equirectangular images are always 2:1
        cursor:       isPlacingElement ? "crosshair" : "default",
        backgroundImage:    `url(${imageUrl})`,
        backgroundSize:     "cover",
        backgroundPosition: "center",
        backgroundRepeat:   "no-repeat",
      }}
    >
      {/* Marker overlay — pointer-events only on the markers themselves */}
      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
        {children}
      </div>
    </div>
  );
}
