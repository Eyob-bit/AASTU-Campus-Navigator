declare module "marzipano" {
  export class Viewer {
    constructor(domElement: HTMLElement, options?: Record<string, unknown>);
    destroy(): void;
    createScene(config: {
      source: ImageUrlSource;
      geometry: EquirectGeometry;
      view: RectilinearView;
    }): Scene;
    switchScene(scene: Scene): void;
  }

  export class ImageUrlSource {
    static fromString(url: string): ImageUrlSource;
  }

  export class EquirectGeometry {
    constructor(levels: Array<{ tileSize: number; size: number }>);
  }

  export class RectilinearView {
    constructor(
      initialView?: { yaw?: number; pitch?: number; fov?: number },
      limiter?: unknown
    );
    setYaw(yaw: number): void;
    setPitch(pitch: number): void;
    setFov(fov: number): void;
    screenToCoordinates(coords: { x: number; y: number }): { yaw: number; pitch: number } | null;
  }

  export interface Scene {
    switchTo(): void;
    destroy(): void;
    hotspotContainer(): {
      createHotspot(
        element: HTMLElement,
        coords: { yaw: number; pitch: number }
      ): any;
    };
  }
}
