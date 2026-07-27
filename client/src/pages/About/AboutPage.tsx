import {
  Compass,
  BookOpen,
  Users,
  Award,
  MapPin,
  Sparkles,
  Globe,
  Lightbulb,
  CheckCircle2,
  Map as MapIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-[#080E1E] text-slate-100 px-4 py-6 sm:px-6 lg:px-8 space-y-5 max-w-3xl mx-auto pb-24">
      {/* Page Header */}
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl font-bold tracking-wide text-slate-100">
          About AASTU
        </h1>
        <p className="text-xs text-slate-400">
          Addis Ababa Science and Technology University
        </p>
      </div>

      {/* 1. Our Vision */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-5 backdrop-blur-md flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
          <Compass className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-100">Our Vision</h2>
          <p className="text-xs leading-relaxed text-slate-300">
            To be a world-class center of excellence in science and technology education, research, and innovation.
          </p>
        </div>
      </div>

      {/* 2. Our Mission */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-5 backdrop-blur-md flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-100">Our Mission</h2>
          <p className="text-xs leading-relaxed text-slate-300">
            To produce competent, ethical, and entrepreneurial graduates who contribute to national and international development through cutting-edge research and knowledge dissemination.
          </p>
        </div>
      </div>

      {/* 3. AASTU at a Glance */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          AASTU at a Glance
        </h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/50 bg-[#131F3F]/60 p-3">
            <Users className="h-4 w-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">STUDENTS</span>
              <strong className="text-sm text-white font-bold">10,000+</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/50 bg-[#131F3F]/60 p-3">
            <BookOpen className="h-4 w-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">FACULTY</span>
              <strong className="text-sm text-white font-bold">1,000+</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/50 bg-[#131F3F]/60 p-3">
            <Award className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">PROGRAMS</span>
              <strong className="text-sm text-white font-bold">40+</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/50 bg-[#131F3F]/60 p-3">
            <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">CAMPUS ACRES</span>
              <strong className="text-sm text-white font-bold">200+</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Our Philosophy */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Our Philosophy
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Innovation-Driven</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>Community-Oriented</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <Lightbulb className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
            <span>Problem-Solving</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Globally-Minded</span>
          </div>
        </div>
      </div>

      {/* 5. Key Partnerships & Map Link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Key Partnerships */}
        <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-4 backdrop-blur-md space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Key Partnerships
          </h2>
          <div className="flex items-center justify-around gap-2 pt-1">
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400">
                MInT
              </div>
              <span className="text-[10px] text-slate-400">Ministry of Tech</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                TC
              </div>
              <span className="text-[10px] text-slate-400">Tech Council</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                ERB
              </div>
              <span className="text-[10px] text-slate-400">European Body</span>
            </div>
          </div>
        </div>

        {/* AASTU Campus Map Card */}
        <Link
          to="/"
          className="group rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-4 backdrop-blur-md flex flex-col justify-between transition-all hover:border-cyan-500/50"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              AASTU Campus Map
            </h2>
            <MapIcon className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-700/60 bg-[#131F3F]/70 p-2.5">
            <div className="h-10 w-10 rounded-lg bg-cover bg-center border border-slate-600 shrink-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80')" }} />
            <div>
              <p className="text-xs font-bold text-white">Interactive Map</p>
              <p className="text-[11px] text-cyan-400">Tap to open map &rarr;</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
