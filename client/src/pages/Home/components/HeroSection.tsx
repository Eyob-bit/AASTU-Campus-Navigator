import { Link } from "react-router-dom";
import { Search, Map, ChevronDown, Building2, Users, Compass } from "lucide-react";

interface StatBadgeProps {
  icon: React.ElementType;
  label: string;
}

function StatBadge({ icon: Icon, label }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm">
      <Icon className="h-4 w-4 text-blue-400" strokeWidth={2} />
      {label}
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative -mt-[60px] flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950"
      aria-label="Hero section"
    >
      {/* ── Animated gradient orbs ── */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {/* Primary orb — top right */}
        <div className="animate-pulse-slow absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
        {/* Secondary orb — middle left */}
        <div className="animate-pulse-slow delay-1000 absolute -left-32 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        {/* Tertiary orb — bottom centre */}
        <div className="animate-pulse-slow delay-2000 absolute bottom-0 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
        {/* Quaternary accent — top left */}
        <div className="animate-pulse-slow delay-500 absolute -left-10 top-20 h-[200px] w-[200px] rounded-full bg-violet-600/15 blur-2xl" />

        {/* Dot grid */}
        <div className="hero-grid-pattern absolute inset-0 opacity-100" />

        {/* Subtle top vignette */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950 to-transparent" />
        {/* Bottom vignette */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center sm:px-6">

        {/* Live badge */}
        <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          AASTU Campus Navigator — Now Live
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up delay-150 max-w-4xl font-display text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl">
          Explore{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            AASTU Campus
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up delay-300 mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
          Search buildings, offices, and staff in seconds. Navigate indoors with
          immersive{" "}
          <span className="font-medium text-slate-200">360° panoramas</span> and
          an{" "}
          <span className="font-medium text-slate-200">AI-powered directory</span>{" "}
          — your smart campus companion.
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-in-up delay-500 mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            to="/search"
            id="hero-search-campus-btn"
            className="group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-600/40 active:scale-100"
          >
            <Search className="h-5 w-5 transition-transform group-hover:rotate-12" strokeWidth={2.5} />
            Search Campus
          </Link>

          <Link
            to="/navigation"
            id="hero-open-map-btn"
            className="group flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/8 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-white/15 active:scale-100"
          >
            <Map className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
            Open Interactive Map
          </Link>
        </div>

        {/* Stats row */}
        <div className="animate-fade-in-up delay-700 mt-12 flex flex-wrap items-center justify-center gap-3">
          <StatBadge icon={Building2} label="50+ Buildings" />
          <StatBadge icon={Users}     label="200+ Staff" />
          <StatBadge icon={Compass}   label="Indoor Navigation" />
        </div>
      </div>

      {/* ── Scroll cue ── */}
      <div
        className="animate-bounce-gentle absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/20 p-1.5">
          <ChevronDown className="h-3 w-3 animate-bounce text-slate-500" strokeWidth={2} />
        </div>
      </div>
    </section>
  );
}
