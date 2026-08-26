import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

interface PaginationProps {
  current: number;
  total: number;
  onChange: (p: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];
  const delta = 2;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  pages.push(1);
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

export function Pagination({ current, total, onChange }: PaginationProps) {
  const pages = getPageNumbers(current, total);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
      >
        <ChevronLeft size={14} />
      </Button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 dark:text-slate-500">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
              p === current ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            {p}
          </button>
        )
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
      >
        <ChevronRight size={14} />
      </Button>
    </div>
  );
}
