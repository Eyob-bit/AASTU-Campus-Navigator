import { cn } from "@/utils/cn";

const map: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        map[priority] ?? map.low
      )}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
