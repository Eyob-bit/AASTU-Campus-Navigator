import { useState, useEffect } from "react";
import { Modal, Input, Select, Button } from "@/components/ui";
import type { Building, CreateBuildingBody, UpdateBuildingBody } from "@/types";

interface BuildingFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBuildingBody | UpdateBuildingBody) => Promise<void>;
  building?: Building | null; // null → create mode
}

const STATUS_OPTIONS = [
  { value: "true",  label: "Active" },
  { value: "false", label: "Inactive" },
];

function emptyForm() {
  return { name: "", code: "", entranceLatitude: "", entranceLongitude: "", isActive: "true" };
}

export function BuildingFormModal({ open, onClose, onSubmit, building }: BuildingFormModalProps) {
  const isEdit = !!building;

  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitError, setSubmitError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (building) {
      setForm({
        name:               building.name,
        code:               building.code,
        entranceLatitude:   String(building.entranceLatitude),
        entranceLongitude:  String(building.entranceLongitude),
        isActive:           String(building.isActive),
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
    setSubmitError("");
  }, [building, open]);

  function handleChange(field: keyof typeof form) {
    return (value: string) => {
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim())               next.name = "Name is required.";
    if (!form.code.trim())               next.code = "Code is required.";
    if (form.code.trim().length > 10)    next.code = "Code must be 10 characters or fewer.";
    const lat = parseFloat(form.entranceLatitude);
    const lng = parseFloat(form.entranceLongitude);
    if (isNaN(lat) || lat < -90  || lat > 90)   next.entranceLatitude  = "Valid latitude required (−90 to 90).";
    if (isNaN(lng) || lng < -180 || lng > 180)  next.entranceLongitude = "Valid longitude required (−180 to 180).";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError("");
    try {
      const payload: CreateBuildingBody | UpdateBuildingBody = {
        name:               form.name.trim(),
        code:               form.code.trim().toUpperCase(),
        entranceLatitude:   parseFloat(form.entranceLatitude),
        entranceLongitude:  parseFloat(form.entranceLongitude),
        ...(isEdit ? { isActive: form.isActive === "true" } : {}),
      };
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save building.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Building" : "Add Building"}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Building Name"
            placeholder="e.g. Main Academic Block"
            value={form.name}
            onChange={handleChange("name")}
            className="col-span-2"
            disabled={saving}
          />
          {errors.name && <p className="col-span-2 -mt-2 text-xs text-red-600">{errors.name}</p>}

          <div className="flex flex-col gap-1.5">
            <Input
              label="Building Code"
              placeholder="e.g. MAB"
              value={form.code}
              onChange={handleChange("code")}
              disabled={saving}
            />
            {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Entrance Latitude"
              placeholder="e.g. 8.8836"
              value={form.entranceLatitude}
              onChange={handleChange("entranceLatitude")}
              disabled={saving}
            />
            {errors.entranceLatitude && (
              <p className="text-xs text-red-600">{errors.entranceLatitude}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Input
              label="Entrance Longitude"
              placeholder="e.g. 38.8074"
              value={form.entranceLongitude}
              onChange={handleChange("entranceLongitude")}
              disabled={saving}
            />
            {errors.entranceLongitude && (
              <p className="text-xs text-red-600">{errors.entranceLongitude}</p>
            )}
          </div>
        </div>

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
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Building"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
