import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Toast } from "@/types";

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border min-w-[280px] max-w-[360px] bg-white",
            t.type === "success" ? "border-emerald-200" : t.type === "error" ? "border-red-200" : "border-blue-200"
          )}
        >
          <span
            className={cn(
              t.type === "success" ? "text-emerald-600" : t.type === "error" ? "text-red-600" : "text-blue-600"
            )}
          >
            {t.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : t.type === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <Info size={18} />
            )}
          </span>
          <p className="text-sm text-gray-800 flex-1">{t.message}</p>
          <button onClick={() => onRemove(t.id)} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
