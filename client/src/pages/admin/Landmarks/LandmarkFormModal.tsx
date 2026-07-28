import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { MapPin } from "lucide-react";
import { Modal, Input, Select, Button } from "@/components/ui";
import { MapLocationPickerInner, CampusBoundaryPolygon, AASTU_CENTER, CATEGORY_CONFIG, TILE_LAYERS, type TileMode } from "@/components/map";
import type { Landmark, LandmarkCategory, CreateLandmarkBody, UpdateLandmarkBody } from "@/types";
import { buildingApi } from "@/api/building.api";

// ── Category options for Select ───────────────────────────────────────────────

const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => ({
  value,
  label: `${cfg.emoji} ${cfg.label}`,
}));

// ── Props ─────────────────────────────────────────────────────────────────────

interface LandmarkFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLandmarkBody | UpdateLandmarkBody) => Promise<void>;
  landmark?: Landmark | null;
}

function emptyForm() {
  return {
    name: "",
    description: "",
    category: "CUSTOM" as LandmarkCategory,
    latitude: "",
    longitude: "",
    icon: "",
    isVisible: "true",
    buildingId: "",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LandmarkFormModal({ open, onClose, onSubmit, landmark }: LandmarkFormModalProps) {
  const isEdit = !!landmark;

  const [form, setForm]               = useState(emptyForm());
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState<Partial<Record<keyof ReturnType<typeof emptyForm>, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [tileMode, setTileMode] = useState<TileMode>("satellite");

  // ── Fetch buildings for the dropdown ──────────────────────────────────────
  const [buildings, setBuildings] = useState<{ id: string; name: string; code: string }[]>([]);
  useEffect(() => {
    buildingApi.getAll().then((data) => {
      setBuildings(data.buildings.filter((b) => b.isActive !== false));
    }).catch(() => {/* non-critical */});
  }, []);

  const buildingOptions = useMemo(() => [
    { value: "", label: "— None (freestanding landmark) —" },
    ...buildings.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
  ], [buildings]);

  useEffect(() => {
    if (landmark) {
      setForm({
        name:        landmark.name,
        description: landmark.description ?? "",
        category:    landmark.category,
        latitude:    String(landmark.latitude),
        longitude:   String(landmark.longitude),
        icon:        landmark.icon ?? "",
        isVisible:   String(landmark.isVisible),
        buildingId:  landmark.buildingId ?? "",
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
    setSubmitError("");
  }, [landmark, open]);

  function set(field: keyof ReturnType<typeof emptyForm>) {
    return (value: string) => {
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  /** When a building is selected, auto-fill the name field */
  function handleBuildingSelect(buildingId: string) {
    setForm((f) => {
      const found = buildings.find((b) => b.id === buildingId);
      return {
        ...f,
        buildingId,
        // Auto-fill name only if the current name is empty or was previously a building name
        name: found ? found.name : f.name,
      };
    });
    setErrors((e) => ({ ...e, buildingId: undefined, name: undefined }));
  }

  function handleMapPick(lat: number, lng: number) {
    setForm((f) => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
    setErrors((e) => ({ ...e, latitude: undefined, longitude: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required.";
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || lat < -90  || lat > 90)   next.latitude  = "Valid latitude required (−90 to 90).";
    if (isNaN(lng) || lng < -180 || lng > 180)  next.longitude = "Valid longitude required (−180 to 180).";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError("");
    try {
      const payload: CreateLandmarkBody | UpdateLandmarkBody = {
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        category:    form.category,
        latitude:    parseFloat(form.latitude),
        longitude:   parseFloat(form.longitude),
        icon:        form.icon.trim() || undefined,
        isVisible:   form.isVisible === "true",
        buildingId:  form.buildingId || null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save landmark.");
    } finally {
      setSaving(false);
    }
  }

  const pickerLat = parseFloat(form.latitude)  || AASTU_CENTER[0];
  const pickerLng = parseFloat(form.longitude) || AASTU_CENTER[1];

  const VISIBILITY_OPTIONS = [
    { value: "true",  label: "Visible" },
    { value: "false", label: "Hidden" },
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Landmark" : "Add Landmark"} size="md">
      <div className="space-y-4">

        {/* Link to Building */}
        <div className="flex flex-col gap-1.5">
          <Select
            label="Link to Building (optional)"
            options={buildingOptions}
            value={form.buildingId}
            onChange={handleBuildingSelect}
            disabled={saving}
          />
          {form.buildingId && (
            <p className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
              🏢 The map marker name will always show the linked building's name as it appears in admin.
            </p>
          )}
        </div>

        {/* Name */}
        <Input
          label={form.buildingId ? "Landmark Name (used as fallback only)" : "Landmark Name"}
          placeholder="e.g. Main Cafeteria"
          value={form.name}
          onChange={set("name")}
          disabled={saving}
        />
        {errors.name && <p className="-mt-2 text-xs text-red-600">{errors.name}</p>}

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description (optional)</label>
          <textarea
            rows={2}
            placeholder="Short description of this landmark…"
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            disabled={saving}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Category + Icon row */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(v) => set("category")(v)}
            disabled={saving}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Icon (emoji)"
              placeholder="e.g. ☕ or 📚"
              value={form.icon}
              onChange={set("icon")}
              disabled={saving}
            />
            <p className="text-[10px] text-gray-400">Leave empty to use category default</p>
          </div>
        </div>

        {/* Visibility */}
        <Select
          label="Visibility"
          options={VISIBILITY_OPTIONS}
          value={form.isVisible}
          onChange={set("isVisible")}
          disabled={saving}
        />

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Latitude"
              placeholder="e.g. 8.8885"
              value={form.latitude}
              onChange={set("latitude")}
              disabled={saving}
            />
            {errors.latitude && <p className="text-xs text-red-600">{errors.latitude}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Input
              label="Longitude"
              placeholder="e.g. 38.8090"
              value={form.longitude}
              onChange={set("longitude")}
              disabled={saving}
            />
            {errors.longitude && <p className="text-xs text-red-600">{errors.longitude}</p>}
          </div>
        </div>

        {/* Map picker */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-600" />
              Pick Location on AASTU Campus Map
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
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Landmark"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
