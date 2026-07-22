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
        "flex flex-col items-center gap-0.5 sm:gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-medium transition-all cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed",
        danger && active && "bg-red-50 text-red-600 ring-red-300",
        danger && !active && "text-gray-500 hover:bg-red-50 hover:text-red-600",
        !danger &&  active && "bg-indigo-50 text-indigo-700 ring-indigo-300 ring-2 shadow-xs",
        !danger && !active && "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      {icon}
      <span>{label}</span>
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
 * Responsive Toolbar for Scene Editor (Horizontal floating/header on mobile, vertical sidebar on desktop).
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
    <div className="w-full sm:w-20 flex-shrink-0 flex flex-row sm:flex-col items-center justify-around sm:justify-start gap-1 p-1.5 sm:p-2 bg-white border-b sm:border-b-0 sm:border-r border-gray-200 z-20 shadow-xs">
      <div className="hidden sm:block text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1 pt-1 pb-0.5">
        Place
      </div>
      <ToolButton
        icon={<ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />}
        label="Arrow"
        active={activeTool === "ARROW"}
        onClick={() => toggleTool("ARROW")}
      />
      <ToolButton
        icon={<Building2 size={16} className="sm:w-[18px] sm:h-[18px]" />}
        label="Label"
        active={activeTool === "OFFICE_LABEL"}
        onClick={() => toggleTool("OFFICE_LABEL")}
      />
      <ToolButton
        icon={<Info size={16} className="sm:w-[18px] sm:h-[18px]" />}
        label="Info"
        active={activeTool === "INFORMATION"}
        onClick={() => toggleTool("INFORMATION")}
      />

      <div className="h-6 w-px sm:h-auto sm:w-auto sm:my-1 border-r sm:border-r-0 sm:border-t border-gray-200" />

      <ToolButton
        icon={<Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />}
        label="Delete"
        active={false}
        danger
        disabled={!selectedElementId}
        onClick={onDeleteSelected}
      />
    </div>
  );
}
