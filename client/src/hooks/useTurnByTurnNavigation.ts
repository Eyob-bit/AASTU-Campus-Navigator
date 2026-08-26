import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/store";
import { RouteProgressTracker } from "@/utils";
import type { RouteInstruction } from "@/api/roadNetwork.api";

export interface UseTurnByTurnNavigationResult {
  currentInstructionIndex: number;
  currentInstruction: RouteInstruction | null;
  nextInstruction: RouteInstruction | null;
  remainingInstructionDistance: number | null;
  totalRemainingDistance: number;
  totalRemainingMinutes: number;
  progressPercent: number;
  totalSteps: number;
  isArrived: boolean;
}

const STEP_ADVANCE_RADIUS_METERS = 12;

export function useTurnByTurnNavigation(): UseTurnByTurnNavigationResult {
  const {
    navStep,
    userLocation,
    activeRoute,
    currentInstructionIndex,
    setCurrentInstructionIndex,
    triggerArrival,
  } = useAppStore();

  const instructions = activeRoute?.instructions ?? [];
  const totalSteps = instructions.length;

  const trackerRef = useRef<RouteProgressTracker | null>(null);

  // Initialize or update tracker when route coordinates change
  useEffect(() => {
    if (activeRoute && activeRoute.coordinates.length >= 2) {
      trackerRef.current = new RouteProgressTracker(
        activeRoute.coordinates,
        userLocation || undefined
      );
    } else {
      trackerRef.current = null;
    }
  }, [activeRoute]);

  // Update tracker on user location changes
  const routeProgress = useMemo(() => {
    if (!trackerRef.current || !userLocation || navStep !== "OUTDOOR_NAV") {
      return null;
    }
    return trackerRef.current.update(userLocation.lat, userLocation.lng);
  }, [userLocation, navStep]);

  // Pre-calculate target distance along the route for each instruction
  const instructionTargetDistances = useMemo(() => {
    if (!activeRoute || !trackerRef.current || instructions.length === 0) {
      return [];
    }

    const tracker = trackerRef.current;
    let accumulatedDist = 0;

    return instructions.map((inst, idx) => {
      // 1. Target node along polyline
      if (inst.targetNodeId && activeRoute.pathNodes) {
        const dist = tracker.getDistanceAlongRouteForNodeId(inst.targetNodeId, activeRoute.pathNodes);
        if (dist !== null) {
          accumulatedDist = dist;
          return dist;
        }
      }

      // 2. Destination node for ARRIVE instruction
      if (inst.type === "ARRIVE" || idx === instructions.length - 1) {
        return tracker.getTotalDistance();
      }

      // 3. Fallback: cumulative instruction distance
      accumulatedDist += inst.distance;
      return accumulatedDist;
    });
  }, [activeRoute, instructions]);

  const currentInstruction =
    instructions.length > 0 && currentInstructionIndex < instructions.length
      ? instructions[currentInstructionIndex]
      : null;

  const nextInstruction =
    instructions.length > 0 && currentInstructionIndex + 1 < instructions.length
      ? instructions[currentInstructionIndex + 1]
      : null;

  // Live remaining walking distance along the route for the CURRENT instruction
  const remainingInstructionDistance = useMemo(() => {
    if (!userLocation || !currentInstruction || navStep !== "OUTDOOR_NAV") {
      return null;
    }

    const userDistAlongRoute = routeProgress?.distanceAlongRoute ?? 0;
    const targetDist = instructionTargetDistances[currentInstructionIndex];

    if (targetDist != null) {
      const remaining = targetDist - userDistAlongRoute;
      return Math.max(0, Math.round(remaining));
    }

    return currentInstruction.distance;
  }, [userLocation, currentInstruction, navStep, routeProgress, instructionTargetDistances, currentInstructionIndex]);

  // Auto-advance step when user reaches / passes target distance along the route
  useEffect(() => {
    if (
      navStep !== "OUTDOOR_NAV" ||
      remainingInstructionDistance === null ||
      !currentInstruction
    ) {
      return;
    }

    if (
      remainingInstructionDistance <= STEP_ADVANCE_RADIUS_METERS &&
      currentInstructionIndex < totalSteps - 1
    ) {
      setCurrentInstructionIndex(currentInstructionIndex + 1);
    }
  }, [
    navStep,
    remainingInstructionDistance,
    currentInstructionIndex,
    totalSteps,
    currentInstruction,
    setCurrentInstructionIndex,
  ]);

  // Live total remaining distance along the route
  const totalRemainingDistance = useMemo(() => {
    if (!activeRoute || !trackerRef.current) return 0;
    const totalDist = trackerRef.current.getTotalDistance() || activeRoute.totalDistanceMeters || 0;
    const userDist = routeProgress?.distanceAlongRoute ?? 0;
    return Math.max(0, Math.round(totalDist - userDist));
  }, [activeRoute, routeProgress]);

  const totalRemainingMinutes = Math.max(1, Math.ceil(totalRemainingDistance / 78));

  // Continuous percentage based on meters travelled along the path
  const progressPercent = useMemo(() => {
    if (!trackerRef.current) return 0;
    const total = trackerRef.current.getTotalDistance();
    if (total <= 0) return 0;
    const current = routeProgress?.distanceAlongRoute ?? 0;
    return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
  }, [routeProgress]);

  const isArrived =
    currentInstruction?.type === "ARRIVE" &&
    remainingInstructionDistance !== null &&
    remainingInstructionDistance <= STEP_ADVANCE_RADIUS_METERS;

  // Trigger arrival bottom sheet when arrived during OUTDOOR_NAV
  useEffect(() => {
    if (navStep === "OUTDOOR_NAV" && isArrived) {
      triggerArrival();
    }
  }, [navStep, isArrived, triggerArrival]);

  return {
    currentInstructionIndex,
    currentInstruction,
    nextInstruction,
    remainingInstructionDistance,
    totalRemainingDistance,
    totalRemainingMinutes,
    progressPercent,
    totalSteps,
    isArrived,
  };
}
