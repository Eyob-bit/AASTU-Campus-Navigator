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
  "in", "at", "on", "of", "please", "me", "show", "tell", "about", "take", "bring", "navigate", "route",
  "dr", "doctor", "mr", "mister", "mrs", "ms", "miss", "prof", "professor", "ato", "wro", "w/ro",
  "office", "offices", "room", "rooms", "s"
]);

export function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]s\b/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSearchTokens(text: string): string[] {
  const normalized = cleanText(text);
  return normalized
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

export function analyzeQueryIntent(query: string): NormalizedQuery {
  const raw = query.trim();
  const normalized = cleanText(raw);
  const tokens = extractSearchTokens(raw);

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
  } else if (normalized.includes("dean") || normalized.includes("director") || normalized.includes("head") || normalized.includes("officer") || normalized.includes("dr ") || normalized.includes("prof ") || normalized.includes("who is")) {
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
 * Calculates string similarity ratio between 0.0 and 1.0 (Levenshtein/Token hybrid).
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const str1 = cleanText(s1);
  const str2 = cleanText(s2);

  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const rawWords1 = str1.split(" ").filter(Boolean);
  const rawWords2 = str2.split(" ").filter(Boolean);

  const words1 = rawWords1.filter((w) => !STOP_WORDS.has(w)).length > 0
    ? rawWords1.filter((w) => !STOP_WORDS.has(w))
    : rawWords1;
  const words2 = rawWords2.filter((w) => !STOP_WORDS.has(w)).length > 0
    ? rawWords2.filter((w) => !STOP_WORDS.has(w))
    : rawWords2;

  // Exact word token overlap score
  const matchingWords = words1.filter((w) => words2.includes(w));
  if (matchingWords.length > 0) {
    const wordScore = (matchingWords.length * 2) / (words1.length + words2.length);
    if (matchingWords.length === words1.length || matchingWords.length === words2.length) {
      return Math.max(0.85, wordScore);
    }
  }

  // Word-by-word best alignment
  let totalWordSim = 0;
  for (const w1 of words1) {
    let maxSimForWord = 0;
    for (const w2 of words2) {
      const sim = levenshteinSimilarity(w1, w2);
      if (sim > maxSimForWord) maxSimForWord = sim;
    }
    totalWordSim += maxSimForWord;
  }
  const tokenAvgSim = totalWordSim / Math.max(words1.length, 1);

  // Full content string Levenshtein
  const joined1 = words1.join(" ");
  const joined2 = words2.join(" ");
  const fullSim = levenshteinSimilarity(joined1, joined2);

  return Math.max(fullSim, tokenAvgSim);
}

function levenshteinSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}
