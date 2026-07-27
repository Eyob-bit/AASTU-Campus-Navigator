import type { PathNode } from "@/types";
import { useNavigationPath } from "@/hooks";
import { useAppStore } from "@/store";

interface NavigationPathProps {
  officeId?: string | null;
}

export function NavigationPath({ officeId }: NavigationPathProps) {
  const { selectedResult } = useAppStore();
  const resolvedOfficeId = officeId ?? selectedResult?.office.id ?? null;
  const { data, isLoading, error } = useNavigationPath(resolvedOfficeId);

  if (!resolvedOfficeId) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
        Search for a destination first, then start navigation from the results.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        Generating navigation path...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error.message}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {data.office.name}
        </h2>
        <p className="text-sm text-slate-600">
          {data.building.name} · Floor {data.floor.floorNumber} · Room{" "}
          {data.office.roomNumber}
        </p>
      </div>

      <ol className="space-y-3">
        {data.path.map((step: PathNode, index: number) => (
          <li
            key={step.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
              {index + 1}
            </span>
            <div>
              <p className="font-medium text-slate-900">{step.name}</p>
              <p className="text-sm text-slate-500">{step.key}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
