import { useEffect, useState, useMemo } from "react";
import { Users, Pencil, Trash2, Plus, Mail, Phone } from "lucide-react";
import {
  Card, TableToolbar, Pagination, EmptyState,
  Skeleton, ConfirmDialog, ToastContainer, Button,
  ActionButton, ErrorBanner,
} from "@/components/ui";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { useStaff } from "@/hooks/useStaff";
import { useToast } from "@/hooks/useToast";
import { useTableSearch } from "@/hooks/useTableSearch";
import { usePagination } from "@/hooks/usePagination";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { StaffFormModal } from "./StaffFormModal";
import type { CreateStaffBody, UpdateStaffBody, StaffWithContext } from "@/types";
import { filterStaff, getTotalPages, paginate, formatFloorLabel } from "@/utils";
import { ADMIN_TABLE_PAGE_SIZE } from "@/constants/admin";

export function StaffPage() {
  const {
    staff, buildings, floorOptions, officeOptions,
    isLoading, error,
    fetchStaff, createStaff, updateStaff, deleteStaff,
  } = useStaff();
  const { toasts, addToast, removeToast } = useToast();
  const { search, setSearch } = useTableSearch({
    onSearchChange: () => setPage(1),
  });
  const del = useDeleteDialog<StaffWithContext>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState<StaffWithContext | null>(null);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const filtered   = useMemo(() => filterStaff(staff, search), [staff, search]);
  const totalPages = getTotalPages(filtered.length, ADMIN_TABLE_PAGE_SIZE);
  const { page, setPage } = usePagination(totalPages);
  const paginated  = paginate(filtered, page, ADMIN_TABLE_PAGE_SIZE);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(s: StaffWithContext) { setEditing(s); setFormOpen(true); }

  async function handleFormSubmit(officeId: string, body: CreateStaffBody | UpdateStaffBody) {
    try {
      if (editing) {
        await updateStaff(editing.id, body as UpdateStaffBody);
        addToast({ type: "success", message: "Staff member updated successfully." });
      } else {
        await createStaff(officeId, body as CreateStaffBody);
        addToast({ type: "success", message: "Staff member added successfully." });
      }
    } catch (err) {
      throw err; // StaffFormModal handles inline error
    }
  }

  async function handleDelete() {
    if (!del.deleteTarget) return;
    del.setDeleting(true);
    try {
      await deleteStaff(del.deleteTarget.id);
      addToast({ type: "success", message: `"${del.deleteTarget.fullName}" removed.` });
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
          <h1 className="text-xl font-bold text-gray-900">Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading
              ? "Loading…"
              : `${staff.length} staff member${staff.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <ErrorBanner title="Failed to load staff" message={error} onRetry={fetchStaff} />

      <Card>
        <TableToolbar
          search={search}
          setSearch={setSearch}
          onAdd={openCreate}
          addLabel="Add Staff"
          onRefresh={fetchStaff}
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
                {paginated.map((s) => (
                  <StaffRow
                    key={s.id}
                    member={s}
                    onEdit={() => openEdit(s)}
                    onDelete={() => del.openDelete(s)}
                  />
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon={<Users size={24} />}
              title={search ? "No staff match your search" : "No staff members yet"}
              description={
                search
                  ? "Try a different name, position, or office."
                  : "Add the first staff member to an office."
              }
              action={
                !search ? (
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Plus size={14} />Add Staff
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
              {filtered.length} staff members
            </p>
            <Pagination current={page} total={totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      <StaffFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        buildings={buildings}
        floorOptions={floorOptions}
        officeOptions={officeOptions}
        staff={editing}
      />

      <ConfirmDialog
        open={!!del.deleteTarget}
        onClose={del.closeDelete}
        onConfirm={handleDelete}
        title="Remove Staff Member"
        description={`Remove "${del.deleteTarget?.fullName}" from the system? This will not delete their login account if they have one.`}
        danger
        loading={del.deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TABLE_HEADERS = ["Full Name", "Position", "Office", "Floor", "Building", "Status", "Actions"];

interface StaffRowProps {
  member:   StaffWithContext;
  onEdit:   () => void;
  onDelete: () => void;
}

function StaffRow({ member, onEdit, onDelete }: StaffRowProps) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials(member.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{member.fullName}</p>
            {(member.email || member.phone) && (
              <div className="flex items-center gap-2 mt-0.5">
                {member.email && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Mail size={10} />{member.email}
                  </span>
                )}
                {member.phone && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Phone size={10} />{member.phone}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5 text-sm text-gray-600">{member.position}</td>

      <td className="px-4 py-3.5">
        <div>
          <p className="text-sm text-gray-700">{member.officeName}</p>
          <code className="text-[10px] font-mono text-gray-400">{member.roomNumber}</code>
        </div>
      </td>

      <td className="px-4 py-3.5 text-sm text-gray-600">
        {formatFloorLabel(member.floorNumber)}
      </td>

      <td className="px-4 py-3.5 text-sm text-gray-600">{member.buildingName}</td>

      <td className="px-4 py-3.5">
        <StatusBadge status={member.isActive ? "active" : "inactive"} />
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
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 flex-1 max-w-[160px]" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
