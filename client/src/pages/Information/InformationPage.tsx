import {
  Send,
  Globe,
  Video,
  Play,
  Cpu,
  Zap,
  Dna,
  Cog,
  Building,
  FlaskConical,
  BookOpen,
  Laptop,
  Map,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";

const SOCIAL_CHANNELS = [
  { label: "Main AASTU Channel", icon: Send, color: "text-sky-400 bg-sky-500/10", url: "https://t.me/aastu_official" },
  { label: "Official Page", icon: Globe, color: "text-blue-400 bg-blue-500/10", url: "https://facebook.com/aastu" },
  { label: "AASTU Campus Life", icon: Video, color: "text-pink-400 bg-pink-500/10", url: "https://tiktok.com/@aastu" },
  { label: "Academic Lectures", icon: Play, color: "text-red-400 bg-red-500/10", url: "https://youtube.com/@aastu" },
  { label: "Student Union & Clubs", icon: Send, color: "text-sky-400 bg-sky-500/10", url: "https://t.me/aastu_su" },
  { label: "Engineering Faculty", icon: Send, color: "text-sky-400 bg-sky-500/10", url: "https://t.me/aastu_engineering" },
  { label: "Science Faculty", icon: Send, color: "text-sky-400 bg-sky-500/10", url: "https://t.me/aastu_science" },
  { label: "Computing Faculty", icon: Send, color: "text-sky-400 bg-sky-500/10", url: "https://t.me/aastu_computing" },
];

const CENTERS_OF_EXCELLENCE = [
  { name: "AI & Data Science Center", icon: Cpu, desc: "Cutting-edge AI, Machine Learning & Analytics" },
  { name: "Renewable Energy Research", icon: Zap, desc: "Solar, Wind & Sustainable Power Systems" },
  { name: "Applied Biotechnology", icon: Dna, desc: "Biomedical & Agricultural Research" },
  { name: "Advanced Manufacturing", icon: Cog, desc: "Robotics, 3D Printing & Industrial Tech" },
  { name: "Urban Planning", icon: Building, desc: "Smart Cities & Infrastructure Design" },
  { name: "Smart Materials", icon: FlaskConical, desc: "Nanotechnology & Materials Engineering" },
];

const PORTALS_AND_SERVICES = [
  { label: "Library Catalog", icon: BookOpen, path: "/search?q=library" },
  { label: "E-learning Portal", icon: Laptop, path: "/search?q=elearning" },
  { label: "Campus Map & Directory", icon: Map, path: "/" },
  { label: "Academic Calendar", icon: Calendar, path: "/search?q=calendar" },
];

export function InformationPage() {
  return (
    <div className="min-h-screen w-full bg-[#080E1E] text-slate-100 px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl font-bold tracking-wide text-slate-100">
          AASTU Campus Information
        </h1>
        <p className="text-xs text-slate-400">
          Official portals, centers of excellence, and campus channels
        </p>
      </div>

      {/* 1. University Social Media & Channels */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <span>University Social Media & Channels</span>
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
          {SOCIAL_CHANNELS.map((ch, idx) => {
            const Icon = ch.icon;
            return (
              <a
                key={idx}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-slate-700/60 bg-[#131F3F]/70 px-3 py-2.5 text-xs font-medium text-slate-200 transition-all hover:bg-[#1A2952] hover:border-cyan-500/50"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ch.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="truncate">{ch.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* 2. Centers of Excellence */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Centers of Excellence
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {CENTERS_OF_EXCELLENCE.map((center, idx) => {
            const Icon = center.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-slate-700/50 bg-[#131F3F]/60 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 mt-0.5">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">{center.name}</h3>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{center.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Faculty Portals & Services */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Faculty Portals & Services
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {PORTALS_AND_SERVICES.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <Link
                key={idx}
                to={portal.path}
                className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-[#131F3F]/80 px-4 py-3 text-xs font-semibold text-slate-200 transition-all hover:bg-[#1A2952] hover:border-cyan-500/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <Icon className="h-4 w-4" />
                </div>
                <span>{portal.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Key Contacts */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Key Contacts
        </h2>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Main Reception: <strong className="text-white">+251 11 888 0000</strong></span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Admissions: <a href="mailto:admissions@aastu.edu.et" className="text-cyan-400 underline">admissions@aastu.edu.et</a></span>
          </div>
        </div>
      </div>
    </div>
  );
}
