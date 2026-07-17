import { useEffect, useState, useMemo } from "react";
import { DoorOpen, Pencil, Trash2, Plus } from "lucide-react";
import {
  Card, TableToolbar, Pagination, EmptyState,
  Skeleton, ConfirmDialog, ToastContainer, Button,
  ActionButton, ErrorBanner,
} from "@/components/ui";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { useOffices } from "@/hooks/useOffices";
import { useToast } from "@/hooks/useToast";
import { useTableSearch } from "@/hooks/useTableSearch";
import { usePagination } from "@/hooks/usePagination";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { OfficeFormModal } from "./OfficeFormModal";
import type { CreateOfficeBody, UpdateOfficeBody, OfficeWithContext } from "@/types";
import { filterOffices, getTotalPages, paginate, formatFloorLabel } from "@/utils";
import { ADMIN_TABLE_PAGE_SIZE } from "@/constants/admin";

export function OfficesPage() {
  const {
    offices, buildings, floorOptions, isLoading, error,
    fetchOffices, createOffice, updateOffice, deleteOffice,
  } = useOffices();
  const { toasts, addToast, removeToast } = useToast();
  const { search, setSearch } = useTableSearch({
    onSearchChange: () => setPage(1),
  });
  const del = useDeleteDialog<OfficeWithContext>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState<OfficeWithContext | null>(null);

  useEffect(() => { fetchOffices(); }, [fetchOffices]);

  const filtered   = useMemo(() => filterOffices(offices, search), [offices, search]);
  const totalPages = getTotalPages(filtered.length, ADMIN_TABLE_PAGE_SIZE);
  const { page, setPage } = usePagination(totalPages);
  const paginated  = paginate(filtered, page, ADMIN_TABLE_PAGE_SIZE);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(o: OfficeWithContext) { setEditing(o); setFormOpen(true); }

  async function handleFormSubmit(floorId: string, body: CreateOfficeBody | UpdateOfficeBody) {
    try {
      if (editing) {
        await updateOffice(editing.id, body as UpdateOfficeBody);
        addToast({ type: "success", message: "Office updated successfully." });
      } else {
        await createOffice(floorId, body as CreateOfficeBody);
        addToast({ type: "success", message: "Office created successfully." });
      }
    } catch (err) {
      throw err; // OfficeFormModal handles inline error
    }
  }

  async function handleDelete() {
    if (!del.deleteTarget) return;
    del.setDeleting(true);
    try {
      await deleteOffice(del.deleteTarget.id);
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
          <h1 className="text-xl font-bold text-gray-900">Offices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading
              ? "Loading…"
              : `${offices.length} office${offices.length !== 1 ? "s" : ""} registered`}
          </p>
        </div>
      </div>

      <ErrorBanner title="Failed to load offices" message={error} onRetry={fetchOffices} />

      <Card>
        <TableToolbar
          search={search}
          setSearch={setSearch}
          onAdd={openCreate}
          addLabel="Add Office"
          onRefresh={fetchOffices}
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
                {paginated.map((o) => (
                  <OfficeRow
                    key={o.id}
                    office={o}
                    onEdit={() => openEdit(o)}
                    onDelete={() => del.openDelete(o)}
                  />
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon={<DoorOpen size={24} />}
              title={search ? "No offices match your search" : "No offices yet"}
              description={
                search
                  ? "Try a different name, room number, or building."
                  : "Add the first office to a floor to get started."
              }
              action={
                !search ? (
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Plus size={14} />Add Office
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * ADMIN_TABLE_PAGE_SIZE + 1}–{Math.min(page * ADMIN_TABLE_PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length} offices
            </p>
            <Pagination current={page} total={totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      <OfficeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        buildings={buildings}
        floorOptions={floorOptions}
        office={editing}
      />

      <ConfirmDialog
        open={!!del.deleteTarget}
        onClose={del.closeDelete}
        onConfirm={handleDelete}
        title="Delete Office"
        description={`Delete "${del.deleteTarget?.name}" (Room ${del.deleteTarget?.roomNumber})? Any staff members linked to this office will need reassignment. This cannot be undone.`}
        danger
        loading={del.deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TABLE_HEADERS = ["Office", "Room", "Floor", "Building", "Status", "Actions"];

interface OfficeRowProps {
  office:   OfficeWithContext;
  onEdit:   () => void;
  onDelete: () => void;
}

function OfficeRow({ office, onEdit, onDelete }: OfficeRowProps) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <DoorOpen size={15} className="text-violet-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">{office.name}</span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
          {office.roomNumber}
        </code>
      </td>

      <td className="px-4 py-3.5 text-sm text-gray-600">
        {formatFloorLabel(office.floorNumber)}
      </td>

      <td className="px-4 py-3.5 text-sm text-gray-600">{office.buildingName}</td>

      <td className="px-4 py-3.5">
        <StatusBadge status={office.isActive ? "active" : "inactive"} />
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
          <Skeleton className="h-4 flex-1 max-w-[180px]" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
