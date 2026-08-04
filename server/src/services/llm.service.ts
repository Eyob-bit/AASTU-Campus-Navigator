/**
 * LLM Service - Abstracted interface for AI response generation.
 * Currently backed by Google Gemini API with fallback support.
 */

export interface LLMMessageContext {
  matchedType?: "building" | "office" | "staff" | "alias" | "panorama" | "none";
  entityName?: string;
  buildingName?: string;
  buildingCode?: string;
  floorNumber?: number;
  roomNumber?: string;
  description?: string;
  position?: string;
  confidence?: number;
  clarificationCandidates?: Array<{ name: string; type: string; details?: string }>;
}

const AASTU_SYSTEM_PROMPT = `You are the official AASTU Campus Assistant for Addis Ababa Science and Technology University (AASTU).
Your job is to assist students, staff, and visitors with friendly, accurate, and concise guidance.

CRITICAL SAFETY & GROUNDING RULES:
1. NEVER invent or hallucinate campus facts, building codes, room numbers, staff names, or office locations.
2. If campus data is provided in the Context below, use ONLY that data to answer location questions.
3. If no campus data is provided and the user asks about an AASTU location, politely explain that you do not have that specific building/office recorded in the database yet.
4. For general academic or general knowledge questions (e.g. study tips, AI explanations), provide helpful, encouraging answers.
5. Keep responses concise, warm, and clear (1-3 sentences maximum).
6. Do NOT mention database IDs, confidence scores, or internal technical details in your response.`;

export async function generateLLMResponse(
  userQuery: string,
  context?: LLMMessageContext
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Build structured prompt for Gemini
  let promptContext = "";
  if (context && context.entityName) {
    promptContext = `[CAMPUS DATA CONTEXT]
- Entity Type: ${context.matchedType ?? "Location"}
- Name: ${context.entityName}
${context.buildingName ? `- Building: ${context.buildingName} ${context.buildingCode ? `(${context.buildingCode})` : ""}` : ""}
${context.floorNumber !== undefined ? `- Floor: ${context.floorNumber}` : ""}
${context.roomNumber ? `- Room Number: ${context.roomNumber}` : ""}
${context.position ? `- Position/Role: ${context.position}` : ""}
${context.description ? `- Description: ${context.description}` : ""}
`;
  } else if (context && context.clarificationCandidates && context.clarificationCandidates.length > 0) {
    promptContext = `[AMBIGUOUS MATCHES - ASK CLARIFICATION]
Options found:
${context.clarificationCandidates.map((c) => `- ${c.name} (${c.type}): ${c.details || ""}`).join("\n")}
`;
  }

  // If Gemini API Key is missing, generate high-quality deterministic response fallback
  if (!apiKey) {
    return generateFallbackResponse(userQuery, context);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: AASTU_SYSTEM_PROMPT },
            { text: `${promptContext}\nUser Query: "${userQuery}"\n\nPlease answer the user in a natural, friendly sentence based strictly on the rules and context above.` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 250,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.warn("[LLM Service] Gemini API returned error:", response.statusText);
      return generateFallbackResponse(userQuery, context);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) return text;

    return generateFallbackResponse(userQuery, context);
  } catch (err) {
    console.error("[LLM Service] Gemini request error:", err);
    return generateFallbackResponse(userQuery, context);
  }
}

/**
 * Deterministic fallback generator when LLM API Key is absent or encounters network timeouts.
 */
function generateFallbackResponse(userQuery: string, context?: LLMMessageContext): string {
  if (context && context.entityName) {
    const loc = context.buildingName ? `in ${context.buildingName}` : "";
    const floor = context.floorNumber !== undefined ? `, Floor ${context.floorNumber}` : "";
    const room = context.roomNumber ? ` (Room ${context.roomNumber})` : "";

    if (context.matchedType === "staff") {
      return `${context.entityName} (${context.position || "Staff"}) is located at ${loc}${floor}${room}.`;
    }
    if (context.matchedType === "office") {
      return `The ${context.entityName} is located ${loc}${floor}${room}.`;
    }
    if (context.matchedType === "building") {
      return `${context.entityName} is on campus. Would you like me to start navigation?`;
    }
    return `${context.entityName} is located ${loc}${floor}${room}.`;
  }

  if (context && context.clarificationCandidates && context.clarificationCandidates.length > 0) {
    const names = context.clarificationCandidates.map((c) => c.name).join(" or ");
    return `Did you mean ${names}? Please specify so I can assist you better.`;
  }

  return "I'm the AASTU Campus Assistant. I couldn't find a matching office or building for your request in our current database. You can try searching by building name, room, or staff member.";
}
