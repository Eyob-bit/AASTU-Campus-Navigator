import { Link } from "react-router-dom";
import {
  Map,
  Bot,
  Camera,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/utils";

interface Feature {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  badgeClass: string;
  borderHover: string;
  title: string;
  description: string;
  link: string;
  badge?: string;
}

const FEATURES: Feature[] = [
  {
    id: "interactive-navigation",
    icon: Map,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-500/15",
    badgeClass: "bg-blue-600 text-white",
    borderHover: "group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500",
    title: "Interactive Navigation",
    description:
      "Navigate the AASTU campus with an interactive map. Get turn-by-turn directions to any building, department, or facility on campus.",
    link: "/navigation",
    badge: "Live",
  },
  {
    id: "ai-directory",
    icon: Bot,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50 dark:bg-violet-500/15",
    badgeClass: "bg-violet-600 text-white",
    borderHover: "group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-500",
    title: "AI Directory",
    description:
      "Ask anything — find staff members, locate offices, discover services. Our AI assistant understands natural language queries and guides you precisely.",
    link: "/search",
    badge: "AI",
  },
  {
    id: "indoor-360",
    icon: Camera,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-500/15",
    badgeClass: "bg-rose-500 text-white",
    borderHover: "group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-orange-500",
    title: "Indoor 360° Navigation",
    description:
      "Explore every corner of AASTU indoors with immersive 360° panoramic tours. Navigate between floors and rooms without stepping outside.",
    link: "/panorama",
    badge: "360°",
  },
  {
    id: "campus-information",
    icon: BookOpen,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/15",
    badgeClass: "bg-emerald-600 text-white",
    borderHover: "group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-500",
    title: "Campus Information",
    description:
      "Access comprehensive information about AASTU — departments, offices, academic services, announcements, and everything you need in one place.",
    link: "/search",
  },
];

interface FeatureCardProps {
  feature: Feature;
  delay: string;
}

function FeatureCard({ feature, delay }: FeatureCardProps) {
  const {
    icon: Icon,
    iconColor,
    iconBg,
    badgeClass,
    borderHover,
    title,
    description,
    link,
    badge,
  } = feature;

  return (
    <Link
      to={link}
      id={`feature-card-${feature.id}`}
      className={cn(
        "group relative flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        "transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/60",
        "dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/40",
        "animate-fade-in-up",
        delay
      )}
      aria-label={`Explore ${title}`}
    >
      {/* Gradient top border line — appears on hover */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 rounded-t-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          borderHover
        )}
        aria-hidden="true"
      />

      {/* Icon row */}
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            iconBg
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor)} strokeWidth={1.75} />
        </span>

        {badge && (
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeClass)}>
            {badge}
          </span>
        )}
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {/* Inline CTA */}
      <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
        Explore
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
          strokeWidth={2.5}
        />
      </div>
    </Link>
  );
}

const DELAYS = ["delay-0", "delay-150", "delay-300", "delay-500"];

export function FeatureCards() {
  return (
    <section
      className="bg-slate-50 py-20 dark:bg-slate-900/60"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="animate-fade-in-up mb-12 text-center">
          <span className="mb-3 inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
            Features
          </span>
          <h2
            id="features-heading"
            className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          >
            Everything you need on campus
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 dark:text-slate-400">
            From finding a classroom to navigating indoors, AASTU Navigator has
            you covered with intelligent, real-time tools.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} delay={DELAYS[i]} />
          ))}
        </div>
      </div>
    </section>
  );
}
