import { useEffect, useMemo } from "react";
import { useAppStore } from "@/store";
import { calculateDistanceInMeters } from "@/utils/geo";
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

const STEP_ADVANCE_RADIUS_METERS = 15;

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

  const currentInstruction =
    instructions.length > 0 && currentInstructionIndex < instructions.length
      ? instructions[currentInstructionIndex]
      : null;

  const nextInstruction =
    instructions.length > 0 && currentInstructionIndex + 1 < instructions.length
      ? instructions[currentInstructionIndex + 1]
      : null;

  // Compute live remaining distance to the target node of the CURRENT instruction
  const remainingInstructionDistance = useMemo(() => {
    if (!userLocation || !currentInstruction || navStep !== "OUTDOOR_NAV") {
      return null;
    }

    // 1. Try finding target node by targetNodeId
    if (currentInstruction.targetNodeId && activeRoute?.pathNodes) {
      const node = activeRoute.pathNodes.find(
        (n) => n.id === currentInstruction.targetNodeId
      );
      if (node) {
        return Math.round(
          calculateDistanceInMeters(
            userLocation.lat,
            userLocation.lng,
            node.latitude,
            node.longitude
          )
        );
      }
    }

    // 2. Fallback to destination node for ARRIVE instruction
    if (currentInstruction.type === "ARRIVE" && activeRoute?.destNode) {
      return Math.round(
        calculateDistanceInMeters(
          userLocation.lat,
          userLocation.lng,
          activeRoute.destNode.latitude,
          activeRoute.destNode.longitude
        )
      );
    }

    // 3. Fallback to instruction distance
    return currentInstruction.distance;
  }, [userLocation, currentInstruction, activeRoute, navStep]);

  // Auto-advance step when user gets within STEP_ADVANCE_RADIUS_METERS of current step's node
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

  // Calculate live total remaining distance to destination
  const totalRemainingDistance = useMemo(() => {
    if (!isFinite(remainingInstructionDistance as number) || remainingInstructionDistance === null) {
      return activeRoute?.totalDistanceMeters ?? 0;
    }

    let dist = remainingInstructionDistance;
    for (let i = currentInstructionIndex + 1; i < instructions.length; i++) {
      dist += instructions[i].distance;
    }
    return Math.round(dist);
  }, [remainingInstructionDistance, currentInstructionIndex, instructions, activeRoute]);

  const totalRemainingMinutes = Math.max(1, Math.ceil(totalRemainingDistance / 78));

  const progressPercent =
    totalSteps > 0
      ? Math.min(100, Math.round(((currentInstructionIndex + 1) / totalSteps) * 100))
      : 0;

  const isArrived =
    currentInstruction?.type === "ARRIVE" ||
    (remainingInstructionDistance !== null && remainingInstructionDistance <= STEP_ADVANCE_RADIUS_METERS && currentInstructionIndex === totalSteps - 1);

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
