import { cn } from "@/utils/cn";

const map: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  inactive: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  expired: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  draft: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
};

const dotMap: Record<string, string> = {
  active: "bg-emerald-500 dark:bg-emerald-400",
  inactive: "bg-gray-400 dark:bg-slate-500",
  expired: "bg-red-400 dark:bg-red-400",
  draft: "bg-amber-400 dark:bg-amber-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        map[status] ?? map.active
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotMap[status] ?? "bg-emerald-500")} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
