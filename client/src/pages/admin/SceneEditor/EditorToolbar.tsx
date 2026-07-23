import { ArrowRight, Building2, Info, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type { SceneElementType } from "@/types";

export type ActiveTool = SceneElementType | null;

interface ToolButtonProps {
  icon:      React.ReactNode;
  label:     string;
  active:    boolean;
  onClick:   () => void;
  danger?:   boolean;
  disabled?: boolean;
}

function ToolButton({ icon, label, active, onClick, danger, disabled }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
        "focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed",
        danger && active && "bg-red-50 text-red-600 ring-red-300",
        danger && !active && "text-gray-500 hover:bg-red-50 hover:text-red-600",
        !danger &&  active && "bg-blue-50 text-blue-700 ring-blue-300 ring-2",
        !danger && !active && "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface EditorToolbarProps {
  activeTool:        ActiveTool;
  onToolSelect:      (tool: ActiveTool) => void;
  selectedElementId: string | null;
  onDeleteSelected:  () => void;
}

/**
 * Vertical toolbar on the left side of the Scene Editor.
 *
 * Three placement tools (ARROW, OFFICE_LABEL, INFORMATION) act as
 * radio buttons — clicking an active tool deselects it.
 * The Delete button is enabled only when an element is selected.
 */
export function EditorToolbar({
  activeTool,
  onToolSelect,
  selectedElementId,
  onDeleteSelected,
}: EditorToolbarProps) {
  function toggleTool(tool: ActiveTool) {
    onToolSelect(activeTool === tool ? null : tool);
  }

  return (
    <div className="w-20 flex-shrink-0 flex flex-col gap-1 p-2 bg-white border-r border-gray-100">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 pt-1 pb-0.5">
        Place
      </p>
      <ToolButton
        icon={<ArrowRight size={18} />}
        label="Arrow"
        active={activeTool === "ARROW"}
        onClick={() => toggleTool("ARROW")}
      />
      <ToolButton
        icon={<Building2 size={18} />}
        label="Label"
        active={activeTool === "OFFICE_LABEL"}
        onClick={() => toggleTool("OFFICE_LABEL")}
      />
      <ToolButton
        icon={<Info size={18} />}
        label="Info"
        active={activeTool === "INFORMATION"}
        onClick={() => toggleTool("INFORMATION")}
      />

      <div className="my-1 border-t border-gray-100" />

      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 pb-0.5">
        Edit
      </p>
      <ToolButton
        icon={<Trash2 size={18} />}
        label="Delete"
        active={false}
        danger
        disabled={!selectedElementId}
        onClick={onDeleteSelected}
      />
    </div>
  );
}
