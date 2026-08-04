import { useEffect, useRef, useState } from "react";
import {
  Navigation2,
  X,
  Compass,
  MapPin,
  RefreshCw,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Flag,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAppStore } from "@/store";
import { useLiveNavigation, useTurnByTurnNavigation } from "@/hooks";
import { formatDistance } from "@/utils/geo";
import type { InstructionType, RouteInstruction } from "@/api/roadNetwork.api";

// ── Voice Guidance helper ──────────────────────────────────────────────────────
function speakInstruction(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // Stop any active speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ── Turn Emoji & Icon Visuals ──────────────────────────────────────────────────
function TurnBadge({ type }: { type: InstructionType }) {
  switch (type) {
    case "START":
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xl font-bold shadow-lg shadow-emerald-500/10">
          🟢
        </div>
      );
    case "STRAIGHT":
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xl font-bold shadow-lg shadow-cyan-500/10">
          <ArrowUp className="h-6 w-6 stroke-[2.5]" />
        </div>
      );
    case "LEFT":
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xl font-bold shadow-lg shadow-amber-500/10">
          <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
        </div>
      );
    case "SLIGHT_LEFT":
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xl font-bold shadow-lg shadow-amber-500/10">
          <ArrowUpLeft className="h-6 w-6 stroke-[2.5]" />
        </div>
      );
    case "RIGHT":
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xl font-bold shadow-lg shadow-purple-500/10">
          <ArrowRight className="h-6 w-6 stroke-[2.5]" />
        </div>
      );
    case "SLIGHT_RIGHT":
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xl font-bold shadow-lg shadow-purple-500/10">
          <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
        </div>
      );
    case "UTURN":
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 text-xl font-bold shadow-lg shadow-red-500/10">
          <RotateCcw className="h-6 w-6 stroke-[2.5]" />
        </div>
      );
    case "ARRIVE":
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xl font-bold shadow-lg shadow-emerald-500/10">
          🏁
        </div>
      );
    default:
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xl font-bold shadow-lg shadow-cyan-500/10">
          <ArrowUp className="h-6 w-6 stroke-[2.5]" />
        </div>
      );
  }
}

// ── Small Icon for Step List ──────────────────────────────────────────────────
function SmallTurnIcon({ type }: { type: InstructionType }) {
  switch (type) {
    case "LEFT":         return <ArrowLeft className="h-3.5 w-3.5" />;
    case "SLIGHT_LEFT":  return <ArrowUpLeft className="h-3.5 w-3.5" />;
    case "RIGHT":        return <ArrowRight className="h-3.5 w-3.5" />;
    case "SLIGHT_RIGHT": return <ArrowUpRight className="h-3.5 w-3.5" />;
    case "UTURN":        return <RotateCcw className="h-3.5 w-3.5" />;
    case "ARRIVE":       return <Flag className="h-3.5 w-3.5" />;
    default:             return <ArrowUp className="h-3.5 w-3.5" />;
  }
}

