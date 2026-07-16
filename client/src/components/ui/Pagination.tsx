import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

interface PaginationProps {
  current: number;
  total: number;
  onChange: (p: number) => void;
}

export function Pagination({ current, total, onChange }: PaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
      >
        <ChevronLeft size={14} />
      </Button>
      {Array.from({ length: Math.min(total, 5) }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
            p === current ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {p}
        </button>
      ))}
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
