import { useState, useCallback, useEffect } from "react";
import { sceneApi } from "@/api/scene.api";
import { floorApi } from "@/api/floor.api";
import { buildingApi } from "@/api/building.api";
import type { PanoramaScene, SceneElement, Floor, Building } from "@/types";

export interface ScenePreviewContext {
  scene: PanoramaScene | null;
  elements: SceneElement[];
  floor: Floor | null;
  building: Building | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  navigateTo: (sceneId: string) => void;
  history: string[];
  goBack: () => void;
}

export function useScenePreview(initialSceneId: string): ScenePreviewContext {
  const [sceneId, setSceneId] = useState(initialSceneId);
  const [history, setHistory] = useState<string[]>([]);
  const [scene, setScene] = useState<PanoramaScene | null>(null);
  const [elements, setElements] = useState<SceneElement[]>([]);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [sceneData, elementsData] = await Promise.all([
        sceneApi.getById(id),
        sceneApi.getElements(id),
      ]);
      setScene(sceneData);
      setElements(elementsData.elements.filter((e) => e.isVisible));

      // Load floor and building in parallel
      const floorData = await floorApi.getById(sceneData.floorId);
      setFloor(floorData);

      const buildingData = await buildingApi.getById(floorData.buildingId);
      setBuilding(buildingData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load scene.");
      setScene(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSceneId && initialSceneId !== sceneId) {
      setSceneId(initialSceneId);
    }
  }, [initialSceneId, sceneId]);

  useEffect(() => {
    if (sceneId) {
      load(sceneId);
    }
  }, [sceneId, load]);

  const reload = useCallback(() => load(sceneId), [sceneId, load]);

  const navigateTo = useCallback((nextId: string) => {
    setHistory((prev: string[]) => [...prev, sceneId]);
    setSceneId(nextId);
  }, [sceneId]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h: string[]) => h.slice(0, -1));
    setSceneId(prev);
  }, [history]);

  return { scene, elements, floor, building, isLoading, error, reload, navigateTo, history, goBack };
}
