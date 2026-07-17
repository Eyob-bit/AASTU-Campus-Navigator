import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Map } from "lucide-react";
import { Button, ConfirmDialog, ErrorBanner, ToastContainer } from "@/components/ui";
import { useScene } from "@/hooks/useScene";
import { useToast } from "@/hooks/useToast";
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
    if (!activeTool) return;
    setDraft({ type: activeTool, x, y });
    setSelectedElementId(null);
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
  const imageUrl = scene?.imagePath ? `/${scene.imagePath}` : null;

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
              >
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
