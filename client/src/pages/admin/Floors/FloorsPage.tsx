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
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { FloorFormModal } from "./FloorFormModal";
import { filterFloors, getTotalPages, paginate, formatFloorLabel } from "@/utils";
import { ADMIN_TABLE_PAGE_SIZE } from "@/constants/admin";

export function FloorsPage() {
  const {
    floors, buildings, isLoading, error,
    fetchFloors, createFloor, updateFloor, deleteFloor,
  } = useFloors();
  const { toasts, addToast, removeToast } = useToast();
  const { search, setSearch } = useTableSearch({
    onSearchChange: () => setPage(1),
  });
  const del = useDeleteDialog<FloorWithBuilding>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState<FloorWithBuilding | null>(null);

  useEffect(() => { fetchFloors(); }, [fetchFloors]);

  const filtered   = useMemo(() => filterFloors(floors, search), [floors, search]);
  const totalPages = getTotalPages(filtered.length, ADMIN_TABLE_PAGE_SIZE);
  const { page, setPage } = usePagination(totalPages);
  const paginated  = paginate(filtered, page, ADMIN_TABLE_PAGE_SIZE);

  // ── Handlers ────────────────────────────────────────────────────────────────

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
      throw err; // FloorFormModal handles the inline error display
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Floors</h1>
          <p className="text-sm text-gray-500 mt-0.5">
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
        />

        <div className="overflow-x-auto">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
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

        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
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

// ── Sub-components ────────────────────────────────────────────────────────────

const TABLE_HEADERS = ["Floor Number", "Building", "Actions"];

interface FloorRowProps {
  floor:    FloorWithBuilding;
  onEdit:   () => void;
  onDelete: () => void;
}

function FloorRow({ floor, onEdit, onDelete }: FloorRowProps) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-600">
              {floor.floorNumber === 0 ? "G" : floor.floorNumber}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatFloorLabel(floor.floorNumber)}
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600">{floor.buildingName}</span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton icon={<Pencil size={14} />} label="Edit"   hoverClass="hover:text-amber-600 hover:bg-amber-50" onClick={onEdit} />
          <ActionButton icon={<Trash2 size={14} />} label="Delete" hoverClass="hover:text-red-600 hover:bg-red-50"    onClick={onDelete} />
        </div>
      </td>
    </tr>
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
