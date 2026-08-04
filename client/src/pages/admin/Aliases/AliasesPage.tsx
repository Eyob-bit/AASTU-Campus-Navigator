import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Trash2, Edit2, DoorOpen, Building2, Tag, RefreshCw } from "lucide-react";
import { Card, Button, Input, Modal, Skeleton } from "@/components/ui";
import { useAliases } from "@/hooks/useAliases";
import { useOffices } from "@/hooks/useOffices";
import type { AliasWithContext } from "@/types";

export function AliasesPage() {
  const { aliases, isLoading: aliasesLoading, error, fetchAliases, createOfficeAlias, updateAlias, deleteAlias } = useAliases();
  const { offices, isLoading: officesLoading, fetchOffices } = useOffices();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [newAliasText, setNewAliasText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit state
  const [editingAlias, setEditingAlias] = useState<AliasWithContext | null>(null);
  const [editAliasText, setEditAliasText] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAliases().catch(() => {});
    fetchOffices().catch(() => {});
  }, [fetchAliases, fetchOffices]);

  const filteredAliases = useMemo(() => {
    if (!searchQuery.trim()) return aliases;
    const q = searchQuery.toLowerCase();
    return aliases.filter(
      (a) =>
        a.alias.toLowerCase().includes(q) ||
        a.targetName.toLowerCase().includes(q) ||
        a.buildingName.toLowerCase().includes(q) ||
        (a.roomNumber && a.roomNumber.toLowerCase().includes(q))
    );
  }, [aliases, searchQuery]);

  async function handleAddAlias(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOfficeId) {
      setModalError("Please select a target office.");
      return;
    }
    if (!newAliasText.trim()) {
      setModalError("Please enter an alias keyword.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      await createOfficeAlias(selectedOfficeId, { alias: newAliasText.trim() });
      setIsAddModalOpen(false);
      setSelectedOfficeId("");
      setNewAliasText("");
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to add alias.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateAlias(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAlias || !editAliasText.trim()) return;

    setIsSubmitting(true);
    setModalError(null);
    try {
      await updateAlias(editingAlias.id, editAliasText.trim());
      setEditingAlias(null);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to update alias.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    try {
      await deleteAlias(deletingId);
    } finally {
      setDeletingId(null);
    }
  }

  const isLoading = aliasesLoading || officesLoading;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-8 py-6 sm:py-8 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Tag className="text-blue-600 dark:text-blue-400" size={24} />
            Search Aliases ⭐
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Map informal search queries (e.g. "add drop", "registrar", "transcript") directly to official campus destinations.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-xl font-semibold shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Add Search Alias
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={() => fetchAliases()} className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline">
              Retry
            </Button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <Card className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Input
              type="text"
              placeholder="Search by alias, office, or building..."
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              icon={<Search size={16} />}
              className="text-xs sm:text-sm rounded-xl border-gray-200 dark:border-slate-700 w-full"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
            <span className="font-semibold">{filteredAliases.length} aliases defined</span>
            <Button
              onClick={() => fetchAliases()}
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5 rounded-xl"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </Card>

        {/* Aliases Data Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredAliases.length === 0 ? (
            <div className="p-12 text-center">
              <Tag size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
              <p className="text-gray-900 dark:text-white font-semibold text-sm">No search aliases found</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No alias keywords matched your search term."
                  : "Add your first search alias to help students find campus offices by informal keywords."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl font-medium cursor-pointer"
                >
                  <Plus size={14} className="mr-1.5 inline" />
                  Add First Alias
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-800 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Official Destination</th>
                    <th className="py-3.5 px-6">Location</th>
                    <th className="py-3.5 px-6">Search Alias Keyword</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {filteredAliases.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <DoorOpen size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span>{item.targetName}</span>
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium px-2 py-0.5 rounded-full">
                            {item.targetType}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-gray-400 dark:text-slate-400" />
                          <span>{item.buildingName}</span>
                          {item.roomNumber && (
                            <span className="text-gray-400 dark:text-slate-400 font-mono text-xs">(Room {item.roomNumber})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono text-xs font-semibold rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                          <Tag size={12} className="text-amber-600 dark:text-amber-400" />
                          {item.alias}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Button
                          onClick={() => {
                            setEditingAlias(item);
                            setEditAliasText(item.alias);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          onClick={() => setDeletingId(item.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add Alias Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setModalError(null);
        }}
        title="Add Search Alias"
      >
        <form onSubmit={handleAddAlias} className="space-y-4 pt-2">
          {modalError && (
            <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs p-3 rounded-lg border border-red-200 dark:border-red-800">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Select Destination Office <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedOfficeId}
              onChange={(e) => setSelectedOfficeId(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose an office --</option>
              {offices.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} ({off.buildingName} • Room {off.roomNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Search Alias Keyword <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. registrar, registration, add drop"
              value={newAliasText}
              onChange={(val) => setNewAliasText(val)}
              className="text-xs sm:text-sm rounded-xl border-gray-200 dark:border-slate-700 w-full"
            />
            <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1">
              Users searching for this term will automatically land on this office.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="text-xs px-4 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl font-semibold cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create Alias"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Alias Modal */}
      <Modal
        open={!!editingAlias}
        onClose={() => setEditingAlias(null)}
        title="Edit Search Alias"
      >
        {editingAlias && (
          <form onSubmit={handleUpdateAlias} className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                Target Office: <strong className="text-gray-900 dark:text-white">{editingAlias.targetName}</strong> ({editingAlias.buildingName})
              </p>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Alias Keyword
              </label>
              <Input
                type="text"
                value={editAliasText}
                onChange={(val) => setEditAliasText(val)}
                className="text-xs sm:text-sm rounded-xl border-gray-200 dark:border-slate-700 w-full"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingAlias(null)}
                className="text-xs px-4 py-2 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-xl font-semibold cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Search Alias"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300">
            Are you sure you want to delete this search alias? Users will no longer be able to find this office using this keyword.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingId(null)}
              className="text-xs px-4 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-xl font-semibold cursor-pointer"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
