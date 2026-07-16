import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "w-[18px] h-[18px] rounded-md border-2 transition-all flex items-center justify-center",
          checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300 hover:border-blue-400"
        )}
      >
        {checked && <Check size={11} strokeWidth={3} className="text-white" />}
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
