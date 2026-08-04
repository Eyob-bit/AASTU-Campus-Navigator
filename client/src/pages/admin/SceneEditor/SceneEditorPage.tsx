import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Map } from "lucide-react";
import { ConfirmDialog, ErrorBanner, ToastContainer, Card, Skeleton } from "@/components/ui";
import { useScene } from "@/hooks/useScene";
import { useToast } from "@/hooks/useToast";
import { useCampusHierarchy } from "@/hooks/useCampusHierarchy";
import { cn } from "@/utils/cn";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { floorApi } from "@/api/floor.api";
import type {
  SceneElement,
  PanoramaScene,
  OfficeOption,
} from "@/types";
import { EditorPanoramaViewer } from "./EditorPanoramaViewer";
import { ElementMarker } from "./ElementMarker";
import { EditorToolbar, type ActiveTool } from "./EditorToolbar";
import { ElementPropertyPanel, type DraftElement, type ElementSavePayload } from "./ElementPropertyPanel";
import { getPanoramaImageUrl, formatFloorLabel } from "@/utils";

/**
 * Panorama Scene Editor page.
 *
 * Route:  /dashboard/scene-editor/:sceneId
 *
 * Orchestration only — all sub-concerns live in focused sub-components:
 *   EditorPanoramaViewer  – flat equirectangular image + click coords
 *   ElementMarker         – drag-and-drop marker for each element
 *   EditorToolbar         – placement tool selection + delete
 *   ElementPropertyPanel  – type-specific form for saving element props
 */
