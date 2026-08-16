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

export type CardinalDirection = "north" | "east" | "south" | "west";

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
 * Converts a bearing in degrees [0, 360) to one of 4 cardinal directions:
 * North: 315° -> 45°
 * East:  45°  -> 135°
 * South: 135° -> 225°
 * West:  225° -> 315°
 */
export function bearingTo4Cardinal(bearing: number): CardinalDirection {
  const norm = ((bearing % 360) + 360) % 360;
  if (norm >= 45 && norm < 135) return "east";
  if (norm >= 135 && norm < 225) return "south";
  if (norm >= 225 && norm < 315) return "west";
  return "north";
}

/**
 * Backward compatibility alias for bearingTo4Cardinal
 */
export function bearingToCardinal(bearing: number): string {
  return bearingTo4Cardinal(bearing);
}

/**
 * Generates simple, human-friendly walking instructions based on cardinal directions
 * (North, South, East, West) derived strictly from route geometry.
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
  let currentCardinal = bearingTo4Cardinal(initialBearing);
  let prevBearing = initialBearing;

  const firstNodeKey = `${p1[0].toFixed(6)},${p1[1].toFixed(6)}`;
  const firstNode = nodeMap.get(firstNodeKey);

  instructions.push({
    type: "START",
    text: `Start by heading ${currentCardinal}`,
    distance: initialDist,
    targetNodeId: firstNode?.id || pathNodes[0]?.id,
    targetNodeName: firstNode?.name || pathNodes[0]?.name,
  });

  let accumulatedDist = initialDist;

  // 2. Process intermediate route segments for meaningful cardinal turns
  for (let i = 1; i < coordinates.length - 1; i++) {
    const curr = coordinates[i];
    const next = coordinates[i + 1];
    const segDist = calculateHaversineDistance(curr[0], curr[1], next[0], next[1]);

    const segBearing = calculateBearing(curr[0], curr[1], next[0], next[1]);
    const segCardinal = bearingTo4Cardinal(segBearing);
    const turnAngle = calculateTurnAngle(prevBearing, segBearing);

    const currNodeKey = `${curr[0].toFixed(6)},${curr[1].toFixed(6)}`;
    const currNode = nodeMap.get(currNodeKey);

    // Meaningful turn detection:
    // Requires a cardinal direction change AND a turn angle magnitude >= 30°
    const isCardinalChange = segCardinal !== currentCardinal && Math.abs(turnAngle) >= 30;

    if (isCardinalChange) {
      let turnType: InstructionType = "RIGHT";
      if (Math.abs(turnAngle) > 135) {
        turnType = "UTURN";
      } else if (turnAngle < -25) {
        turnType = turnAngle < -65 ? "LEFT" : "SLIGHT_LEFT";
      } else {
        turnType = turnAngle > 65 ? "RIGHT" : "SLIGHT_RIGHT";
      }

      instructions.push({
        type: turnType,
        text: `Turn ${segCardinal}`,
        distance: Math.round(segDist),
        targetNodeId: currNode?.id,
        targetNodeName: currNode?.name,
      });

      currentCardinal = segCardinal;
      accumulatedDist = segDist;
    } else {
      // Continuing in same cardinal direction
      accumulatedDist += segDist;
      const lastInst = instructions[instructions.length - 1];
      if (lastInst) {
        lastInst.distance += Math.round(segDist);
      }
    }

    prevBearing = segBearing;
  }

  // 3. Final Arrival instruction
  const finalDestName =
    destName ||
    pathNodes[pathNodes.length - 1]?.buildingName ||
    pathNodes[pathNodes.length - 1]?.name ||
    "destination";

  instructions.push({
    type: "ARRIVE",
    text: `Arrive at ${finalDestName}`,
    distance: 0,
    targetNodeId: pathNodes[pathNodes.length - 1]?.id,
    targetNodeName: pathNodes[pathNodes.length - 1]?.name,
  });

  return instructions;
}


