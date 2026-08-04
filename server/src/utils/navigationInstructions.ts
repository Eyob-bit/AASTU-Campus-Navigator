import { calculateHaversineDistance } from "./haversine.js";
import type { RouteNodeInfo } from "../services/roadNavigation.service.js";

export type InstructionType =
  | "START"
  | "STRAIGHT"
  | "LEFT"
  | "RIGHT"
  | "SLIGHT_LEFT"
  | "SLIGHT_RIGHT"
  | "UTURN"
  | "ARRIVE";

export interface RouteInstruction {
  type: InstructionType;
  text: string;
  distance: number;
  targetNodeId?: string;
  targetNodeName?: string | null;
}

/**
 * Calculates initial bearing (heading) in degrees [0, 360) from point 1 to point 2.
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

/**
 * Calculates signed turn angle in degrees [-180, 180] from bearing1 to bearing2.
 * Positive = Right turn, Negative = Left turn.
 */
export function calculateTurnAngle(bearing1: number, bearing2: number): number {
  let diff = bearing2 - bearing1;
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;
  return diff;
}

/**
 * Classifies turn angle into InstructionType.
 */
export function classifyTurnAngle(angle: number): InstructionType {
  if (angle >= -25 && angle <= 25) {
    return "STRAIGHT";
  } else if (angle > 25 && angle <= 65) {
    return "SLIGHT_RIGHT";
  } else if (angle > 65 && angle <= 135) {
    return "RIGHT";
  } else if (angle < -25 && angle >= -65) {
    return "SLIGHT_LEFT";
  } else if (angle < -65 && angle >= -135) {
    return "LEFT";
  } else {
    return "UTURN";
  }
}

/**
 * Converts a bearing in degrees [0, 360) to a cardinal direction string.
 */
export function bearingToCardinal(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return "north";
  if (bearing >= 22.5 && bearing < 67.5) return "northeast";
  if (bearing >= 67.5 && bearing < 112.5) return "east";
  if (bearing >= 112.5 && bearing < 157.5) return "southeast";
  if (bearing >= 157.5 && bearing < 202.5) return "south";
  if (bearing >= 202.5 && bearing < 247.5) return "southwest";
  if (bearing >= 247.5 && bearing < 292.5) return "west";
  return "northwest";
}

/**
 * Generates human-friendly Google Maps-style turn-by-turn walking instructions
 * given polyline coordinates and graph node details.
 */
export function generateRouteInstructions(
  coordinates: [number, number][],
  pathNodes: RouteNodeInfo[],
  destName?: string
): RouteInstruction[] {
  if (coordinates.length < 2) {
    return [
      {
        type: "ARRIVE",
        text: `Arrive at ${destName || "destination"}`,
        distance: 0,
      },
    ];
  }

  const instructions: RouteInstruction[] = [];

  // Helper map from coordinate lat,lng to node info
  const nodeMap = new Map<string, RouteNodeInfo>();
  for (const node of pathNodes) {
    const key = `${node.latitude.toFixed(6)},${node.longitude.toFixed(6)}`;
    nodeMap.set(key, node);
  }

  // 1. Initial Start instruction
  const p0 = coordinates[0];
  const p1 = coordinates[1];
  const initialDist = Math.round(calculateHaversineDistance(p0[0], p0[1], p1[0], p1[1]));
  const initialBearing = calculateBearing(p0[0], p0[1], p1[0], p1[1]);
  const cardinalDir = bearingToCardinal(initialBearing);

  const firstNodeKey = `${p1[0].toFixed(6)},${p1[1].toFixed(6)}`;
  const firstNode = nodeMap.get(firstNodeKey);
  const targetLabel = firstNode?.buildingName || firstNode?.name || "campus path";

  instructions.push({
    type: "START",
    text: `Head ${cardinalDir} toward ${targetLabel}`,
    distance: initialDist,
    targetNodeId: firstNode?.id,
    targetNodeName: firstNode?.name,
  });

  // 2. Intermediate turn instructions
  let accumulatedDist = 0;
  let prevBearing = initialBearing;

  for (let i = 1; i < coordinates.length - 1; i++) {
    const curr = coordinates[i];
    const next = coordinates[i + 1];
    const segDist = calculateHaversineDistance(curr[0], curr[1], next[0], next[1]);
    accumulatedDist += segDist;

    const currBearing = calculateBearing(curr[0], curr[1], next[0], next[1]);
    const turnAngle = calculateTurnAngle(prevBearing, currBearing);
    const turnType = classifyTurnAngle(turnAngle);

    const currNodeKey = `${curr[0].toFixed(6)},${curr[1].toFixed(6)}`;
    const currNode = nodeMap.get(currNodeKey);

    // Only create a turn instruction if there's a real turn (not straight) or named landmark
    if (turnType !== "STRAIGHT" || currNode?.name || currNode?.buildingName) {
      const nodeName = currNode?.buildingName
        ? `${currNode.buildingName} entrance`
        : currNode?.name;

      let actionText = "";
      switch (turnType) {
        case "LEFT":
          actionText = nodeName ? `Turn left at ${nodeName}` : "Turn left onto path";
          break;
        case "SLIGHT_LEFT":
          actionText = nodeName ? `Turn slightly left past ${nodeName}` : "Turn slightly left";
          break;
        case "RIGHT":
          actionText = nodeName ? `Turn right at ${nodeName}` : "Turn right onto path";
          break;
        case "SLIGHT_RIGHT":
          actionText = nodeName ? `Turn slightly right past ${nodeName}` : "Turn slightly right";
          break;
        case "UTURN":
          actionText = "Make a U-turn";
          break;
        default:
          actionText = nodeName ? `Continue past ${nodeName}` : "Continue straight along campus path";
          break;
      }

      instructions.push({
        type: turnType,
        text: actionText,
        distance: Math.round(accumulatedDist),
        targetNodeId: currNode?.id,
        targetNodeName: currNode?.name,
      });

      accumulatedDist = 0; // Reset for next instruction segment
    }

    prevBearing = currBearing;
  }

  // Add remaining distance to last turn if any
  if (instructions.length > 0 && accumulatedDist > 0) {
    const lastInst = instructions[instructions.length - 1];
    lastInst.distance += Math.round(accumulatedDist);
  }

  // 3. Final Arrival instruction
  const finalDestName = destName || pathNodes[pathNodes.length - 1]?.buildingName || pathNodes[pathNodes.length - 1]?.name || "destination";
  instructions.push({
    type: "ARRIVE",
    text: `Arrive at ${finalDestName}`,
    distance: 0,
    targetNodeId: pathNodes[pathNodes.length - 1]?.id,
    targetNodeName: pathNodes[pathNodes.length - 1]?.name,
  });

  return instructions;
}

