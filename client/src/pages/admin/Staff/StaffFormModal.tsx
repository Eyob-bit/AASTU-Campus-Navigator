import { useState, useEffect, useMemo } from "react";
import { Mail, Phone } from "lucide-react";
import { Modal, Input, Select, Button } from "@/components/ui";
import type { Building, CreateStaffBody, UpdateStaffBody, StaffWithContext, OfficeOption, FloorOption } from "@/types";
import { formatFloorLabel } from "@/utils";

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (officeId: string, body: CreateStaffBody | UpdateStaffBody) => Promise<void>;
  buildings: Building[];
  floorOptions: FloorOption[];
  officeOptions: OfficeOption[];
  staff?: StaffWithContext | null;
}

const STATUS_OPTIONS = [
  { value: "true",  label: "Active" },
  { value: "false", label: "Inactive" },
];

function emptyForm(buildingId = "", floorId = "", officeId = "") {
  return {
    buildingId,
    floorId,
    officeId,
    fullName:  "",
    position:  "",
    email:     "",
    phone:     "",
    isActive:  "true",
  };
}

export function StaffFormModal({
  open, onClose, onSubmit, buildings, floorOptions, officeOptions, staff,
}: StaffFormModalProps) {
  const isEdit = !!staff;

  const [form,        setForm]        = useState(emptyForm());
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitError, setSubmitError] = useState("");

  // Cascade: floors filtered by selected building
  const filteredFloors = useMemo(
    () => floorOptions.filter((f) => f.buildingId === form.buildingId),
    [floorOptions, form.buildingId]
  );

  // Cascade: offices filtered by selected floor
  const filteredOffices = useMemo(
    () => officeOptions.filter((o) => o.floorId === form.floorId),
    [officeOptions, form.floorId]
  );

  const buildingSelectOptions = buildings.map((b) => ({ value: b.id, label: b.name }));
  const floorSelectOptions    = filteredFloors.map((f) => ({
    value: f.id,
    label: formatFloorLabel(f.floorNumber),
  }));
  const officeSelectOptions   = filteredOffices.map((o) => ({
    value: o.id,
    label: `${o.name} (${o.roomNumber})`,
  }));

  // Populate / reset on open
  useEffect(() => {
    if (staff) {
      setForm({
        buildingId: staff.buildingId,
        floorId:    staff.floorId,
        officeId:   staff.officeId,
        fullName:   staff.fullName,
        position:   staff.position,
        email:      staff.email    ?? "",
        phone:      staff.phone    ?? "",
        isActive:   String(staff.isActive),
      });
    } else {
      const firstBuildingId = buildings[0]?.id ?? "";
      const firstFloor      = floorOptions.find((f) => f.buildingId === firstBuildingId);
      const firstOffice     = officeOptions.find((o) => o.floorId === firstFloor?.id);
      setForm(emptyForm(firstBuildingId, firstFloor?.id ?? "", firstOffice?.id ?? ""));
    }
    setErrors({});
    setSubmitError("");
  }, [staff, open, buildings, floorOptions, officeOptions]);

  // Building change → reset floor + office
  function handleBuildingChange(buildingId: string) {
    const firstFloor  = floorOptions.find((f) => f.buildingId === buildingId);
    const firstOffice = officeOptions.find((o) => o.floorId === firstFloor?.id);
    setForm((f) => ({ ...f, buildingId, floorId: firstFloor?.id ?? "", officeId: firstOffice?.id ?? "" }));
    setErrors((e) => ({ ...e, buildingId: undefined, floorId: undefined, officeId: undefined }));
  }

  // Floor change → reset office
  function handleFloorChange(floorId: string) {
    const firstOffice = officeOptions.find((o) => o.floorId === floorId);
    setForm((f) => ({ ...f, floorId, officeId: firstOffice?.id ?? "" }));
    setErrors((e) => ({ ...e, floorId: undefined, officeId: undefined }));
  }

  function handleChange(field: keyof typeof form) {
    return (value: string) => {
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.buildingId)       next.buildingId = "Building is required.";
    if (!form.floorId)          next.floorId    = "Floor is required.";
    if (!form.officeId)         next.officeId   = "Office is required.";
    if (!form.fullName.trim())  next.fullName   = "Full name is required.";
    if (!form.position.trim())  next.position   = "Position is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError("");
    try {
      const body: CreateStaffBody | UpdateStaffBody = {
        fullName: form.fullName.trim(),
        position: form.position.trim(),
        email:    form.email.trim()  || null,
        phone:    form.phone.trim()  || null,
        ...(isEdit ? { isActive: form.isActive === "true" } : {}),
      };
      await onSubmit(form.officeId, body);
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save staff member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Staff Member" : "Add Staff Member"}
      size="md"
    >
      <div className="space-y-4">
        {/* Building → Floor → Office cascade */}
        <div className="grid grid-cols-3 gap-3">
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Select
              label="Floor"
              options={
                filteredFloors.length
                  ? floorSelectOptions
                  : [{ value: "", label: "No floors" }]
              }
              value={form.floorId}
              onChange={handleFloorChange}
              disabled={saving || isEdit || filteredFloors.length === 0}
            />
            {errors.floorId && (
              <p className="text-xs text-red-600">{errors.floorId}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Select
              label="Office"
              options={
                filteredOffices.length
                  ? officeSelectOptions
                  : [{ value: "", label: "No offices" }]
              }
              value={form.officeId}
              onChange={handleChange("officeId")}
              disabled={saving || isEdit || filteredOffices.length === 0}
            />
            {errors.officeId && (
              <p className="text-xs text-red-600">{errors.officeId}</p>
            )}
          </div>
        </div>

        {isEdit && (
          <p className="text-xs text-gray-400 -mt-2">
            Building, floor, and office cannot be changed after creation.
          </p>
        )}

        {/* Personal details */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Abebe Girma"
            value={form.fullName}
            onChange={handleChange("fullName")}
            disabled={saving}
          />
          {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Position / Title"
              placeholder="e.g. Dean"
              value={form.position}
              onChange={handleChange("position")}
              disabled={saving}
            />
            {errors.position && <p className="text-xs text-red-600">{errors.position}</p>}
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
          <Input
            label="Email (optional)"
            type="email"
            placeholder="name@aastu.edu.et"
            value={form.email}
            onChange={handleChange("email")}
            icon={<Mail size={14} />}
            disabled={saving}
          />
          <Input
            label="Phone (optional)"
            placeholder="+251-911-XXXXXX"
            value={form.phone}
            onChange={handleChange("phone")}
            icon={<Phone size={14} />}
            disabled={saving}
          />
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
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Staff Member"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


