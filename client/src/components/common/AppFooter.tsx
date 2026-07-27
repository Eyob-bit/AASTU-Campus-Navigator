import { Link } from "react-router-dom";
import {
  GraduationCap,
  MapPin,
  Search,
  Navigation,
  Camera,
  Mail,
  Phone,
  ExternalLink,
  Code2,
} from "lucide-react";

const QUICK_LINKS = [
  { to: "/",           label: "Home" },
  { to: "/search",     label: "Search Campus" },
  { to: "/navigation", label: "Campus Map" },
  { to: "/panorama",   label: "Indoor 360°" },
];

const INFO_LINKS = [
  { to: "/search",  label: "About AASTU" },
  { to: "/search",  label: "Campus Information" },
  { to: "/search",  label: "AI Directory" },
  { to: "/search",  label: "Announcements" },
];

const EMERGENCY_CONTACTS = [
  { label: "Campus Security",    value: "+251 116 18 5000" },
  { label: "Medical Centre",     value: "+251 116 18 5001" },
  { label: "Main Office",        value: "+251 116 18 5002" },
  { label: "Student Services",   value: "+251 116 18 5003" },
];

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      role="contentinfo"
    >
      {/* ── Main footer content ── */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Col 1: Brand ── */}
          <div className="space-y-4 lg:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2.5"
              aria-label="AASTU Campus Navigator home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20">
                <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
              </span>
              <div className="leading-tight">
                <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  AASTU Navigator
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  Campus Intelligence Platform
                </div>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Addis Ababa Science and Technology University. Helping students and
              visitors explore campus with AI-powered search and indoor navigation.
            </p>

            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" strokeWidth={2} />
              <span>
                Addis Ababa Science and Technology University,
                <br />
                Lideta Sub-city, Addis Ababa, Ethiopia
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Mail className="h-4 w-4 shrink-0 text-blue-500" strokeWidth={2} />
              <a
                href="mailto:info@aastu.edu.et"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                info@aastu.edu.et
              </a>
            </div>
          </div>

          {/* ── Col 2: Quick Links ── */}
          <div>
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-2.5" role="list">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="group flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    <span className="h-px w-4 bg-slate-300 transition-all group-hover:w-6 group-hover:bg-blue-500 dark:bg-slate-700" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Information ── */}
          <div>
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
              Information
            </h3>
            <ul className="space-y-2.5" role="list">
              {INFO_LINKS.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="group flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    <span className="h-px w-4 bg-slate-300 transition-all group-hover:w-6 group-hover:bg-blue-500 dark:bg-slate-700" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Feature pills */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: Search,     label: "Smart Search" },
                { icon: Navigation, label: "Navigation" },
                { icon: Camera,     label: "360° Tours" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                >
                  <Icon className="h-3 w-3" strokeWidth={2} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Col 4: Emergency Contacts ── */}
          <div>
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-white">
              Emergency Contacts
            </h3>
            <ul className="space-y-3" role="list">
              {EMERGENCY_CONTACTS.map(({ label, value }) => (
                <li key={label} className="space-y-0.5">
                  <div className="text-xs font-medium text-slate-900 dark:text-white">
                    {label}
                  </div>
                  <a
                    href={`tel:${value.replace(/\s/g, "")}`}
                    className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    <Phone className="h-3.5 w-3.5 text-green-500" strokeWidth={2} />
                    {value}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <a
                href="https://aastu.edu.et"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-all hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/40"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                Visit AASTU Official Site
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-slate-100 dark:border-slate-800/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {year} AASTU Campus Navigator. Addis Ababa Science and Technology
            University.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              Built by{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                AASTU CS Team
              </span>
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Source code repository"
              className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Code2 className="h-3.5 w-3.5" strokeWidth={2} />
              Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
