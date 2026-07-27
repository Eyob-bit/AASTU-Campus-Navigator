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
    <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-950">
      {/* Interactive Satellite/Campus Map View */}
      <div className="absolute inset-0 z-0">
        <CampusMap className="h-full w-full rounded-none border-none" />
      </div>

      {/* Top Floating Glass Search Bar (Matching Image 3) */}
      <div className="absolute top-4 inset-x-0 z-20 px-4 max-w-md mx-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-[#0B132B]/90 backdrop-blur-md px-4 py-2.5 shadow-2xl shadow-black/60 focus-within:border-cyan-400"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search buildings, offices, staff..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Floating Quick Filter Chips at Top Right / Bottom Left */}
      <div className="absolute top-20 left-4 z-20 flex flex-wrap gap-2 max-w-xs">
        <button
          onClick={() => navigate("/search?q=block")}
          className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-[#0B132B]/80 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:border-cyan-400"
        >
          <Building className="h-3.5 w-3.5 text-cyan-400" />
          <span>Buildings</span>
        </button>
        <button
          onClick={() => navigate("/search?q=office")}
          className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-[#0B132B]/80 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:border-cyan-400"
        >
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <span>Offices</span>
        </button>
      </div>
    </div>
  );
}
