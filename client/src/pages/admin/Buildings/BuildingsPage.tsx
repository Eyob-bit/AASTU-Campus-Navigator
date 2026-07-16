import { useEffect, useState, useMemo } from "react";
import { Building2, Pencil, Trash2, Plus, AlertCircle } from "lucide-react";
import {
  Card, TableToolbar, Pagination, EmptyState,
  Skeleton, ConfirmDialog, ToastContainer, Button,
} from "@/components/ui";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { useBuildings } from "@/hooks/useBuildings";
import { useToast } from "@/hooks/useToast";
import { BuildingFormModal } from "./BuildingFormModal";
import type { Building, CreateBuildingBody, UpdateBuildingBody } from "@/types";

const PAGE_SIZE = 8;

export function BuildingsPage() {
  const { buildings, isLoading, error, fetchBuildings, createBuilding, updateBuilding, deleteBuilding } =
    useBuildings();
  const { toasts, addToast, removeToast } = useToast();

  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [formOpen,    setFormOpen]    = useState(false);
  const [editing,     setEditing]     = useState<Building | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  useEffect(() => { fetchBuildings(); }, [fetchBuildings]);

  // Client-side search filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return buildings.filter(
      (b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
    );
  }, [buildings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [search]);

  // Clamp page when items are deleted and totalPages shrinks
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(building: Building) {
    setEditing(building);
    setFormOpen(true);
  }

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
      throw err; // modal handles the error display; no duplicate toast
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBuilding(deleteTarget.id);
      addToast({ type: "success", message: `"${deleteTarget.name}" deleted.` });
      setDeleteTarget(null);
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Delete failed." });
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buildings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? "Loading…" : `${buildings.length} building${buildings.length !== 1 ? "s" : ""} on campus`}
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load buildings</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchBuildings}
            className="ml-auto text-xs text-red-600 font-medium hover:underline"
          >
            Retry
          </button>
        </div>
      )}

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
                    onDelete={() => setDeleteTarget(b)}
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} buildings
            </p>
            <Pagination current={page} total={totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      {/* Create / Edit modal */}
      <BuildingFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        building={editing}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Building"
        description={`Delete "${deleteTarget?.name}"? This will also remove all floors, offices, and panorama scenes inside it. This action cannot be undone.`}
        danger
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCoordinate(value: number, axis: "lat" | "lng"): string {
  const abs = Math.abs(value).toFixed(4);
  if (axis === "lat") return value >= 0 ? `${abs}°N` : `${abs}°S`;
  return value >= 0 ? `${abs}°E` : `${abs}°W`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TABLE_HEADERS = ["Building Name", "Code", "Coordinates", "Status", "Actions"];

interface BuildingRowProps {
  building: Building;
  onEdit: () => void;
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
          <ActionBtn
            icon={<Pencil size={14} />}
            label="Edit"
            hoverClass="hover:text-amber-600 hover:bg-amber-50"
            onClick={onEdit}
          />
          <ActionBtn
            icon={<Trash2 size={14} />}
            label="Delete"
            hoverClass="hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}

interface ActionBtnProps {
  icon: React.ReactNode;
  label: string;
  hoverClass: string;
  onClick: () => void;
}

function ActionBtn({ icon, label, hoverClass, onClick }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 text-gray-400 rounded-lg transition-colors ${hoverClass}`}
    >
      {icon}
    </button>
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