// ── Step List Component ──────────────────────────────────────────────────────
function StepList({
  instructions,
  activeIdx,
}: {
  instructions: RouteInstruction[];
  activeIdx: number;
}) {
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
      {instructions.map((step, i) => {
        const isActive = i === activeIdx;
        const isPast   = i < activeIdx;

        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 rounded-xl p-2.5 border transition-all duration-300 ${
              isActive
                ? "bg-cyan-500/20 border-cyan-500/40 ring-1 ring-cyan-400/40"
                : isPast
                ? "opacity-35 border-slate-800/40 bg-transparent"
                : "border-slate-700/40 bg-[#131F3F]/40"
            }`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                isActive
                  ? "bg-cyan-500/30 border-cyan-400 text-cyan-300"
                  : "bg-slate-800/60 border-slate-700/40 text-slate-400"
              }`}
            >
              <SmallTurnIcon type={step.type} />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-semibold leading-snug truncate ${
                  isActive ? "text-white font-bold" : "text-slate-300"
                }`}
              >
                {step.text}
              </p>
              {step.distance > 0 && (
                <p
                  className={`text-[10px] font-medium ${
                    isActive ? "text-cyan-400" : "text-slate-500"
                  }`}
                >
                  {formatDistance(step.distance)}
                </p>
              )}
            </div>

            {isActive && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function OutdoorNavOverlay() {
  const {
    destinationTarget,
    activeRoute,
    triggerArrival,
    finishNavigation,
    setUserLocation,
  } = useAppStore();

  const [isRerouting, setIsRerouting] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  // Dedicated turn-by-turn navigation engine
  const {
    currentInstructionIndex,
    currentInstruction,
    remainingInstructionDistance,
    totalRemainingDistance,
    totalRemainingMinutes,
    progressPercent,
    totalSteps,
  } = useTurnByTurnNavigation();

  // Voice Guidance announcement when instruction changes
  useEffect(() => {
    if (isVoiceEnabled && currentInstruction?.text) {
      speakInstruction(currentInstruction.text);
    }
  }, [isVoiceEnabled, currentInstructionIndex, currentInstruction?.text]);

  // Ref to detect new route fetches (reroute flash)
  const prevRouteLenRef = useRef<number | undefined>(undefined);

  // Live GPS tracking watcher
  const { userPosition } = useLiveNavigation({
    targetLat: destinationTarget?.latitude,
    targetLng: destinationTarget?.longitude,
    arrivalThresholdMeters: 15,
    enabled: Boolean(destinationTarget),
    onArrival: triggerArrival,
  });

  // Feed GPS coordinates into global store
  useEffect(() => {
    if (userPosition) {
      setUserLocation({ lat: userPosition.latitude, lng: userPosition.longitude });
    }
  }, [userPosition, setUserLocation]);

  // Flash "Rerouting…" when route recalculates
  useEffect(() => {
    const currentLen = activeRoute?.coordinates?.length ?? 0;
    if (
      prevRouteLenRef.current !== undefined &&
      prevRouteLenRef.current !== currentLen &&
      currentLen > 0
    ) {
      setIsRerouting(true);
      const t = setTimeout(() => setIsRerouting(false), 2200);
      return () => clearTimeout(t);
    }
    prevRouteLenRef.current = currentLen;
  }, [activeRoute]);

  const isRouteLoaded = activeRoute !== null;
  const instructions = activeRoute?.instructions ?? [];

  if (!destinationTarget) return null;

  return (
    <div className="absolute top-16 sm:top-20 inset-x-3 sm:inset-x-auto sm:left-4 z-[1001] sm:max-w-sm w-auto">
      <div className="rounded-2xl border border-cyan-500/40 bg-[#0B132B]/96 text-slate-100 shadow-2xl backdrop-blur-xl animate-slide-down overflow-hidden">

        {/* ── Compact Strip (always visible) ──────────────────── */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {/* Nav icon */}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
            <Navigation2 className="h-3.5 w-3.5 animate-pulse" />
          </span>

          {/* Current instruction summary */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                LIVE NAV
              </span>
              {isRerouting && (
                <span className="flex items-center gap-1 text-[8px] font-semibold text-amber-400 animate-pulse">
                  <RefreshCw className="h-2 w-2 animate-spin" /> Rerouting…
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-white truncate leading-tight">
              {currentInstruction?.text ?? destinationTarget.name}
            </p>
          </div>

          {/* ETA & Distance pill */}
          {isRouteLoaded && (
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded-lg px-1.5 py-0.5 whitespace-nowrap">
                {formatDistance(totalRemainingDistance)} · {totalRemainingMinutes}m
              </span>
            </div>
          )}

          {/* Expand / Minimize toggle */}
          <button
            onClick={() => setShowSteps((s) => !s)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            title={showSteps ? "Minimize card" : "Expand navigation details"}
          >
            {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Voice toggle */}
          <button
            onClick={() => {
              const next = !isVoiceEnabled;
              setIsVoiceEnabled(next);
              if (next && currentInstruction?.text) {
                speakInstruction(currentInstruction.text);
              } else if (!next && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
              isVoiceEnabled
                ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
            title={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
          >
            {isVoiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* Cancel */}
          <button
            onClick={finishNavigation}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-red-500/80 hover:text-white transition-all cursor-pointer"
            title="Cancel Navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Expanded Details (collapsible) ──────────────────── */}
        {showSteps && (
          <div className="px-3 pb-3 space-y-3 border-t border-slate-800/60 pt-3">

            {/* Destination name */}
            <p className="text-xs font-bold text-cyan-300 truncate">📍 {destinationTarget.name}</p>

            {/* Primary Turn Guidance */}
            {isRouteLoaded && currentInstruction ? (
              <div className="rounded-2xl border border-cyan-500/40 bg-[#131F3F]/90 p-3 shadow-xl relative overflow-hidden space-y-2">
                <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />

                <div className="flex items-start gap-3 relative z-10">
                  <TurnBadge type={currentInstruction.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white leading-snug">{currentInstruction.text}</p>
                    {remainingInstructionDistance !== null && (
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xs text-cyan-300/80 font-medium">In</span>
                        <strong className="text-xl font-extrabold text-cyan-400 tracking-tight">
                          {formatDistance(remainingInstructionDistance)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {totalSteps > 0 && (
                  <div className="pt-2 border-t border-slate-700/50 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span>Step {currentInstructionIndex + 1} of {totalSteps}</span>
                      <span className="text-cyan-400">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700/40 bg-[#131F3F]/50 p-3 animate-pulse flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-slate-700/60 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-3/4 rounded bg-slate-700/60" />
                  <div className="h-4 w-20 rounded bg-slate-700/60" />
                </div>
              </div>
            )}

            {/* Remaining Distance & ETA */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-[#131F3F]/80 p-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block">REMAINING</span>
                  <strong className="text-sm font-bold text-white">{formatDistance(totalRemainingDistance)}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-[#131F3F]/80 p-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block">EST. TIME</span>
                  <strong className="text-sm font-bold text-white">{totalRemainingMinutes} min{totalRemainingMinutes > 1 ? "s" : ""}</strong>
                </div>
              </div>
            </div>

            {/* All Steps list */}
            {isRouteLoaded && instructions.length > 0 && (
              <StepList instructions={instructions} activeIdx={currentInstructionIndex} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

