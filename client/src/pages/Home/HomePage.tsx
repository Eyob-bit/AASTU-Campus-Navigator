import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building } from "lucide-react";
import { CampusMap } from "@/components/map";

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/search");
    }
  };

  return (
    <div className="relative h-[calc(100dvh-4rem)] lg:h-screen w-full overflow-hidden bg-slate-950">
      {/* Interactive Satellite/Campus Map View */}
      <div className="absolute inset-0 z-0">
        <CampusMap className="h-full w-full rounded-none border-none" />
      </div>

      {/* Top Floating Glass Search Bar */}
      <div className="absolute top-3 sm:top-4 inset-x-0 z-20 px-3 sm:px-4 max-w-md mx-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-[#0B132B]/90 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl shadow-black/60 focus-within:border-cyan-400"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search buildings, offices, staff, landmarks…"
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 outline-none min-w-0"
          />
          <button
            type="submit"
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </form>
      </div>

      {/* Floating Quick Filter Chips at Top Left */}
      <div className="absolute top-16 sm:top-20 left-3 sm:left-4 z-20 flex flex-wrap gap-1.5 sm:gap-2 max-w-[200px] sm:max-w-xs">
        <button
          onClick={() => navigate("/search?q=block")}
          className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-[#0B132B]/80 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-slate-200 backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:border-cyan-400 cursor-pointer shadow-lg"
        >
          <Building className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" />
          <span>Buildings</span>
        </button>
        <button
          onClick={() => navigate("/search?q=office")}
          className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-[#0B132B]/80 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-slate-200 backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:border-cyan-400 cursor-pointer shadow-lg"
        >
          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-400" />
          <span>Offices</span>
        </button>
      </div>
    </div>
  );
}
