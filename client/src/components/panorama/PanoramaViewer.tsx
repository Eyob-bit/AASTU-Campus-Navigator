import { useEffect, useRef } from "react";
import {
  EquirectGeometry,
  ImageUrlSource,
  RectilinearView,
  Viewer,
} from "marzipano";

interface PanoramaViewerProps {
  imageUrl?: string | null;
  className?: string;
}

export function PanoramaViewer({
  imageUrl,
  className,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !imageUrl) {
      return;
    }

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

  if (!imageUrl) {
    return (
      <div
        className={
          className ??
          "flex h-96 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-500"
        }
      >
        Select a destination to load a panorama scene.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className ?? "h-96 w-full overflow-hidden rounded-2xl border border-slate-200"}
    />
  );
}
