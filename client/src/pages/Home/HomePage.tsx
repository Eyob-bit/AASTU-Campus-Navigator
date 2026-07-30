import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, DoorOpen, Loader2, Navigation2 } from "lucide-react";
import { CampusMap } from "@/components/map";
import { searchApi } from "@/api/search.api";
import { useAppStore } from "@/store";
import type { SearchResult, Landmark, DestinationTarget } from "@/types";

export function HomePage() {
  const navigate = useNavigate();
  const { setSelectedResult, startOutdoorNavigation } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [officeResults, setOfficeResults] = useState<SearchResult[]>([]);
  const [landmarkResults, setLandmarkResults] = useState<Landmark[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live search effect on query change
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 1) {
      setOfficeResults([]);
      setLandmarkResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);

      const [officesRes, landmarksRes] = await Promise.allSettled([
        searchApi.search(query),
        searchApi.searchLandmarks(query),
      ]);

      if (officesRes.status === "fulfilled") {
        setOfficeResults(officesRes.value ?? []);
      } else {
        setOfficeResults([]);
      }

      if (landmarksRes.status === "fulfilled") {
        setLandmarkResults(landmarksRes.value ?? []);
      } else {
        setLandmarkResults([]);
      }

      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hide dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/search");
    }
  };

  const handleSelectOfficeResult = (result: SearchResult) => {
    setSelectedResult(result);
    setShowDropdown(false);
    setSearchQuery("");

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
      roadNodeId: result.building.entranceRoadNodeId || null,
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
  };

  const handleSelectLandmarkResult = (landmark: Landmark) => {
    setShowDropdown(false);
    setSearchQuery("");

    const isBuilding = Boolean(landmark.building);
    const node = landmark.roadNodeId || landmark.building?.entranceRoadNodeId || null;

    const target: DestinationTarget = {
      id: landmark.id,
      type: isBuilding ? "BUILDING" : "LANDMARK",
      name: landmark.building?.name ?? landmark.name,
      subtitle: `${landmark.category} Landmark · AASTU Campus`,
      latitude: landmark.latitude,
      longitude: landmark.longitude,
      roadNodeId: node,
      buildingId: landmark.buildingId ?? undefined,
      buildingName: landmark.building?.name,
      buildingCode: landmark.building?.code,
    };

    startOutdoorNavigation(target);
  };

  const hasResults = officeResults.length > 0 || landmarkResults.length > 0;

  return (
    <div className="relative h-[calc(100dvh-4rem)] lg:h-screen w-full overflow-hidden bg-slate-950">
      {/* Interactive Satellite/Campus Map View */}
      <div className="absolute inset-0 z-0">
        <CampusMap className="h-full w-full rounded-none border-none" />
      </div>

      {/* Top Floating Glass Search Bar with Live Dropdown */}
      <div ref={dropdownRef} className="absolute top-3 sm:top-4 inset-x-0 z-30 px-3 sm:px-4 max-w-md mx-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-[#0B132B]/95 backdrop-blur-xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl shadow-black/80 focus-within:border-cyan-400"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
            placeholder="Search buildings, offices, staff, landmarks…"
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 outline-none min-w-0"
          />
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
          ) : (
            <button
              type="submit"
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </form>

        {/* Live Search Dropdown Menu */}
        {showDropdown && (
          <div className="mt-2 rounded-2xl border border-slate-700/80 bg-[#0B132B]/95 p-3 shadow-2xl backdrop-blur-2xl max-h-80 overflow-y-auto space-y-2 animate-slide-down">
            {!isSearching && !hasResults && (
              <p className="text-xs text-slate-400 p-2 text-center">
                No matching campus entities found.
              </p>
            )}

            {/* Office & Staff Results */}
            {officeResults.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider px-2.5 py-1">
                  Offices & Staff
                </p>
                <div className="space-y-1">
                  {officeResults.map((result) => {
                    const isStaff = result.type === "staff" && Boolean(result.staff);
                    const title = isStaff ? result.staff!.fullName : result.office.name;
                    const subtitle = isStaff
                      ? `${result.staff!.position} · ${result.office.name}`
                      : `Room ${result.office.roomNumber} · ${result.building.name}`;

                    return (
                      <div
                        key={`${result.type}-${result.office.id}-${result.staff?.id ?? "office"}`}
                        onClick={() => handleSelectOfficeResult(result)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#131F3F]/60 hover:bg-[#1A2952] border border-slate-700/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                            {isStaff ? <User size={16} /> : <DoorOpen size={16} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                              {title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30 shrink-0 group-hover:bg-cyan-500 group-hover:text-white transition-all"
                        >
                          <Navigation2 size={12} />
                          <span>Nav</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Landmark Results */}
            {landmarkResults.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider px-2.5 py-1 pt-2">
                  Landmarks & Buildings
                </p>
                <div className="space-y-1">
                  {landmarkResults.map((landmark) => (
                    <div
                      key={landmark.id}
                      onClick={() => handleSelectLandmarkResult(landmark)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#131F3F]/60 hover:bg-[#1A2952] border border-slate-700/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-base">
                          {landmark.icon || "📍"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-blue-300 truncate">
                            {landmark.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {landmark.category} Landmark · AASTU
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/30 shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all"
                      >
                        <Navigation2 size={12} />
                        <span>Nav</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
