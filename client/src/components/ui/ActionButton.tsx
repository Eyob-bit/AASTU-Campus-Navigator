import React from "react";

export interface ActionButtonProps {
  icon:       React.ReactNode;
  label:      string;
  /** Tailwind hover classes, e.g. "hover:text-amber-600 hover:bg-amber-50" */
  hoverClass: string;
  onClick:    () => void;
}

/**
 * Icon-only action button used in table row action columns.
 * Replaces the four identical local `ActionBtn` functions that lived
 * in BuildingsPage, FloorsPage, OfficesPage, and StaffPage.
 */
export function ActionButton({ icon, label, hoverClass, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 text-gray-400 rounded-lg transition-colors ${hoverClass}`}
    >
      {icon}
    </button>
  );
}
