interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  rows?: number;
}

export function Textarea({ label, placeholder, value, onChange, rows = 4 }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
      />
    </div>
  );
}
