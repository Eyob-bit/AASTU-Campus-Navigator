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
import { useResetPageOnSearch } from "@/hooks/useResetPageOnSearch";
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
  const { search, setSearch } = useTableSearch();
  const del = useDeleteDialog<OfficeWithContext>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState<OfficeWithContext | null>(null);

  useEffect(() => { fetchOffices(); }, [fetchOffices]);

  const filtered   = useMemo(() => filterOffices(offices, search), [offices, search]);
  const totalPages = getTotalPages(filtered.length, ADMIN_TABLE_PAGE_SIZE);
  const { page, setPage } = usePagination(totalPages);
  useResetPageOnSearch(search, setPage);
  const paginated  = paginate(filtered, page, ADMIN_TABLE_PAGE_SIZE);

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
      throw err;
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

  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Offices</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
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

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
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

        {/* Mobile card list */}
        <div className="sm:hidden">
          {isLoading ? (
            <MobileLoadingSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<DoorOpen size={24} />}
              title={search ? "No offices match your search" : "No offices yet"}
              description={search ? "Try a different name, room number, or building." : "Add the first office to a floor to get started."}
              action={!search ? <Button variant="primary" size="sm" onClick={openCreate}><Plus size={14} />Add Office</Button> : undefined}
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {paginated.map((o) => (
                <OfficeCard
                  key={o.id}
                  office={o}
                  onEdit={() => openEdit(o)}
                  onDelete={() => del.openDelete(o)}
                />
              ))}
            </div>
          )}
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * ADMIN_TABLE_PAGE_SIZE + 1}–{Math.min(page * ADMIN_TABLE_PAGE_SIZE, filtered.length)} of {filtered.length} offices
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

function OfficeCard({ office, onEdit, onDelete }: OfficeRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <DoorOpen size={16} className="text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{office.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <code className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{office.roomNumber}</code>
          <span className="text-[10px] text-gray-500">{office.buildingName} · {formatFloorLabel(office.floorNumber)}</span>
          <StatusBadge status={office.isActive ? "active" : "inactive"} />
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <ActionButton icon={<Pencil size={14} />} label="Edit"   hoverClass="hover:text-amber-600 hover:bg-amber-50" onClick={onEdit} />
        <ActionButton icon={<Trash2 size={14} />} label="Delete" hoverClass="hover:text-red-600 hover:bg-red-50"    onClick={onDelete} />
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
