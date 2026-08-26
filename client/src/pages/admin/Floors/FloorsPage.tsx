import { useEffect, useState, useMemo } from "react";
import { Layers, Pencil, Trash2, Plus } from "lucide-react";
import {
  Card, TableToolbar, Pagination, EmptyState,
  Skeleton, ConfirmDialog, ToastContainer, Button,
  ActionButton, ErrorBanner,
} from "@/components/ui";
import { useFloors } from "@/hooks/useFloors";
import type { FloorWithBuilding } from "@/hooks/useFloors";
import { useToast } from "@/hooks/useToast";
import { useTableSearch } from "@/hooks/useTableSearch";
import { usePagination } from "@/hooks/usePagination";
import { useResetPageOnSearch } from "@/hooks/useResetPageOnSearch";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { FloorFormModal } from "./FloorFormModal";
import { filterFloors, getTotalPages, paginate, formatFloorLabel, sortFloors } from "@/utils";
import { ADMIN_TABLE_PAGE_SIZE } from "@/constants/admin";

const SORT_OPTIONS = [
  { label: "Building Name (A-Z)", value: "building-asc" },
  { label: "Building Name (Z-A)", value: "building-desc" },
  { label: "Floor Number (Asc)", value: "floor-asc" },
  { label: "Floor Number (Desc)", value: "floor-desc" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
];

export function FloorsPage() {
  const {
    floors, buildings, isLoading, error,
    fetchFloors, createFloor, updateFloor, deleteFloor,
  } = useFloors();
  const { toasts, addToast, removeToast } = useToast();
  const { search, setSearch } = useTableSearch();
  const del = useDeleteDialog<FloorWithBuilding>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState<FloorWithBuilding | null>(null);
  const [sortKey, setSortKey] = useState("");

  useEffect(() => { fetchFloors(); }, [fetchFloors]);

  const filtered = useMemo(() => {
    let result = filterFloors(floors, search);
    if (sortKey) {
      result = sortFloors(result, sortKey);
    }
    return result;
  }, [floors, search, sortKey]);
  const totalPages = getTotalPages(filtered.length, ADMIN_TABLE_PAGE_SIZE);
  const { page, setPage } = usePagination(totalPages);
  useResetPageOnSearch(search, setPage);
  const paginated  = paginate(filtered, page, ADMIN_TABLE_PAGE_SIZE);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(f: FloorWithBuilding) { setEditing(f); setFormOpen(true); }

  async function handleFormSubmit(buildingId: string, floorNumber: number) {
    try {
      if (editing) {
        await updateFloor(editing.id, floorNumber);
        addToast({ type: "success", message: "Floor updated successfully." });
      } else {
        await createFloor(buildingId, floorNumber);
        addToast({ type: "success", message: "Floor created successfully." });
      }
    } catch (err) {
      throw err;
    }
  }

  async function handleDelete() {
    if (!del.deleteTarget) return;
    del.setDeleting(true);
    try {
      await deleteFloor(del.deleteTarget.id);
      addToast({ type: "success", message: `Floor ${del.deleteTarget.floorNumber} in "${del.deleteTarget.buildingName}" deleted.` });
      del.closeDelete();
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Delete failed." });
    } finally {
      del.setDeleting(false);
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Floors</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Loading…" : `${floors.length} floor${floors.length !== 1 ? "s" : ""} across all buildings`}
          </p>
        </div>
      </div>

      <ErrorBanner title="Failed to load floors" message={error} onRetry={fetchFloors} />

      <Card>
        <TableToolbar
          search={search}
          setSearch={setSearch}
          onAdd={openCreate}
          addLabel="Add Floor"
          onRefresh={fetchFloors}
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
                  {TABLE_HEADERS.map((h) => (
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
                {paginated.map((f) => (
                  <FloorRow
                    key={f.id}
                    floor={f}
                    onEdit={() => openEdit(f)}
                    onDelete={() => del.openDelete(f)}
                  />
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon={<Layers size={24} />}
              title={search ? "No floors match your search" : "No floors yet"}
              description={
                search
                  ? "Try a different building name or floor number."
                  : "Add the first floor to a building to get started."
              }
              action={
                !search ? (
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Plus size={14} />Add Floor
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden">
          {isLoading ? (
            <MobileLoadingSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Layers size={24} />}
              title={search ? "No floors match your search" : "No floors yet"}
              description={search ? "Try a different building name or floor number." : "Add the first floor to a building to get started."}
              action={!search ? <Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} />Add Floor</Button> : undefined}
            />
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {paginated.map((f) => (
                <FloorCard
                  key={f.id}
                  floor={f}
                  onEdit={() => openEdit(f)}
                  onDelete={() => del.openDelete(f)}
                />
              ))}
            </div>
          )}
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 dark:border-slate-800">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Showing {(page - 1) * ADMIN_TABLE_PAGE_SIZE + 1}–{Math.min(page * ADMIN_TABLE_PAGE_SIZE, filtered.length)} of {filtered.length} floors
            </p>
            <Pagination current={page} total={totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      <FloorFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        buildings={buildings}
        floor={editing}
      />

      <ConfirmDialog
        open={!!del.deleteTarget}
        onClose={del.closeDelete}
        onConfirm={handleDelete}
        title="Delete Floor"
        description={`Delete Floor ${del.deleteTarget?.floorNumber} in "${del.deleteTarget?.buildingName}"? All offices and panorama scenes on this floor will also be removed. This cannot be undone.`}
        danger
        loading={del.deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

const TABLE_HEADERS = ["Floor Number", "Building", "Actions"];

interface FloorRowProps {
  floor:    FloorWithBuilding;
  onEdit:   () => void;
  onDelete: () => void;
}

function FloorRow({ floor, onEdit, onDelete }: FloorRowProps) {
  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {floor.floorNumber === 0 ? "G" : floor.floorNumber}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatFloorLabel(floor.floorNumber)}
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-slate-400">{floor.buildingName}</span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton icon={<Pencil size={14} />} label="Edit"   hoverClass="hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-950/40" onClick={onEdit} />
          <ActionButton icon={<Trash2 size={14} />} label="Delete" hoverClass="hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40"    onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}

function FloorCard({ floor, onEdit, onDelete }: FloorRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
          {floor.floorNumber === 0 ? "G" : floor.floorNumber}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatFloorLabel(floor.floorNumber)}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
          <Layers size={11} className="text-gray-400 dark:text-slate-500" />{floor.buildingName}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <ActionButton icon={<Pencil size={14} />} label="Edit"   hoverClass="hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-950/40" onClick={onEdit} />
        <ActionButton icon={<Trash2 size={14} />} label="Delete" hoverClass="hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40"    onClick={onDelete} />
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
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
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
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
