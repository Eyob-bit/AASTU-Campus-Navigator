import { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { MapPin } from "lucide-react";

import { Modal, Input, Select, Button } from "@/components/ui";
import { MapLocationPickerInner, CampusBoundaryPolygon, AASTU_CENTER } from "@/components/map";
import { TILE_LAYERS } from "@/components/map/CampusMap";
import type { TileMode } from "@/components/map/CampusMap";
import type { Building, CreateBuildingBody, UpdateBuildingBody } from "@/types";
import { roadNetworkApi, type RoadNode } from "@/api/roadNetwork.api";

interface BuildingFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBuildingBody | UpdateBuildingBody) => Promise<void>;
  building?: Building | null;
}

const STATUS_OPTIONS = [
  { value: "true",  label: "Active" },
  { value: "false", label: "Inactive" },
];

function emptyForm() {
  return { name: "", code: "", entranceLatitude: "", entranceLongitude: "", entranceRoadNodeId: "", isActive: "true" };
}

export function BuildingFormModal({ open, onClose, onSubmit, building }: BuildingFormModalProps) {
  const isEdit = !!building;

  const [form, setForm]           = useState(emptyForm());
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [tileMode, setTileMode] = useState<TileMode>("satellite");
  const [roadNodes, setRoadNodes] = useState<RoadNode[]>([]);

  useEffect(() => {
    roadNetworkApi.getNodes().then(setRoadNodes).catch(console.error);
  }, []);

  useEffect(() => {
    if (building) {
      setForm({
        name:              building.name,
        code:              building.code,
        entranceLatitude:  String(building.entranceLatitude),
        entranceLongitude: String(building.entranceLongitude),
        entranceRoadNodeId: building.entranceRoadNodeId || "",
        isActive:          String(building.isActive),
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

  function handleMapPick(lat: number, lng: number) {
    setForm((f) => ({
      ...f,
      entranceLatitude:  lat.toFixed(6),
      entranceLongitude: lng.toFixed(6),
    }));
    setErrors((e) => ({ ...e, entranceLatitude: undefined, entranceLongitude: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim())             next.name = "Name is required.";
    if (!form.code.trim())             next.code = "Code is required.";
    if (form.code.trim().length > 10)  next.code = "Code must be 10 characters or fewer.";
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
        name:              form.name.trim(),
        code:              form.code.trim().toUpperCase(),
        entranceLatitude:  parseFloat(form.entranceLatitude),
        entranceLongitude: parseFloat(form.entranceLongitude),
        entranceRoadNodeId: form.entranceRoadNodeId || null,
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

  const pickerLat = parseFloat(form.entranceLatitude) || AASTU_CENTER[0];
  const pickerLng = parseFloat(form.entranceLongitude) || AASTU_CENTER[1];

  const nodeOptions = [
    { value: "", label: "-- None (Auto-find nearest node) --" },
    ...roadNodes.map((n) => ({
      value: n.id,
      label: `${n.name} (${n.latitude.toFixed(4)}, ${n.longitude.toFixed(4)})`,
    })),
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Building" : "Add Building"} size="md">
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

        {/* Entrance Road Node Selection */}
        <div>
          <Select
            label="Entrance Road Node (Wayfinding Door)"
            options={nodeOptions}
            value={form.entranceRoadNodeId}
            onChange={handleChange("entranceRoadNodeId")}
            disabled={saving}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Connects outdoor GPS walking route directly to this entrance node.
          </p>
        </div>

        {/* Coordinates */}
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

        {/* Map picker */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-600" />
              Pick Entrance Location on AASTU Campus Map
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                🟡 AASTU Boundary
              </span>
              <span className="text-[11px] text-gray-500">Click map or drag pin</span>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-300 shadow-sm relative h-[240px] sm:h-[300px] w-full">
            <MapContainer
              center={[pickerLat, pickerLng]}
              zoom={18}
              minZoom={14}
              maxZoom={21}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                key={tileMode}
                attribution={TILE_LAYERS[tileMode].attribution}
                url={TILE_LAYERS[tileMode].url}
                maxNativeZoom={TILE_LAYERS[tileMode].maxNativeZoom}
                maxZoom={21}
              />
              <CampusBoundaryPolygon />
              <MapLocationPickerInner
                lat={pickerLat}
                lng={pickerLng}
                onChange={handleMapPick}
              />
            </MapContainer>
            {/* Satellite toggle overlay */}
            <button
              type="button"
              onClick={() => setTileMode((m) => m === "street" ? "satellite" : "street")}
              className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg shadow-lg backdrop-blur-md cursor-pointer transition-all active:scale-95"
              style={{ zIndex: 1000, background: tileMode === "satellite" ? "rgba(255,255,255,0.95)" : "rgba(11,19,43,0.95)", color: tileMode === "satellite" ? "#1e293b" : "#fff", border: tileMode === "satellite" ? "1px solid #cbd5e1" : "1px solid #475569" }}
            >
              {tileMode === "satellite" ? "🗺️ Street" : "🛰️ Satellite"}
            </button>
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {submitError}
          </p>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Building"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
