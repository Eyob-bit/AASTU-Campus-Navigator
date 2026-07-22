import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import type { SceneElement, SceneElementType, PanoramaScene, OfficeOption } from "@/types";

export interface DraftElement {
  type: SceneElementType;
  x:    number;
  y:    number;
}

export interface ElementSavePayload {
  type:        SceneElementType;
  x:           number;
  y:           number;
  rotation:    number | null;
  label:       string | null;
  officeId:    string | null;
  nextSceneId: string | null;
  isVisible:   boolean;
}

interface ElementPropertyPanelProps {
  /** Either a saved element (has id) or a fresh draft (no id) */
  element:  SceneElement | DraftElement;
  scenes:   PanoramaScene[];
  offices:  OfficeOption[];
  isSaving: boolean;
  onSave:   (payload: ElementSavePayload) => void;
  onCancel: () => void;
}

function isSceneElement(el: SceneElement | DraftElement): el is SceneElement {
  return "id" in el;
}

/**
 * Right-side property panel for a selected or newly-placed element.
 *
 * Fields shown depend on element type:
 *   ARROW        → Destination Scene + Rotation
 *   OFFICE_LABEL → Office dropdown + Label
 *   INFORMATION  → Label
 *
 * Calls onSave with the full payload; the parent decides API method.
 */
export function ElementPropertyPanel({
  element,
  scenes,
  offices,
  isSaving,
  onSave,
  onCancel,
}: ElementPropertyPanelProps) {
  const saved = isSceneElement(element) ? element : null;

  const [rotation,    setRotation]    = useState<string>(String(saved?.rotation ?? "0"));
  const [label,       setLabel]       = useState<string>(saved?.label ?? "");
  const [officeId,    setOfficeId]    = useState<string>(saved?.officeId ?? "");
  const [nextSceneId, setNextSceneId] = useState<string>(saved?.nextSceneId ?? "");

  // Reset form when a different element is selected
  useEffect(() => {
    setRotation(String(saved?.rotation ?? "0"));
    setLabel(saved?.label ?? "");
    setOfficeId(saved?.officeId ?? "");
    setNextSceneId(saved?.nextSceneId ?? "");
  }, [saved?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    onSave({
      type:        element.type,
      x:           element.x,
      y:           element.y,
      rotation:    element.type === "ARROW" ? (Number(rotation) || 0) : null,
      label:       label.trim() || null,
      officeId:    element.type === "OFFICE_LABEL" ? (officeId || null) : null,
      nextSceneId: element.type === "ARROW"        ? (nextSceneId || null) : null,
      isVisible:   true,
    });
  }

  const typeLabel: Record<SceneElementType, string> = {
    ARROW:        "Arrow (Navigation)",
    OFFICE_LABEL: "Office Label",
    INFORMATION:  "Information",
  };

  const sceneOptions  = scenes.map((s) => ({ value: s.id,       label: s.name }));
  const officeOptions = offices.map((o) => ({
    value: o.id,
    label: `${o.name} · ${o.buildingName} F${o.floorNumber}`,
  }));

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col bg-white border-l border-gray-100 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {saved ? "Edit Element" : "New Element"}
          </p>
          <h3 className="text-sm font-semibold text-gray-900 mt-0.5">
            {typeLabel[element.type]}
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 p-4 space-y-4">
        <div className="text-xs text-gray-400 font-mono">
          x: {element.x.toFixed(3)} · y: {element.y.toFixed(3)}
        </div>

        {element.type === "ARROW" && (
          <>
            <Select
              label="Destination Scene"
              options={[{ value: "", label: "— select scene —" }, ...sceneOptions]}
              value={nextSceneId}
              onChange={setNextSceneId}
            />
            <Input
              label="Rotation (0–360°)"
              type="number"
              placeholder="0"
              value={rotation}
              onChange={setRotation}
            />
          </>
        )}

        {element.type === "OFFICE_LABEL" && (
          <>
            <Select
              label="Office"
              options={[{ value: "", label: "— select office —" }, ...officeOptions]}
              value={officeId}
              onChange={setOfficeId}
            />
            <Input
              label="Label (optional override)"
              placeholder="Defaults to office name"
              value={label}
              onChange={setLabel}
            />
          </>
        )}

        {element.type === "INFORMATION" && (
          <Input
            label="Label"
            placeholder="Information text"
            value={label}
            onChange={setLabel}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : saved ? "Update" : "Place"}
        </Button>
      </div>
    </aside>
  );
}
