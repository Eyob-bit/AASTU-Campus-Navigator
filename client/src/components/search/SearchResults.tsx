import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import type { SearchResult, DestinationTarget } from "@/types";

interface SearchResultsProps {
  results: SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
  const navigate = useNavigate();
  const { setSelectedResult, startOutdoorNavigation } = useAppStore();

  if (results.length === 0) {
    return null;
  }

  const handleNavigate = (result: SearchResult) => {
    setSelectedResult(result);

    const isStaff = result.type === "staff" && Boolean(result.staff);
    const name = isStaff ? result.staff!.fullName : result.office.name;

    const target: DestinationTarget = {
      id: isStaff ? result.staff!.id : result.office.id,
      type: isStaff ? "STAFF" : "OFFICE",
      name,
      subtitle: isStaff
        ? `${result.staff!.position} · ${result.office.name}`
        : `Room ${result.office.roomNumber} · ${result.building.name}`,
      latitude: Number(result.building.entranceLatitude) || 8.887,
      longitude: Number(result.building.entranceLongitude) || 38.81,
      buildingId: result.building.id,
      buildingName: result.building.name,
      buildingCode: result.building.code,
      floorId: result.floor.id,
      floorNumber: result.floor.floorNumber,
      officeId: result.office.id,
      officeName: result.office.name,
      roomNumber: result.office.roomNumber,
      staffName: result.staff?.fullName,
      staffPosition: result.staff?.position,
      staffPhone: result.staff?.phone,
      staffEmail: result.staff?.email,
      entranceImage: result.building.entranceImage,
    };

    startOutdoorNavigation(target);
    navigate("/");
  };

  return (
    <ul className="space-y-3">
      {results.map((result) => {
        const title =
          result.type === "staff" && result.staff
            ? result.staff.fullName
            : result.office.name;
        const subtitle =
          result.type === "staff" && result.staff
            ? `${result.staff.position} · ${result.office.name}`
            : `Room ${result.office.roomNumber} · ${result.building.name}`;

        return (
          <li
            key={`${result.type}-${result.office.id}-${result.staff?.id ?? "office"}`}
            className="rounded-2xl border border-slate-700/60 bg-[#0B132B]/90 p-4 backdrop-blur-md shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-sm text-slate-300">{subtitle}</p>
              </div>
              <button
                onClick={() => handleNavigate(result)}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
              >
                Navigate
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