export function SceneEditorPage() {
  const { sceneId = "" } = useParams<{ sceneId: string }>();

  // ── Data ────────────────────────────────────────────────────────────────────
  const { scene, elements, isLoading, error, fetchScene, fetchElements,
          createElement, updateElement, deleteElement } = useScene();
  const { toasts, addToast, removeToast } = useToast();
  const del = useDeleteDialog<SceneElement>();

  // ── Hierarchy & Selection Data for No-SceneId view ─────────────────────────
  const {
    buildings,
    floorOptions,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refresh: refreshHierarchy,
  } = useCampusHierarchy();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [floorScenes, setFloorScenes] = useState<PanoramaScene[]>([]);
  const [scenesLoading, setScenesLoading] = useState<boolean>(false);
  const [scenesError, setScenesError] = useState<string | null>(null);

  // Load hierarchy if sceneId is not present
  useEffect(() => {
    if (!sceneId) {
      refreshHierarchy().catch(() => {});
    }
  }, [sceneId, refreshHierarchy]);

  // Set default building
  useEffect(() => {
    if (!sceneId && buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [sceneId, buildings, selectedBuildingId]);

  // Set default floor when building changes
  const buildingFloors = floorOptions.filter(f => f.buildingId === selectedBuildingId);
  useEffect(() => {
    if (buildingFloors.length > 0) {
      setSelectedFloorId(buildingFloors[0].id);
    } else {
      setSelectedFloorId("");
    }
  }, [selectedBuildingId, floorOptions]);

  // Fetch scenes for selected floor
  useEffect(() => {
    if (!selectedFloorId) {
      setFloorScenes([]);
      return;
    }
    setScenesLoading(true);
    setScenesError(null);
    floorApi.getScenes(selectedFloorId)
      .then((data) => {
        setFloorScenes(data.scenes);
      })
      .catch((err) => {
        setScenesError(err instanceof Error ? err.message : "Failed to load scenes.");
      })
      .finally(() => {
        setScenesLoading(false);
      });
  }, [selectedFloorId]);

  const [scenes,  setScenes]  = useState<PanoramaScene[]>([]);
  const [offices, setOffices] = useState<OfficeOption[]>([]);

  useEffect(() => {
    if (!sceneId) return;
    fetchScene(sceneId);
    fetchElements(sceneId);
  }, [sceneId, fetchScene, fetchElements]);

  // Fetch sibling scenes + offices once we know the floor
  useEffect(() => {
    if (!scene?.floorId) return;
    floorApi.getScenes(scene.floorId)
      .then((d) => setScenes(d.scenes.filter((s) => s.id !== sceneId)))
      .catch(() => {});
    floorApi.getOffices(scene.floorId)
      .then((d) => setOffices(
        d.offices.map((o): OfficeOption => ({
          id:           o.id,
          name:         o.name,
          roomNumber:   o.roomNumber,
          floorId:      scene.floorId,
          floorNumber:  0,           // not needed for display here
          buildingId:   "",
          buildingName: "",
        }))
      ))
      .catch(() => {});
  }, [scene?.floorId, sceneId]);

  // ── Editor state ─────────────────────────────────────────────────────────────
  const [activeTool,         setActiveTool]         = useState<ActiveTool>(null);
  const [selectedElementId,  setSelectedElementId]  = useState<string | null>(null);
  const [draft,              setDraft]              = useState<DraftElement | null>(null);
  const [isSaving,           setIsSaving]           = useState(false);

  const selectedElement = elements.find((el) => el.id === selectedElementId) ?? null;
  const panelElement: SceneElement | DraftElement | null = draft ?? selectedElement;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleViewerClick(x: number, y: number) {
    if (activeTool) {
      setDraft({ type: activeTool, x, y });
      setSelectedElementId(null);
    }
  }

  function handleViewerBgMouseDown() {
    // Clicking the panorama background (no tool) deselects the current element
    if (!activeTool) {
      setSelectedElementId(null);
      setDraft(null);
    }
  }

  function handleElementSelect(id: string) {
    setDraft(null);
    setActiveTool(null);
    setSelectedElementId(id);
  }

  function handleCancelPanel() {
    setDraft(null);
    setSelectedElementId(null);
  }

  async function handleDragEnd(id: string, x: number, y: number) {
    try {
      await updateElement(id, { x, y });
    } catch {
      addToast({ type: "error", message: "Failed to move element." });
    }
  }

  async function handleSave(payload: ElementSavePayload) {
    setIsSaving(true);
    try {
      if (draft) {
        await createElement(sceneId, {
          ...payload,
          displayOrder: elements.length,
        });
        addToast({ type: "success", message: "Element placed successfully." });
        setDraft(null);
        setActiveTool(null);
      } else if (selectedElementId) {
        await updateElement(selectedElementId, payload);
        addToast({ type: "success", message: "Element updated." });
        setSelectedElementId(null);
      }
    } catch {
      addToast({ type: "error", message: "Failed to save element." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!del.deleteTarget) return;
    del.setDeleting(true);
    try {
      await deleteElement(del.deleteTarget.id);
      addToast({ type: "success", message: "Element deleted." });
      if (selectedElementId === del.deleteTarget.id) setSelectedElementId(null);
      del.closeDelete();
    } catch {
      addToast({ type: "error", message: "Failed to delete element." });
    } finally {
      del.setDeleting(false);
    }
  }

  function handleToolbarDelete() {
    const el = elements.find((e) => e.id === selectedElementId);
    if (el) del.openDelete(el);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const imageUrl = getPanoramaImageUrl(scene?.imagePath);

  if (!sceneId) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-8 py-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Map size={24} className="text-indigo-600 dark:text-indigo-400" />
            Scene Editor
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Select a building, floor, and scene to start placing labels and navigation markers.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Building & Floor Selector */}
          <div className="md:col-span-1 space-y-6">
            {/* Buildings list */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                1. Select Building
              </h2>
              {hierarchyLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : hierarchyError ? (
                <p className="text-xs text-red-500">{hierarchyError}</p>
              ) : (
                <div className="space-y-1">
                  {buildings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBuildingId(b.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                        selectedBuildingId === b.id
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Floors list */}
            {selectedBuildingId && (
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                  2. Select Floor
                </h2>
                {buildingFloors.length === 0 ? (
                  <p className="text-xs text-gray-500">No floors added to this building yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {buildingFloors.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFloorId(f.id)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer",
                          selectedFloorId === f.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        Floor {f.floorNumber}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Scenes Grid */}
          <div className="md:col-span-2">
            <Card className="p-6 h-full flex flex-col min-h-[400px]">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                3. Choose Scene to Edit
              </h2>

              {!selectedFloorId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Map size={36} className="mb-2 opacity-50" />
                  <p className="text-sm">Please select a building and floor to view scenes.</p>
                </div>
              ) : scenesLoading ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-44 w-full animate-pulse bg-gray-200 rounded" />
                  <Skeleton className="h-44 w-full animate-pulse bg-gray-200 rounded" />
                </div>
              ) : scenesError ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-red-500">{scenesError}</p>
                </div>
              ) : floorScenes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Map size={36} className="mb-2 opacity-50" />
                  <p className="text-sm">No scenes uploaded for this floor yet.</p>
                  <Link
                    to="/dashboard/panoramas"
                    className="text-xs text-indigo-600 font-medium hover:underline mt-2 cursor-pointer"
                  >
                    Go to Panorama Scenes to upload one
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {floorScenes.map((s) => {
                    const sceneUrl = getPanoramaImageUrl(s.imagePath);
                    const currentFloor = buildingFloors.find((f) => f.id === selectedFloorId);
                    const floorLabel = currentFloor ? formatFloorLabel(currentFloor.floorNumber) : "";
                    const elementCount = s.elements?.length ?? 0;

                    return (
                      <div
                        key={s.id}
                        className="flex flex-col border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Thumbnail / Image preview */}
                        <div className="h-32 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
                          {sceneUrl ? (
                            <img
                              src={sceneUrl}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-gray-400">
                              <span className="text-2xl">📷</span>
                              <span className="text-[10px]">No image uploaded</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-mono font-semibold">
                            {s.imageFilename ? "360°" : "Flat"}
                          </div>
                        </div>

                        {/* Card details */}
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                              <span>📷</span> {s.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 font-medium">
                              <span>{floorLabel}</span>
                              <span className="text-gray-300">•</span>
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">
                                {elementCount} Element{elementCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <Link
                            to={`/dashboard/scene-editor/${s.id}`}
                            className="w-full flex items-center justify-center gap-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                          >
                            <span>Edit</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Link to="/dashboard/panoramas" className="hover:text-gray-600 transition-colors">
              Panoramas
            </Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium truncate max-w-[260px]">
              {scene?.name ?? "Loading…"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Map size={18} className="text-indigo-500" />
            Scene Editor
          </h1>
        </div>
        <div className="text-xs text-gray-400">
          {elements.length} element{elements.length !== 1 ? "s" : ""}
        </div>
      </div>

      <ErrorBanner title="Failed to load scene" message={error} onRetry={() => { fetchScene(sceneId); fetchElements(sceneId); }} />

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        <EditorToolbar
          activeTool={activeTool}
          onToolSelect={setActiveTool}
          selectedElementId={selectedElementId}
          onDeleteSelected={handleToolbarDelete}
        />

        {/* ── Panorama viewer ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-4 bg-gray-50" data-panorama-container>
          {isLoading && (
            <div className="flex items-center justify-center h-64 text-sm text-gray-400">
              Loading scene…
            </div>
          )}
          {!isLoading && !imageUrl && (
            <div className="flex items-center justify-center h-64 text-sm text-gray-400">
              No panorama image for this scene.
            </div>
          )}
          {!isLoading && imageUrl && (
            <>
              {activeTool && (
                <p className="text-xs text-indigo-600 font-medium mb-2 text-center">
                  Click anywhere on the panorama to place a{" "}
                  {activeTool === "ARROW" ? "navigation arrow" :
                   activeTool === "OFFICE_LABEL" ? "office label" : "info marker"}.
                </p>
              )}
              <EditorPanoramaViewer
                imageUrl={imageUrl}
                isPlacingElement={!!activeTool}
                onClick={handleViewerClick}
                onBgMouseDown={handleViewerBgMouseDown}
              >
                {/* Ghost draft marker */}
                {draft && (
                  <span
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }}
                  >
                    <span className="w-8 h-8 rounded-full border-2 border-dashed border-white bg-black/40 flex items-center justify-center animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </span>
                  </span>
                )}
                {elements.map((el) => (
                  <ElementMarker
                    key={el.id}
                    element={el}
                    isSelected={el.id === selectedElementId}
                    onSelect={() => handleElementSelect(el.id)}
                    onDragEnd={(x, y) => handleDragEnd(el.id, x, y)}
                  />
                ))}
              </EditorPanoramaViewer>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Click an element to edit · Drag to reposition
              </p>
            </>
          )}
        </main>

        {/* ── Property panel ──────────────────────────────────────────────── */}
        {panelElement && (
          <ElementPropertyPanel
            element={panelElement}
            scenes={scenes}
            offices={offices}
            isSaving={isSaving}
            onSave={handleSave}
            onCancel={handleCancelPanel}
          />
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!del.deleteTarget}
        onClose={del.closeDelete}
        onConfirm={handleDelete}
        title="Delete Element"
        description={`Delete this ${del.deleteTarget?.type?.toLowerCase().replace("_", " ")} element? This cannot be undone.`}
        danger
        loading={del.deleting}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
