import { useEffect, useState, useMemo } from "react";
import { MapPin, Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import {
  Card, TableToolbar, Pagination, EmptyState,
  Skeleton, ConfirmDialog, ToastContainer, Button,
  ActionButton, ErrorBanner,
} from "@/components/ui";
import { useLandmarks } from "@/hooks/useLandmarks";
import { useToast } from "@/hooks/useToast";
import { useTableSearch } from "@/hooks/useTableSearch";
import { usePagination } from "@/hooks/usePagination";
import { useResetPageOnSearch } from "@/hooks/useResetPageOnSearch";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { LandmarkFormModal } from "./LandmarkFormModal";
import { CampusMap } from "@/components/map";
import { CATEGORY_CONFIG } from "@/components/map/LandmarkMarker";
import type { Landmark, CreateLandmarkBody, UpdateLandmarkBody } from "@/types";
import { getTotalPages, paginate } from "@/utils";
import { ADMIN_TABLE_PAGE_SIZE } from "@/constants/admin";

const CATEGORY_FILTERS = [
  { label: "Food & Drink", value: "FOOD" },
  { label: "Education", value: "EDUCATION" },
  { label: "Sports", value: "SPORTS" },
  { label: "Administration", value: "ADMINISTRATION" },
  { label: "Transport", value: "TRANSPORT" },
  { label: "Emergency", value: "EMERGENCY" },
  { label: "Recreation", value: "RECREATION" },
  { label: "Religious", value: "RELIGIOUS" },
  { label: "Services", value: "SERVICES" },
  { label: "Custom", value: "CUSTOM" },
];

const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Category", value: "category-asc" },
  { label: "Visible First", value: "visible-desc" },
  { label: "Hidden First", value: "visible-asc" },
];

export function LandmarksPage() {
  const { landmarks, isLoading, error, fetchLandmarks, createLandmark, updateLandmark, deleteLandmark } =
    useLandmarks();
  const { toasts, addToast, removeToast } = useToast();
  const { search, setSearch } = useTableSearch();
  const del = useDeleteDialog<Landmark>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState<Landmark | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState("");

  useEffect(() => { fetchLandmarks(); }, [fetchLandmarks]);

  const filtered = useMemo(() => {
    let result = landmarks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      result = result.filter((l) => l.category === categoryFilter);
    }
    if (sortKey) {
      const [field, dir] = sortKey.split("-");
      const mult = dir === "desc" ? -1 : 1;
      result = [...result].sort((a, b) => {
        if (field === "name") return mult * a.name.localeCompare(b.name);
        if (field === "category") return mult * a.category.localeCompare(b.category);
        if (field === "visible") return mult * (a.isVisible === b.isVisible ? 0 : a.isVisible ? -1 : 1);
        return 0;
      });
    }
    return result;
  }, [landmarks, search, categoryFilter, sortKey]);

  const totalPages = getTotalPages(filtered.length, ADMIN_TABLE_PAGE_SIZE);
  const { page, setPage } = usePagination(totalPages);
  useResetPageOnSearch(search, setPage);
  const paginated = paginate(filtered, page, ADMIN_TABLE_PAGE_SIZE);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(l: Landmark) { setEditing(l); setFormOpen(true); }

  async function handleFormSubmit(data: CreateLandmarkBody | UpdateLandmarkBody) {
    try {
      if (editing) {
        await updateLandmark(editing.id, data as UpdateLandmarkBody);
        addToast({ type: "success", message: "Landmark updated successfully." });
      } else {
        await createLandmark(data as CreateLandmarkBody);
        addToast({ type: "success", message: "Landmark created successfully." });
      }
    } catch (err) {
      throw err;
    }
  }

  async function handleToggleVisibility(l: Landmark) {
    try {
      await updateLandmark(l.id, { isVisible: !l.isVisible });
      addToast({ type: "success", message: `"${l.name}" is now ${!l.isVisible ? "visible" : "hidden"}.` });
    } catch {
      addToast({ type: "error", message: "Failed to update visibility." });
    }
  }

  async function handleDelete() {
    if (!del.deleteTarget) return;
    del.setDeleting(true);
    try {
      await deleteLandmark(del.deleteTarget.id);
      addToast({ type: "success", message: `"${del.deleteTarget.name}" deleted.` });
      del.closeDelete();
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Delete failed." });
    } finally {
      del.setDeleting(false);
    }
  }

  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  if (viewMode === "map") {
    return (
      <>
        {/* Full-screen map overlay */}
        <div className="fixed inset-0 z-30 flex flex-col bg-slate-950">
          {/* Thin top bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0B132B]/95 border-b border-slate-700/60 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-sm font-bold text-white">Landmarks — Map View</h1>
                <p className="text-[10px] text-slate-400">{landmarks.length} landmark{landmarks.length !== 1 ? "s" : ""} on campus</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={openCreate}>
                <Plus size={13} /> Add Landmark
              </Button>
              <button
                onClick={() => setViewMode("table")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700/80 text-slate-200 hover:bg-slate-600 transition-all"
              >
                ← Table View
              </button>
            </div>
          </div>

          {/* Full-screen map */}
          <div className="flex-1 relative" style={{ minHeight: 0 }}>
            <CampusMap className="absolute inset-0 h-full w-full" />
          </div>
        </div>

        {/* Modals rendered outside fixed layer */}
        <LandmarkFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          landmark={editing}
        />
        <ConfirmDialog
          open={!!del.deleteTarget}
          onClose={del.closeDelete}
          onConfirm={handleDelete}
          title="Delete Landmark"
          description={`Delete "${del.deleteTarget?.name}"? This action cannot be undone.`}
          danger
          loading={del.deleting}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Landmarks</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Loading…" : `${landmarks.length} landmark${landmarks.length !== 1 ? "s" : ""} on campus`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            <MapPin size={13} />
            Map View
          </button>
        </div>
      </div>

      <ErrorBanner title="Failed to load landmarks" message={error} onRetry={fetchLandmarks} />

      <Card>
        <TableToolbar
          search={search}
          setSearch={setSearch}
          onAdd={openCreate}
          addLabel="Add Landmark"
          onRefresh={fetchLandmarks}
          filterOptions={CATEGORY_FILTERS}
          activeFilter={categoryFilter}
          onFilterChange={setCategoryFilter}
          sortOptions={SORT_OPTIONS}
          activeSort={sortKey}
          onSortChange={setSortKey}
        />

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800">
                  {["Landmark", "Category", "Coordinates", "Visible", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {paginated.map((l) => (
                  <LandmarkRow
                    key={l.id}
                    landmark={l}
                    onEdit={() => openEdit(l)}
                    onDelete={() => del.openDelete(l)}
                    onToggleVisible={() => handleToggleVisibility(l)}
                  />
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon={<MapPin size={24} />}
              title={search ? "No landmarks match your search" : "No landmarks yet"}
              description={search ? "Try a different name or category." : "Add your first campus landmark."}
              action={!search ? <Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} />Add Landmark</Button> : undefined}
            />
          )}
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden">
          {isLoading ? (
            <MobileLoadingSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<MapPin size={24} />}
              title={search ? "No landmarks match your search" : "No landmarks yet"}
              description={search ? "Try a different name or category." : "Add your first campus landmark."}
              action={!search ? <Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} />Add Landmark</Button> : undefined}
            />
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {paginated.map((l) => (
                <LandmarkCard
                  key={l.id}
                  landmark={l}
                  onEdit={() => openEdit(l)}
                  onDelete={() => del.openDelete(l)}
                  onToggleVisible={() => handleToggleVisibility(l)}
                />
              ))}
            </div>
          )}
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 dark:border-slate-800">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Showing {(page - 1) * ADMIN_TABLE_PAGE_SIZE + 1}–{Math.min(page * ADMIN_TABLE_PAGE_SIZE, filtered.length)} of {filtered.length} landmarks
            </p>
            <Pagination current={page} total={totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      <LandmarkFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        landmark={editing}
      />

      <ConfirmDialog
        open={!!del.deleteTarget}
        onClose={del.closeDelete}
        onConfirm={handleDelete}
        title="Delete Landmark"
        description={`Delete "${del.deleteTarget?.name}"? This action cannot be undone.`}
        danger
        loading={del.deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}


// ── Sub-components ─────────────────────────────────────────────────────────────

interface RowProps {
  landmark: Landmark;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
}

function CategoryBadge({ landmark }: { landmark: Landmark }) {
  const cfg = CATEGORY_CONFIG[landmark.category] ?? CATEGORY_CONFIG.CUSTOM;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg + "22", color: cfg.border }}
    >
      <span>{landmark.icon || cfg.emoji}</span>
      {cfg.label}
    </span>
  );
}

