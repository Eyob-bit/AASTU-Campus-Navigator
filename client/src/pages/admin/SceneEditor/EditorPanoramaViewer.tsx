/**
 * Flat equirectangular image viewer for the Scene Editor.
 *
 * Coordinate system:
 *   x and y are 0–1 normalised fractions of the image width/height.
 *   This matches the backend validator exactly (x: number.min(0).max(1)).
 *
 * Children (element markers) are rendered as an absolutely-positioned
 * overlay on top of the image and receive pointer events independently.
 */

interface EditorPanoramaViewerProps {
  /** Full URL or proxy-relative path, e.g. /uploads/panoramas/abc.jpg */
  imageUrl:          string;
  /** Called when the user clicks the image, not an element marker */
  onClick?:          (x: number, y: number) => void;
  /** Show crosshair cursor when a placement tool is active */
  isPlacingElement?: boolean;
  children?:         React.ReactNode;
}

export function EditorPanoramaViewer({
  imageUrl,
  onClick,
  isPlacingElement = false,
  children,
}: EditorPanoramaViewerProps) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x    = (e.clientX - rect.left)  / rect.width;
    const y    = (e.clientY - rect.top)   / rect.height;
    onClick(
      Math.max(0, Math.min(1, x)),
      Math.max(0, Math.min(1, y)),
    );
  }

  return (
    <div
      onClick={handleClick}
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
