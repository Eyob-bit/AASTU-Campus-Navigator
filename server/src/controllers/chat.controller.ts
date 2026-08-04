import type { Request, Response } from "express";
import { processChatMessage } from "../services/chat.service.js";

export async function handleChatMessage(req: Request, res: Response): Promise<void> {
  try {
    const { message, sessionKey } = req.body as { message?: string; sessionKey?: string };

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message string is required." });
      return;
    }

    const payload = await processChatMessage(message.trim(), sessionKey || "default_session");
    res.json(payload);
  } catch (err: unknown) {
    console.error("[Chat Controller Error]:", err);
    res.status(500).json({
      error: "Internal server error while processing chat message.",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
