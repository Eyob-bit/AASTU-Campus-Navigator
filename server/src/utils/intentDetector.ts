/**
 * Intent Detector & Query Text Normalizer for AI Campus Assistant.
 */

export type ChatIntent =
  | "NAVIGATE"
  | "FIND_STAFF"
  | "FIND_OFFICE"
  | "FIND_BUILDING"
  | "SHOW_INSIDE"
  | "GENERAL_INFORMATION"
  | "UNKNOWN";

export interface NormalizedQuery {
  raw: string;
  normalized: string;
  tokens: string[];
  intent: ChatIntent;
  isFollowUpNavigation: boolean;
  isFollowUpInside: boolean;
  isFollowUpMap: boolean;
}

const STOP_WORDS = new Set([
  "where", "is", "the", "a", "an", "do", "i", "can", "find", "get", "to", "how", "what", "who", "located",
  "in", "at", "on", "of", "please", "me", "show", "tell", "about", "take", "bring", "navigate", "route"
]);

export function analyzeQueryIntent(query: string): NormalizedQuery {
  const raw = query.trim();
  const normalized = raw
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized
    .split(" ")
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));

  const isFollowUpNavigation = Boolean(
    normalized.includes("take me there") ||
    normalized.includes("navigate there") ||
    normalized.includes("go there") ||
    normalized.includes("start navigation") ||
    normalized.includes("take me") ||
    normalized.includes("route to it")
  );

  const isFollowUpInside = Boolean(
    normalized.includes("show inside") ||
    normalized.includes("look inside") ||
    normalized.includes("panorama") ||
    normalized.includes("360 view") ||
    normalized.includes("inside view")
  );

  const isFollowUpMap = Boolean(
    normalized.includes("show on map") ||
    normalized.includes("view on map") ||
    normalized.includes("center map") ||
    normalized.includes("map view")
  );

  let intent: ChatIntent = "UNKNOWN";

  if (isFollowUpNavigation || normalized.includes("navigate") || normalized.includes("directions") || normalized.includes("take me")) {
    intent = "NAVIGATE";
  } else if (isFollowUpInside) {
    intent = "SHOW_INSIDE";
  } else if (normalized.includes("dean") || normalized.includes("director") || normalized.includes("head") || normalized.includes("officer") || normalized.includes("dr") || normalized.includes("prof") || normalized.includes("who is")) {
    intent = "FIND_STAFF";
  } else if (normalized.includes("office") || normalized.includes("room") || normalized.includes("pay") || normalized.includes("tuition") || normalized.includes("registrar") || normalized.includes("finance") || normalized.includes("register")) {
    intent = "FIND_OFFICE";
  } else if (normalized.includes("block") || normalized.includes("building") || normalized.includes("library") || normalized.includes("cafeteria") || normalized.includes("hall") || normalized.includes("lab")) {
    intent = "FIND_BUILDING";
  } else if (tokens.length > 0) {
    intent = "FIND_OFFICE"; // default to location search
  } else {
    intent = "GENERAL_INFORMATION";
  }

  return {
    raw,
    normalized,
    tokens,
    intent,
    isFollowUpNavigation,
    isFollowUpInside,
    isFollowUpMap,
  };
}

/**
 * Calculates string similarity ratio between 0.0 and 1.0 (Levenshtein/Substring hybrid).
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  // Substring inclusion bonus
  if (str1.includes(str2) || str2.includes(str1)) {
    const minLen = Math.min(str1.length, str2.length);
    const maxLen = Math.max(str1.length, str2.length);
    return Math.max(0.75, minLen / maxLen);
  }

  // Levenshtein Distance
  const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[str2.length][str1.length];
  const maxLen = Math.max(str1.length, str2.length);
  return Math.max(0, 1 - distance / maxLen);
}
