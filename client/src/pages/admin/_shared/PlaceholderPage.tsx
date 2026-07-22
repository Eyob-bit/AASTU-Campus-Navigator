import type { ElementType } from "react";
import { cn } from "@/utils/cn";

interface PlaceholderPageProps {
  icon: ElementType;
  title: string;
  description: string;
  color?: string;
}

/**
 * Generic placeholder used for pages not yet implemented.
 * Replaced sprint-by-sprint with real content.
 */
export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  color = "blue",
}: PlaceholderPageProps) {
  const colorMap: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    emerald:"bg-emerald-50 text-emerald-600 border-emerald-100",
    amber:  "bg-amber-50 text-amber-600 border-amber-100",
    rose:   "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center mb-4 sm:mb-5", colorMap[color] ?? colorMap.blue)}>
          <Icon size={26} />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{description}</p>
        <span className="mt-4 sm:mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
          Coming in next sprint
        </span>
      </div>
    </div>
  );
}
