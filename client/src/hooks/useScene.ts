import { useState, useCallback } from "react";
import { sceneApi } from "@/api/scene.api";
import { sceneElementApi } from "@/api/scene-element.api";
import type {
  PanoramaScene,
  SceneElement,
  CreateSceneElementBody,
  UpdateSceneElementBody,
} from "@/types";

interface UseSceneReturn {
  scene:         PanoramaScene | null;
  elements:      SceneElement[];
  isLoading:     boolean;
  error:         string | null;
  fetchScene:    (id: string) => Promise<void>;
  fetchElements: (sceneId: string) => Promise<void>;
  createElement: (sceneId: string, body: CreateSceneElementBody) => Promise<SceneElement>;
  updateElement: (id: string, body: UpdateSceneElementBody) => Promise<void>;
  deleteElement: (id: string) => Promise<void>;
}

/**
 * Manages a single panorama scene and its elements.
 *
 * Follows the same pattern as useBuildings, useFloors, useOffices, useStaff:
 *  - useState + useCallback, no external state library
 *  - optimistic local-state mutations after create/update/delete
 *  - errors are set in state AND re-thrown so the page can show toasts
 */
export function useScene(): UseSceneReturn {
  const [scene,     setScene]     = useState<PanoramaScene | null>(null);
  const [elements,  setElements]  = useState<SceneElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const fetchScene = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sceneApi.getById(id);
      setScene(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load scene.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchElements = useCallback(async (sceneId: string) => {
    setError(null);
    try {
      const data = await sceneApi.getElements(sceneId);
      setElements(data.elements);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load scene elements.");
    }
  }, []);

  const createElement = useCallback(async (
    sceneId: string,
    body: CreateSceneElementBody,
  ): Promise<SceneElement> => {
    setError(null);
    try {
      const created = await sceneApi.createElement(sceneId, body);
      setElements((prev) => [...prev, created]);
      return created;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create element.");
      throw err;
    }
  }, []);

  const updateElement = useCallback(async (
    id: string,
    body: UpdateSceneElementBody,
  ): Promise<void> => {
    setError(null);
    try {
      const updated = await sceneElementApi.update(id, body);
      setElements((prev) => prev.map((el) => (el.id === id ? updated : el)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update element.");
      throw err;
    }
  }, []);

  const deleteElement = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await sceneElementApi.delete(id);
      setElements((prev) => prev.filter((el) => el.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete element.");
      throw err;
    }
  }, []);

  return {
    scene,
    elements,
    isLoading,
    error,
    fetchScene,
    fetchElements,
    createElement,
    updateElement,
    deleteElement,
  };
}
