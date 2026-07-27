import { AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, danger, loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
              danger ? "bg-red-50" : "bg-blue-50"
            )}
          >
            <AlertCircle size={20} className={danger ? "text-red-600" : "text-blue-600"} />
          </div>
          <p className="text-sm text-gray-600 pt-2">{description}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            disabled={loading}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {danger ? "Delete" : "Confirm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
