import { useState, useEffect, useMemo } from "react";
import { Modal, Input, Select, Textarea, Button } from "@/components/ui";
import type { Building, CreateOfficeBody, UpdateOfficeBody, FloorOption, OfficeWithContext } from "@/types";
import { formatFloorLabel } from "@/utils";

interface OfficeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (floorId: string, body: CreateOfficeBody | UpdateOfficeBody) => Promise<void>;
  buildings: Building[];
  floorOptions: FloorOption[];
  office?: OfficeWithContext | null;
}

const STATUS_OPTIONS = [
  { value: "true",  label: "Active" },
  { value: "false", label: "Inactive" },
];

function emptyForm(defaultBuildingId = "", defaultFloorId = "") {
  return {
    buildingId:  defaultBuildingId,
    floorId:     defaultFloorId,
    name:        "",
    roomNumber:  "",
    description: "",
    isActive:    "true",
  };
}

export function OfficeFormModal({
  open, onClose, onSubmit, buildings, floorOptions, office,
}: OfficeFormModalProps) {
  const isEdit = !!office;

  const [form,        setForm]        = useState(emptyForm());
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitError, setSubmitError] = useState("");

  // Floors filtered to the selected building
  const filteredFloors = useMemo(
    () => floorOptions.filter((f) => f.buildingId === form.buildingId),
    [floorOptions, form.buildingId]
  );

  const buildingSelectOptions = buildings.map((b) => ({ value: b.id, label: b.name }));
  const floorSelectOptions    = filteredFloors.map((f) => ({
    value: f.id,
    label: formatFloorLabel(f.floorNumber),
  }));

  // Populate / reset when modal opens
  useEffect(() => {
    if (office) {
      setForm({
        buildingId:  office.buildingId,
        floorId:     office.floorId,
        name:        office.name,
        roomNumber:  office.roomNumber,
        description: office.description ?? "",
        isActive:    String(office.isActive),
      });
    } else {
      const firstBuildingId = buildings[0]?.id ?? "";
      const firstFloorId    = floorOptions.find((f) => f.buildingId === firstBuildingId)?.id ?? "";
      setForm(emptyForm(firstBuildingId, firstFloorId));
    }
    setErrors({});
    setSubmitError("");
  }, [office, open, buildings, floorOptions]);

  // When building changes, reset floor to first floor of new building
  function handleBuildingChange(buildingId: string) {
    const firstFloor = floorOptions.find((f) => f.buildingId === buildingId);
    setForm((f) => ({ ...f, buildingId, floorId: firstFloor?.id ?? "" }));
    setErrors((e) => ({ ...e, buildingId: undefined, floorId: undefined }));
  }

  function handleChange(field: keyof typeof form) {
    return (value: string) => {
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.buildingId)         next.buildingId  = "Building is required.";
    if (!form.floorId)            next.floorId     = "Floor is required.";
    if (!form.name.trim())        next.name        = "Office name is required.";
    if (!form.roomNumber.trim())  next.roomNumber  = "Room number is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError("");
    try {
      const body: CreateOfficeBody | UpdateOfficeBody = {
        name:        form.name.trim(),
        roomNumber:  form.roomNumber.trim(),
        description: form.description.trim() || null,
        ...(isEdit ? { isActive: form.isActive === "true" } : {}),
      };
      await onSubmit(form.floorId, body);
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save office.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Office" : "Add Office"}
      size="md"
    >
      <div className="space-y-4">
        {/* Building → Floor cascade */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Select
              label="Building"
              options={buildingSelectOptions}
              value={form.buildingId}
              onChange={handleBuildingChange}
              disabled={saving || isEdit}
            />
            {errors.buildingId && (
              <p className="text-xs text-red-600">{errors.buildingId}</p>
            )}
            {isEdit && (
              <p className="text-xs text-gray-400">Cannot change building after creation.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Select
              label="Floor"
              options={floorSelectOptions.length ? floorSelectOptions : [{ value: "", label: "No floors available" }]}
              value={form.floorId}
              onChange={handleChange("floorId")}
              disabled={saving || isEdit || filteredFloors.length === 0}
            />
            {errors.floorId && (
              <p className="text-xs text-red-600">{errors.floorId}</p>
            )}
            {isEdit && (
              <p className="text-xs text-gray-400">Cannot change floor after creation.</p>
            )}
          </div>
        </div>

        {/* Office details */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Office Name"
            placeholder="e.g. Registrar's Office"
            value={form.name}
            onChange={handleChange("name")}
            disabled={saving}
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Room Number"
              placeholder="e.g. 204"
              value={form.roomNumber}
              onChange={handleChange("roomNumber")}
              disabled={saving}
            />
            {errors.roomNumber && (
              <p className="text-xs text-red-600">{errors.roomNumber}</p>
            )}
          </div>

          {isEdit && (
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.isActive}
              onChange={handleChange("isActive")}
              disabled={saving}
            />
          )}
        </div>

        <Textarea
          label="Description (optional)"
          placeholder="Brief description of this office…"
          value={form.description}
          onChange={handleChange("description")}
          rows={3}
        />

        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {submitError}
          </p>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Office"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


