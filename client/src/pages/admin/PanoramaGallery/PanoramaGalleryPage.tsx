import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Image as ImageIcon, Plus, Pencil, Trash2,
  Building2, Layers, Star, ArrowRight, RefreshCw, ChevronDown,
} from "lucide-react";
import {
  Card, Button, ActionButton, ConfirmDialog,
  ToastContainer, EmptyState, ErrorBanner, Skeleton,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { usePanoramas } from "@/hooks/usePanoramas";
import type { SceneWithContext } from "@/hooks/usePanoramas";
import { SceneFormModal } from "./SceneFormModal";
import { getPanoramaImageUrl, formatFloorLabel } from "@/utils";
import { cn } from "@/utils/cn";

export function PanoramaGalleryPage() {
  const {
    scenes, buildings, floorOptions,
    isLoading, error,
    fetchAll, createScene, updateScene, deleteScene,
  } = usePanoramas();

  const { toasts, addToast, removeToast } = useToast();
  const del = useDeleteDialog<SceneWithContext>();

  // ── Sidebar / filter state ──────────────────────────────────────────────────
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId,    setSelectedFloorId]    = useState("");

  // Mobile: whether the filter panel is expanded
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [formOpen,  setFormOpen]  = useState(false);
  const [editScene, setEditScene] = useState<SceneWithContext | null>(null);

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-select first building
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [buildings, selectedBuildingId]);

  // Auto-select first floor for selected building
  const buildingFloors = useMemo(
    () => floorOptions.filter((f) => f.buildingId === selectedBuildingId),
    [floorOptions, selectedBuildingId]
  );

  useEffect(() => {
    if (buildingFloors.length > 0) {
      setSelectedFloorId(buildingFloors[0].id);
    } else {
      setSelectedFloorId("");
    }
  }, [selectedBuildingId, floorOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scenes for selected floor
  const floorScenes = useMemo(
    () => scenes.filter((s) => s.floorId === selectedFloorId),
    [scenes, selectedFloorId]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() { setEditScene(null); setFormOpen(true); }
  function openEdit(s: SceneWithContext) { setEditScene(s); setFormOpen(true); }

  async function handleFormSubmit(floorId: string, formData: FormData) {
    if (editScene) {
      await updateScene(editScene.id, formData);
      addToast({ type: "success", message: `Scene "${editScene.name}" updated.` });
    } else {
      await createScene(floorId, formData);
      addToast({ type: "success", message: "Panorama scene uploaded successfully." });
    }
    fetchAll().catch(() => {});
  }

  async function handleDelete() {
    if (!del.deleteTarget) return;
    del.setDeleting(true);
    try {
      await deleteScene(del.deleteTarget.id);
      addToast({ type: "success", message: `Scene "${del.deleteTarget.name}" deleted.` });
      del.closeDelete();
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Delete failed." });
    } finally {
      del.setDeleting(false);
    }
  }

  // Labels for the mobile filter button
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const selectedFloor    = buildingFloors.find((f) => f.id === selectedFloorId);
  const filterLabel = selectedBuilding
    ? `${selectedBuilding.name}${selectedFloor ? ` · ${formatFloorLabel(selectedFloor.floorNumber)}` : ""}`
    : "Select building & floor";

  const totalScenes = scenes.length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* ── Top header ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-8 py-4 sm:py-6 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ImageIcon size={18} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Panorama Scenes</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                {isLoading
                  ? "Loading…"
                  : `${totalScenes} scene${totalScenes !== 1 ? "s" : ""} across all floors`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchAll()}
              disabled={isLoading}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={openCreate}
              disabled={floorOptions.length === 0}
            >
              <Plus size={14} />
              <span className="hidden xs:inline">Upload Scene</span>
              <span className="xs:hidden">Upload</span>
            </Button>
          </div>
        </div>
      </div>

      <ErrorBanner
        title="Failed to load panorama scenes"
        message={error}
        onRetry={fetchAll}
      />

      {/* ── Mobile filter toggle ─────────────────────────────────────────── */}
      <div className="lg:hidden px-4 pt-4">
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Layers size={14} className="text-indigo-500 dark:text-indigo-400" />
            <span className="truncate max-w-[220px]">{filterLabel}</span>
          </span>
          <ChevronDown
            size={16}
            className={cn("text-gray-400 dark:text-slate-400 transition-transform flex-shrink-0", filterOpen && "rotate-180")}
          />
        </button>

        {/* Collapsible filter panel on mobile */}
        {filterOpen && (
          <div className="mt-2 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
            {/* Buildings */}
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 size={11} /> Buildings
              </h2>
              <div className="flex flex-wrap gap-2">
                {buildings.map((b) => {
                  const bScenes = scenes.filter((s) => s.buildingId === b.id).length;
                  return (
                    <button
                      key={b.id}
                      onClick={() => { setSelectedBuildingId(b.id); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                        selectedBuildingId === b.id
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                      )}
                    >
                      {b.name}
                      {bScenes > 0 && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                          selectedBuildingId === b.id ? "bg-white/20" : "bg-gray-100 text-gray-500"
                        )}>
                          {bScenes}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floors */}
            {selectedBuildingId && buildingFloors.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers size={11} /> Floors
                </h2>
                <div className="flex flex-wrap gap-2">
                  {buildingFloors.map((f) => {
                    const fScenes = scenes.filter((s) => s.floorId === f.id).length;
                    return (
                      <button
                        key={f.id}
                        onClick={() => { setSelectedFloorId(f.id); setFilterOpen(false); }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer",
                          selectedFloorId === f.id
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                        )}
                      >
                        {formatFloorLabel(f.floorNumber)}
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                          selectedFloorId === f.id ? "bg-white/20" : "bg-gray-100 text-gray-500"
                        )}>
                          {fScenes}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 p-4 sm:p-6 gap-6 max-w-7xl w-full mx-auto">

        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden lg:flex lg:w-60 xl:w-64 flex-shrink-0 flex-col gap-4">

          {/* Buildings */}
          <Card className="p-4">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 size={12} /> Buildings
              </h2>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : buildings.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">No buildings found.</p>
            ) : (
              <div className="space-y-1">
                {buildings.map((b) => {
                  const bScenes = scenes.filter((s) => s.buildingId === b.id).length;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBuildingId(b.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between gap-2",
                        selectedBuildingId === b.id
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400"
                          : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="truncate">{b.name}</span>
                      {bScenes > 0 && (
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                          selectedBuildingId === b.id
                            ? "bg-indigo-200 text-indigo-700"
                            : "bg-gray-200 text-gray-500"
                        )}>
                          {bScenes}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Floors */}
          {selectedBuildingId && (
            <Card className="p-4">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers size={12} /> Floors
              </h2>
              {buildingFloors.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">No floors in this building.</p>
              ) : (
                <div className="space-y-1">
                  {buildingFloors.map((f) => {
                    const fScenes = scenes.filter((s) => s.floorId === f.id).length;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFloorId(f.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between gap-2",
                          selectedFloorId === f.id
                            ? "bg-indigo-600 text-white"
                            : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <span>{formatFloorLabel(f.floorNumber)}</span>
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                          selectedFloorId === f.id
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-500"
                        )}>
                          {fScenes}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </aside>

        {/* Main scene grid */}
        <main className="flex-1 min-w-0">
          {!selectedFloorId && !isLoading && (
            <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center text-gray-400">
              <ImageIcon size={32} className="mb-3 opacity-40" />
              <p className="text-sm">Select a building and floor to view scenes.</p>
            </div>
          )}

          {selectedFloorId && isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <SceneCardSkeleton key={i} />
              ))}
            </div>
          )}

          {selectedFloorId && !isLoading && floorScenes.length === 0 && (
            <Card className="flex flex-col items-center justify-center py-12 sm:py-16 px-6 sm:px-8 text-center">
              <EmptyState
                icon={<ImageIcon size={28} />}
                title="No scenes on this floor yet"
                description="Upload a 360° panorama image to create the first scene for this floor."
                action={
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Plus size={14} /> Upload Scene
                  </Button>
                }
              />
            </Card>
          )}

          {selectedFloorId && !isLoading && floorScenes.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {floorScenes.length} scene{floorScenes.length !== 1 ? "s" : ""} on{" "}
                  <span className="font-medium text-gray-700 dark:text-slate-200">
                    {formatFloorLabel(buildingFloors.find((f) => f.id === selectedFloorId)?.floorNumber ?? 0)}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {floorScenes.map((scene) => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    onEdit={() => openEdit(scene)}
                    onDelete={() => del.openDelete(scene)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <SceneFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        floorOptions={floorOptions}
        scene={editScene}
        defaultFloorId={selectedFloorId}
      />

      <ConfirmDialog
        open={!!del.deleteTarget}
        onClose={del.closeDelete}
        onConfirm={del.deleteTarget?.isEntryScene ? del.closeDelete : handleDelete}
        title={del.deleteTarget?.isEntryScene ? "Cannot Delete Entry Scene" : "Delete Scene"}
        description={
          del.deleteTarget?.isEntryScene
            ? `"${del.deleteTarget?.name}" is the entry scene for this floor. Set another scene as the entry scene first, then delete this one.`
            : `Delete "${del.deleteTarget?.name}"? All scene elements will also be removed. This cannot be undone.`
        }
        danger={!del.deleteTarget?.isEntryScene}
        loading={del.deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

interface SceneCardProps {
  scene: SceneWithContext;
  onEdit: () => void;
  onDelete: () => void;
}

function SceneCard({ scene, onEdit, onDelete }: SceneCardProps) {
  const imageUrl = getPanoramaImageUrl(scene.imagePath);

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">

      {/* Thumbnail */}
      <div className="relative h-36 sm:h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={scene.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-300">
            <ImageIcon size={28} />
            <span className="text-xs">No image</span>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {scene.isEntryScene && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              <Star size={9} /> Entry
            </span>
          )}
          <span className="bg-black/60 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full">
            360°
          </span>
        </div>

        {/* Action buttons — always visible on touch, hover-reveal on desktop */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <ActionButton
            icon={<Pencil size={13} />}
            label="Edit"
            hoverClass="hover:text-amber-600 hover:bg-amber-50"
            onClick={onEdit}
          />
          <ActionButton
            icon={<Trash2 size={13} />}
            label="Delete"
            hoverClass="hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2 sm:gap-3">
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-1">{scene.name}</h3>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono truncate">{scene.key}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
            Order {scene.displayOrder}
          </span>
          <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-full">
            {scene.elements?.length ?? 0} element{(scene.elements?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>

        {/* CTA */}
        <Link
          to={`/dashboard/scene-editor/${scene.id}`}
          className="mt-auto flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Edit in Scene Editor <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function SceneCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <Skeleton className="h-36 sm:h-40 w-full rounded-none" />
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
}
