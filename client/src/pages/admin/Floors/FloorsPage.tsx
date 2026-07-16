import { useEffect, useState, useMemo } from "react";
import { Layers, Pencil, Trash2, Plus, AlertCircle } from "lucide-react";
import {
  Card, TableToolbar, Pagination, EmptyState,
  Skeleton, ConfirmDialog, ToastContainer, Button,
} from "@/components/ui";
import { useFloors } from "@/hooks/useFloors";
import type { FloorWithBuilding } from "@/hooks/useFloors";
import { useToast } from "@/hooks/useToast";
import { FloorFormModal } from "./FloorFormModal";

const PAGE_SIZE = 8;

export function FloorsPage() {
  const {
    floors, buildings, isLoading, error,
    fetchFloors, createFloor, updateFloor, deleteFloor,
  } = useFloors();
  const { toasts, addToast, removeToast } = useToast();

  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [formOpen,     setFormOpen]     = useState(false);
  const [editing,      setEditing]      = useState<FloorWithBuilding | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FloorWithBuilding | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => { fetchFloors(); }, [fetchFloors]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return floors.filter(
      (f) =>
        f.buildingName.toLowerCase().includes(q) ||
        String(f.floorNumber).includes(q)
    );
  }, [floors, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(floor: FloorWithBuilding) {
    setEditing(floor);
    setFormOpen(true);
  }

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
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFloor(deleteTarget.id);
      addToast({ type: "success", message: `Floor ${deleteTarget.floorNumber} in "${deleteTarget.buildingName}" deleted.` });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Floors</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? "Loading…" : `${floors.length} floor${floors.length !== 1 ? "s" : ""} across all buildings`}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load floors</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchFloors}
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
                    onDelete={() => setDeleteTarget(f)}
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} floors
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
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Floor"
        description={`Delete Floor ${deleteTarget?.floorNumber} in "${deleteTarget?.buildingName}"? All offices and panorama scenes on this floor will also be removed. This cannot be undone.`}
        danger
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TABLE_HEADERS = ["Floor Number", "Building", "Actions"];

interface FloorRowProps {
  floor: FloorWithBuilding;
  onEdit: () => void;
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
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFloorLabel(n: number): string {
  if (n === 0) return "Ground Floor";
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th Floor`;
  switch (n % 10) {
    case 1:  return `${n}st Floor`;
    case 2:  return `${n}nd Floor`;
    case 3:  return `${n}rd Floor`;
    default: return `${n}th Floor`;
  }
}
