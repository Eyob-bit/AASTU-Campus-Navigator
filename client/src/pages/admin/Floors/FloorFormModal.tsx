import { useState, useEffect } from "react";
import { Modal, Input, Select, Button } from "@/components/ui";
import type { Building } from "@/types";
import type { FloorWithBuilding } from "@/hooks/useFloors";

interface FloorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (buildingId: string, floorNumber: number) => Promise<void>;
  buildings: Building[];
  floor?: FloorWithBuilding | null; // null → create mode
}

function emptyForm(defaultBuildingId = "") {
  return { buildingId: defaultBuildingId, floorNumber: "" };
}

export function FloorFormModal({ open, onClose, onSubmit, buildings, floor }: FloorFormModalProps) {
  const isEdit = !!floor;

  const [form,        setForm]        = useState(emptyForm());
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<{ buildingId?: string; floorNumber?: string }>({});
  const [submitError, setSubmitError] = useState("");

  const buildingOptions = buildings.map((b) => ({ value: b.id, label: b.name }));

  useEffect(() => {
    if (floor) {
      setForm({ buildingId: floor.buildingId, floorNumber: String(floor.floorNumber) });
    } else {
      setForm(emptyForm(buildings[0]?.id ?? ""));
    }
    setErrors({});
    setSubmitError("");
  }, [floor, open, buildings]);

  function handleChange(field: keyof typeof form) {
    return (value: string) => {
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.buildingId)                              next.buildingId  = "Building is required.";
    const num = parseInt(form.floorNumber, 10);
    if (form.floorNumber.trim() === "")                next.floorNumber = "Floor number is required.";
    else if (isNaN(num) || !Number.isInteger(num))     next.floorNumber = "Must be a whole number.";
    else if (num < 0)                                  next.floorNumber = "Floor number must be 0 or greater.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError("");
    try {
      await onSubmit(form.buildingId, parseInt(form.floorNumber, 10));
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save floor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Floor" : "Add Floor"}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <Select
            label="Building"
            options={buildingOptions}
            value={form.buildingId}
            onChange={handleChange("buildingId")}
            disabled={saving || isEdit} // building can't change on edit
          />
          {errors.buildingId && (
            <p className="text-xs text-red-600">{errors.buildingId}</p>
          )}
          {isEdit && (
            <p className="text-xs text-gray-400">Building cannot be changed after creation.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            label="Floor Number"
            type="number"
            placeholder="e.g. 0 for ground floor, 1 for first floor"
            value={form.floorNumber}
            onChange={handleChange("floorNumber")}
            disabled={saving}
          />
          {errors.floorNumber && (
            <p className="text-xs text-red-600">{errors.floorNumber}</p>
          )}
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
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Floor"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
