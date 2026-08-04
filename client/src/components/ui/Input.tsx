import { cn } from "@/utils/cn";

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Input({
  label, type = "text", placeholder, value, onChange, icon, rightElement, className = "", disabled,
}: InputProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400">{icon}</div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon ? "pl-10" : "",
            rightElement ? "pr-10" : ""
          )}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400">{rightElement}</div>
        )}
      </div>
    </div>
  );
}
