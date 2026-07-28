import { useState, useCallback } from "react";
import { landmarkApi } from "@/api/landmark.api";
import type { Landmark, CreateLandmarkBody, UpdateLandmarkBody } from "@/types";

interface UseLandmarksReturn {
  landmarks: Landmark[];
  isLoading: boolean;
  error: string | null;
  fetchLandmarks: (visibleOnly?: boolean) => Promise<void>;
  createLandmark: (body: CreateLandmarkBody) => Promise<void>;
  updateLandmark: (id: string, body: UpdateLandmarkBody) => Promise<void>;
  deleteLandmark: (id: string) => Promise<void>;
}

export function useLandmarks(): UseLandmarksReturn {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchLandmarks = useCallback(async (visibleOnly = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = visibleOnly
        ? await landmarkApi.getVisible()
        : await landmarkApi.getAll();
      setLandmarks(data.landmarks);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load landmarks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLandmark = useCallback(async (body: CreateLandmarkBody) => {
    setError(null);
    try {
      const created = await landmarkApi.create(body);
      setLandmarks((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create landmark.");
      throw err;
    }
  }, []);

  const updateLandmark = useCallback(async (id: string, body: UpdateLandmarkBody) => {
    setError(null);
    try {
      const updated = await landmarkApi.update(id, body);
      setLandmarks((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update landmark.");
      throw err;
    }
  }, []);

  const deleteLandmark = useCallback(async (id: string) => {
    setError(null);
    try {
      await landmarkApi.delete(id);
      setLandmarks((prev) => prev.filter((l) => l.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete landmark.");
      throw err;
    }
  }, []);

  return { landmarks, isLoading, error, fetchLandmarks, createLandmark, updateLandmark, deleteLandmark };
}
