import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAppStore, useAppActions } from "@/store";
import { routeProgressStore } from "@/utils";
import { fastDistanceInMeters } from "@/utils/geo";
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
const ARRIVAL_RADIUS_METERS = 12;

const EMPTY_INSTRUCTIONS: RouteInstruction[] = [];

export function useTurnByTurnNavigation(): UseTurnByTurnNavigationResult {
  const navStep = useAppStore((s) => s.navStep);
  const userLocation = useAppStore((s) => s.userLocation);
  const destinationTarget = useAppStore((s) => s.destinationTarget);
  const activeRoute = useAppStore((s) => s.activeRoute);
  const currentInstructionIndex = useAppStore((s) => s.currentInstructionIndex);
  const { setCurrentInstructionIndex, triggerArrival } = useAppActions();

  // Progress is advanced by `useOutdoorRoute`; this hook only observes it.
  const routeProgress = useSyncExternalStore(
    routeProgressStore.subscribe,
    routeProgressStore.getProgress,
    routeProgressStore.getProgress
  );

  // Bumped when the tracker is rebuilt, which is when the node index and total
  // distance below become valid for the new route.
  const routeVersion = useSyncExternalStore(
    routeProgressStore.subscribe,
    routeProgressStore.getRouteVersion,
    routeProgressStore.getRouteVersion
  );

  const instructions = activeRoute?.instructions ?? EMPTY_INSTRUCTIONS;
  const totalSteps = instructions.length;

  // Each instruction's target distance along the route. The node index is built once
  // per route by the progress store, so this is a plain O(instructions) lookup.
  const instructionTargetDistances = useMemo(() => {
    if (!activeRoute || instructions.length === 0) return [];

    const nodeDistances = routeProgressStore.getNodeDistances();
    const totalDistance = routeProgressStore.getTotalDistance();
    let accumulatedDist = 0;

    return instructions.map((inst, idx) => {
      // 1. Target node along polyline
      if (inst.targetNodeId) {
        const dist = nodeDistances.get(inst.targetNodeId);
        if (dist != null) {
          accumulatedDist = dist;
          return dist;
        }
      }

      // 2. Destination node for ARRIVE instruction
      if (inst.type === "ARRIVE" || idx === instructions.length - 1) {
        return totalDistance;
      }

      // 3. Fallback: cumulative instruction distance
      accumulatedDist += inst.distance;
      return accumulatedDist;
    });
    // Keyed on `routeVersion` rather than `routeProgress` so this recomputes once per
    // route instead of on every GPS fix.
  }, [activeRoute, instructions, routeVersion]);

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
      return Math.max(0, Math.round(targetDist - userDistAlongRoute));
    }

    return currentInstruction.distance;
  }, [
    userLocation,
    currentInstruction,
    navStep,
    routeProgress,
    instructionTargetDistances,
    currentInstructionIndex,
  ]);

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
    if (!activeRoute) return 0;
    const totalDist = routeProgressStore.getTotalDistance() || activeRoute.totalDistanceMeters || 0;
    const userDist = routeProgress?.distanceAlongRoute ?? 0;
    return Math.max(0, Math.round(totalDist - userDist));
  }, [activeRoute, routeProgress, routeVersion]);

  const totalRemainingMinutes = Math.max(1, Math.ceil(totalRemainingDistance / 78));

  // Continuous percentage based on meters travelled along the path
  const progressPercent = useMemo(() => {
    const total = routeProgressStore.getTotalDistance();
    if (total <= 0) return 0;
    const current = routeProgress?.distanceAlongRoute ?? 0;
    return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
  }, [routeProgress, routeVersion]);

  // Direct distance between current user location and destination target
  const directDistanceToDestination = useMemo(() => {
    if (!userLocation || !destinationTarget) return null;
    return fastDistanceInMeters(
      userLocation.lat,
      userLocation.lng,
      destinationTarget.latitude,
      destinationTarget.longitude
    );
  }, [userLocation, destinationTarget]);

  // Robust arrival detection (~10-12m radius to target, remaining route distance, or final step arrival)
  const isArrived = useMemo(() => {
    if (navStep !== "OUTDOOR_NAV" || !destinationTarget) return false;

    // 1. Direct distance to destination target coordinates
    if (
      directDistanceToDestination !== null &&
      directDistanceToDestination <= ARRIVAL_RADIUS_METERS
    ) {
      return true;
    }

    // 2. Remaining distance along route path
    if (totalRemainingDistance > 0 && totalRemainingDistance <= ARRIVAL_RADIUS_METERS) {
      return true;
    }

    // 3. Final instruction step proximity
    if (
      currentInstruction?.type === "ARRIVE" &&
      remainingInstructionDistance !== null &&
      remainingInstructionDistance <= ARRIVAL_RADIUS_METERS
    ) {
      return true;
    }

    return false;
  }, [
    navStep,
    destinationTarget,
    directDistanceToDestination,
    totalRemainingDistance,
    currentInstruction,
    remainingInstructionDistance,
  ]);

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