function LandmarkRow({ landmark, onEdit, onDelete, onToggleVisible }: RowProps) {
  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
            {landmark.icon || CATEGORY_CONFIG[landmark.category]?.emoji || "📍"}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{landmark.name}</span>
        </div>
      </td>
      <td className="px-4 py-3.5"><CategoryBadge landmark={landmark} /></td>
      <td className="px-4 py-3.5 text-xs font-mono text-gray-500 dark:text-slate-400">
        {landmark.latitude.toFixed(4)}°N &nbsp;{landmark.longitude.toFixed(4)}°E
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${landmark.isVisible ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}>
          {landmark.isVisible ? "Visible" : "Hidden"}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton icon={landmark.isVisible ? <EyeOff size={14} /> : <Eye size={14} />} label={landmark.isVisible ? "Hide" : "Show"} hoverClass="hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400" onClick={onToggleVisible} />
          <ActionButton icon={<Pencil size={14} />} label="Edit"   hoverClass="hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400" onClick={onEdit} />
          <ActionButton icon={<Trash2 size={14} />} label="Delete" hoverClass="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"    onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}

function LandmarkCard({ landmark, onEdit, onDelete, onToggleVisible }: RowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
        {landmark.icon || CATEGORY_CONFIG[landmark.category]?.emoji || "📍"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{landmark.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <CategoryBadge landmark={landmark} />
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${landmark.isVisible ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}>
            {landmark.isVisible ? "Visible" : "Hidden"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <ActionButton icon={landmark.isVisible ? <EyeOff size={14} /> : <Eye size={14} />} label="Toggle" hoverClass="hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400" onClick={onToggleVisible} />
        <ActionButton icon={<Pencil size={14} />} label="Edit"   hoverClass="hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:hover:text-amber-400" onClick={onEdit} />
        <ActionButton icon={<Trash2 size={14} />} label="Delete" hoverClass="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"    onClick={onDelete} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-4 flex-1 max-w-[220px]" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function MobileLoadingSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
