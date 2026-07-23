import { useState, useEffect, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Modal, Input, Select, Button, Switch } from "@/components/ui";
import type { FloorOption } from "@/types";
import type { SceneWithContext } from "@/hooks/usePanoramas";

interface SceneFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (floorId: string, formData: FormData) => Promise<void>;
  floorOptions: FloorOption[];
  /** Null → create mode; non-null → edit mode */
  scene?: SceneWithContext | null;
  /** Pre-select a floor when opening in create mode */
  defaultFloorId?: string;
}

interface FormState {
  floorId: string;
  name: string;
  key: string;
  displayOrder: string;
  isEntryScene: boolean;
}

function emptyForm(defaultFloorId = ""): FormState {
  return { floorId: defaultFloorId, name: "", key: "", displayOrder: "0", isEntryScene: false };
}

/** Converts a human-readable name into a URL-safe scene key. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function SceneFormModal({
  open,
  onClose,
  onSubmit,
  floorOptions,
  scene,
  defaultFloorId = "",
}: SceneFormModalProps) {
  const isEdit = !!scene;

  const [form,        setForm]        = useState<FormState>(emptyForm(defaultFloorId));
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<Partial<Record<keyof FormState | "image", string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [imageFile,   setImageFile]   = useState<File | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [isDragging,  setIsDragging]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build floor options for the select
  const floorSelectOptions = floorOptions.map((f) => ({
    value: f.id,
    label: `${f.buildingName} — Floor ${f.floorNumber === 0 ? "G" : f.floorNumber}`,
  }));

  // Reset form when modal opens / scene changes
  useEffect(() => {
    if (!open) return;
    if (scene) {
      setForm({
        floorId:      scene.floorId,
        name:         scene.name,
        key:          scene.key,
        displayOrder: String(scene.displayOrder),
        isEntryScene: scene.isEntryScene,
      });
    } else {
      setForm(emptyForm(defaultFloorId || floorOptions[0]?.id || ""));
    }
    setErrors({});
    setSubmitError("");
    setImageFile(null);
    setPreviewUrl(null);
  }, [open, scene, defaultFloorId, floorOptions]);

  // Revoke object URL on unmount / file change
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // Auto-slugify key from name when key hasn't been manually edited
  const [keyEdited, setKeyEdited] = useState(false);
  useEffect(() => {
    if (!isEdit && !keyEdited && form.name) {
      setForm((f) => ({ ...f, key: slugify(f.name) }));
    }
  }, [form.name, isEdit, keyEdited]);

  function handleChange(field: keyof FormState) {
    return (value: string | boolean) => {
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
      if (field === "key") setKeyEdited(true);
    };
  }

  function handleFile(file: File | null) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setErrors((e) => ({ ...e, image: "Only JPG, PNG, or WebP images are allowed." }));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrors((e) => ({ ...e, image: "File must not exceed 20 MB." }));
      return;
    }
    setErrors((e) => ({ ...e, image: undefined }));
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0] ?? null;
    handleFile(file);
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.floorId)                                  next.floorId      = "Floor is required.";
    if (!form.name.trim())                              next.name         = "Scene name is required.";
    if (!form.key.trim())                               next.key          = "Scene key is required.";
    const order = parseInt(form.displayOrder, 10);
    if (isNaN(order) || order < 0)                      next.displayOrder = "Must be a non-negative integer.";
    if (!isEdit && !imageFile)                          next.image        = "A panorama image is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("name",         form.name.trim());
      fd.append("key",          form.key.trim());
      fd.append("displayOrder", form.displayOrder);
      fd.append("isEntryScene", String(form.isEntryScene));
      if (imageFile) fd.append("image", imageFile);

      await onSubmit(form.floorId, fd);
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save scene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Scene" : "Upload Panorama Scene"}
      size="md"
    >
      <div className="space-y-5">

        {/* Floor selector (create only) */}
        {!isEdit && (
          <div className="flex flex-col gap-1.5">
            <Select
              label="Floor"
              options={floorSelectOptions}
              value={form.floorId}
              onChange={handleChange("floorId")}
              disabled={saving}
            />
            {errors.floorId && <p className="text-xs text-red-600">{errors.floorId}</p>}
          </div>
        )}

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Scene Name"
            placeholder="e.g. Main Corridor Ground Floor"
            value={form.name}
            onChange={handleChange("name")}
            disabled={saving}
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        </div>

        {/* Key */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Scene Key"
            placeholder="e.g. main-corridor-ground"
            value={form.key}
            onChange={(v) => { handleChange("key")(v); }}
            disabled={saving}
          />
          <p className="text-xs text-gray-400">
            Unique identifier used internally. Auto-generated from name; can be customised.
          </p>
          {errors.key && <p className="text-xs text-red-600">{errors.key}</p>}
        </div>

        {/* Display order + Entry scene */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
          <div className="flex flex-col gap-1.5 sm:w-32">
            <Input
              label="Display Order"
              type="number"
              placeholder="0"
              value={form.displayOrder}
              onChange={handleChange("displayOrder")}
              disabled={saving}
            />
            {errors.displayOrder && <p className="text-xs text-red-600">{errors.displayOrder}</p>}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-sm font-medium text-gray-700">Entry Scene</span>
            <Switch
              checked={form.isEntryScene}
              onChange={(v) => handleChange("isEntryScene")(v)}
            />
            <p className="text-xs text-gray-400">
              The entry scene is the first scene users see when opening this floor in the navigator.
            </p>
          </div>
        </div>

        {/* Image dropzone */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">
            Panorama Image{isEdit ? " (leave empty to keep current)" : ""}
          </span>
          <div
            className={`
              relative border-2 border-dashed rounded-xl transition-colors cursor-pointer
              ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {previewUrl ? (
              <div className="relative h-40 overflow-hidden rounded-xl">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium">Click to replace</p>
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreviewUrl(null); }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  {isDragging ? <Upload size={20} className="text-indigo-600 animate-bounce" /> : <ImageIcon size={20} className="text-indigo-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? "Drop your image here" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, or WebP · max 20 MB</p>
                </div>
              </div>
            )}
          </div>
          {errors.image && <p className="text-xs text-red-600">{errors.image}</p>}
        </div>

        {/* Submit error */}
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Upload Scene"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
