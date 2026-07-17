import { useEffect, useState, useMemo } from "react";
import { Building2, Pencil, Trash2, Plus } from "lucide-react";
import {
  Card, TableToolbar, Pagination, EmptyState,
  Skeleton, ConfirmDialog, ToastContainer, Button,
  ActionButton, ErrorBanner,
} from "@/components/ui";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { useBuildings } from "@/hooks/useBuildings";
import { useToast } from "@/hooks/useToast";
import { useTableSearch } from "@/hooks/useTableSearch";
import { usePagination } from "@/hooks/usePagination";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { BuildingFormModal } from "./BuildingFormModal";
import type { Building, CreateBuildingBody, UpdateBuildingBody } from "@/types";
import { filterBuildings, getTotalPages, paginate } from "@/utils";
import { ADMIN_TABLE_PAGE_SIZE } from "@/constants/admin";

export function BuildingsPage() {
  const { buildings, isLoading, error, fetchBuildings, createBuilding, updateBuilding, deleteBuilding } =
    useBuildings();
  const { toasts, addToast, removeToast } = useToast();
  const { search, setSearch } = useTableSearch({
    onSearchChange: () => setPage(1),
  });
  const del = useDeleteDialog<Building>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState<Building | null>(null);

  useEffect(() => { fetchBuildings(); }, [fetchBuildings]);

  const filtered   = useMemo(() => filterBuildings(buildings, search), [buildings, search]);
  const totalPages = getTotalPages(filtered.length, ADMIN_TABLE_PAGE_SIZE);
  const { page, setPage } = usePagination(totalPages);
  const paginated  = paginate(filtered, page, ADMIN_TABLE_PAGE_SIZE);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(b: Building) { setEditing(b); setFormOpen(true); }

  async function handleFormSubmit(data: CreateBuildingBody | UpdateBuildingBody) {
    try {
      if (editing) {
        await updateBuilding(editing.id, data as UpdateBuildingBody);
        addToast({ type: "success", message: "Building updated successfully." });
      } else {
        await createBuilding(data as CreateBuildingBody);
        addToast({ type: "success", message: "Building created successfully." });
      }
    } catch (err) {
      throw err; // modal handles the inline error display
    }
  }

  async function handleDelete() {
    if (!del.deleteTarget) return;
    del.setDeleting(true);
    try {
      await deleteBuilding(del.deleteTarget.id);
      addToast({ type: "success", message: `"${del.deleteTarget.name}" deleted.` });
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
          <h1 className="text-xl font-bold text-gray-900">Buildings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? "Loading…" : `${buildings.length} building${buildings.length !== 1 ? "s" : ""} on campus`}
          </p>
        </div>
      </div>

      <ErrorBanner title="Failed to load buildings" message={error} onRetry={fetchBuildings} />

      <Card>
        <TableToolbar
          search={search}
          setSearch={setSearch}
          onAdd={openCreate}
          addLabel="Add Building"
          onRefresh={fetchBuildings}
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
                {paginated.map((b) => (
                  <BuildingRow
                    key={b.id}
                    building={b}
                    onEdit={() => openEdit(b)}
                    onDelete={() => del.openDelete(b)}
                  />
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon={<Building2 size={24} />}
              title={search ? "No buildings match your search" : "No buildings yet"}
              description={
                search
                  ? "Try a different name or code."
                  : "Add your first building to get started."
              }
              action={
                !search ? (
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Plus size={14} />Add Building
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * ADMIN_TABLE_PAGE_SIZE + 1}–{Math.min(page * ADMIN_TABLE_PAGE_SIZE, filtered.length)} of {filtered.length} buildings
            </p>
            <Pagination current={page} total={totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      <BuildingFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        building={editing}
      />

      <ConfirmDialog
        open={!!del.deleteTarget}
        onClose={del.closeDelete}
        onConfirm={handleDelete}
        title="Delete Building"
        description={`Delete "${del.deleteTarget?.name}"? This will also remove all floors, offices, and panorama scenes inside it. This action cannot be undone.`}
        danger
        loading={del.deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TABLE_HEADERS = ["Building Name", "Code", "Coordinates", "Status", "Actions"];

function formatCoordinate(value: number, axis: "lat" | "lng"): string {
  const abs = Math.abs(value).toFixed(4);
  if (axis === "lat") return value >= 0 ? `${abs}°N` : `${abs}°S`;
  return value >= 0 ? `${abs}°E` : `${abs}°W`;
}

interface BuildingRowProps {
  building: Building;
  onEdit:   () => void;
  onDelete: () => void;
}

function BuildingRow({ building, onEdit, onDelete }: BuildingRowProps) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={15} className="text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">{building.name}</span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
          {building.code}
        </code>
      </td>

      <td className="px-4 py-3.5 text-xs font-mono text-gray-500">
        {formatCoordinate(building.entranceLatitude, "lat")}&nbsp;{formatCoordinate(building.entranceLongitude, "lng")}
      </td>

      <td className="px-4 py-3.5">
        <StatusBadge status={building.isActive ? "active" : "inactive"} />
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
          <Skeleton className="h-4 flex-1 max-w-[220px]" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
