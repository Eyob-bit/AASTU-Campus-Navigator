import { useState, useEffect } from "react";
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
  Link as LinkIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { infoContentApi } from "@/api/infoContent.api";
import type { InfoChannel, InfoContact, InfoLink } from "@/api/infoContent.api";

// ── Platform → Lucide icon map ────────────────────────────────────────────────
function getPlatformIcon(platform: string) {
  switch (platform) {
    case "telegram":  return Send;
    case "facebook":  return Globe;
    case "tiktok":    return Video;
    case "youtube":   return Play;
    default:          return Globe;
  }
}

// ── Hardcoded Centers of Excellence (stable, non-admin-editable) ─────────────
const CENTERS_OF_EXCELLENCE = [
  { name: "AI & Data Science Center",   icon: Cpu,          desc: "Cutting-edge AI, Machine Learning & Analytics" },
  { name: "Renewable Energy Research",  icon: Zap,          desc: "Solar, Wind & Sustainable Power Systems" },
  { name: "Applied Biotechnology",      icon: Dna,          desc: "Biomedical & Agricultural Research" },
  { name: "Advanced Manufacturing",     icon: Cog,          desc: "Robotics, 3D Printing & Industrial Tech" },
  { name: "Urban Planning",             icon: Building,     desc: "Smart Cities & Infrastructure Design" },
  { name: "Smart Materials",            icon: FlaskConical, desc: "Nanotechnology & Materials Engineering" },
];

// ── Icon name → component (for InfoLink iconName field) ──────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Laptop, Map, Calendar, Globe, Link: LinkIcon,
};

function getLinkIcon(iconName: string) {
  return ICON_MAP[iconName] ?? LinkIcon;
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function ChannelSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-[#131F3F]/70 px-3 py-2.5 animate-pulse">
          <div className="h-7 w-7 rounded-lg bg-slate-300 dark:bg-slate-700 shrink-0" />
          <div className="h-3 w-28 rounded bg-slate-300 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export function InformationPage() {
  const [channels, setChannels]   = useState<InfoChannel[]>([]);
  const [contacts, setContacts]   = useState<InfoContact[]>([]);
  const [links, setLinks]         = useState<InfoLink[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ch, co, lk] = await Promise.allSettled([
          infoContentApi.getActiveChannels(),
          infoContentApi.getActiveContacts(),
          infoContentApi.getActiveLinks(),
        ]);
        if (cancelled) return;
        if (ch.status === "fulfilled") setChannels(ch.value);
        if (co.status === "fulfilled") setContacts(co.value);
        if (lk.status === "fulfilled") setLinks(lk.value);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#080E1E] text-slate-900 dark:text-slate-100 px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-3xl mx-auto pb-24 transition-colors">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="font-display text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100">
          AASTU Campus Information
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Official portals, centers of excellence, and campus channels
        </p>
      </div>

      {/* 1. University Social Media & Channels */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-4 shadow-sm dark:shadow-md transition-colors">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400 flex items-center gap-2">
          <span>University Social Media & Channels</span>
        </h2>

        {loading ? (
          <ChannelSkeleton />
        ) : channels.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No channels configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {channels.map((ch) => {
              const Icon = getPlatformIcon(ch.platform);
              return (
                <a
                  key={ch.id}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#131F3F]/70 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-[#1A2952] hover:border-blue-400 dark:hover:border-cyan-500/50"
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ch.colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="truncate">{ch.label}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Centers of Excellence */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-4 shadow-sm dark:shadow-md transition-colors">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
          Centers of Excellence
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CENTERS_OF_EXCELLENCE.map((center, idx) => {
            const Icon = center.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#131F3F]/60 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{center.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{center.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Faculty Portals & Services */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-4 shadow-sm dark:shadow-md transition-colors">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
          Faculty Portals & Services
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-[#131F3F]/80 px-4 py-3 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-slate-300 dark:bg-slate-700 shrink-0" />
                <div className="h-3 w-24 rounded bg-slate-300 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No campus links configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {links.map((portal) => {
              const Icon = getLinkIcon(portal.iconName);
              const isExternal = portal.url.startsWith("http");
              return isExternal ? (
                <a
                  key={portal.id}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#131F3F]/80 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-[#1A2952] hover:border-blue-400 dark:hover:border-cyan-500/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{portal.label}</span>
                </a>
              ) : (
                <Link
                  key={portal.id}
                  to={portal.url}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#131F3F]/80 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-[#1A2952] hover:border-blue-400 dark:hover:border-cyan-500/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{portal.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Key Contacts */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#0B132B]/90 p-5 backdrop-blur-md space-y-3 shadow-sm dark:shadow-md transition-colors">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
          Key Contacts
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-4 w-4 rounded bg-slate-300 dark:bg-slate-700 shrink-0" />
                <div className="h-3 w-48 rounded bg-slate-300 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">No contacts configured yet.</p>
        ) : (
          <div className="space-y-2 text-xs">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                {contact.type === "email" ? (
                  <Mail className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                ) : (
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span>
                  {contact.label}:{" "}
                  {contact.type === "email" ? (
                    <a
                      href={`mailto:${contact.value}`}
                      className="text-blue-600 dark:text-cyan-400 underline"
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <strong className="text-slate-900 dark:text-white">{contact.value}</strong>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
