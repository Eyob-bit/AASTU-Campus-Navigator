import { useState, useCallback } from "react";
import { chatApi, type ChatResponsePayload } from "@/api/chat.api";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  payload?: ChatResponsePayload;
}

const SESSION_KEY_STORAGE = "aastu_chat_session_key";

export function useCampusChat() {
  const [sessionKey, setSessionKey] = useState<string>(() => {
    const saved = localStorage.getItem(SESSION_KEY_STORAGE);
    if (saved) return saved;
    const generated = `session_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem(SESSION_KEY_STORAGE, generated);
    return generated;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hi! I'm your AASTU Campus Assistant. Ask me anything like \"Where is the Registrar Office?\", \"Where do I pay tuition?\", or \"Where is Block 12?\".",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      payload: {
        message: "",
        type: "general",
        confidence: 1,
        sessionKey,
        canNavigate: false,
        suggestions: ["Where is the Registrar?", "Where do I pay tuition?", "Where is Block 12?"],
        followUpChips: ["Show campus map", "Find Main Library"],
      },
    },
  ]);

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        sender: "user",
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setError(null);

      try {
        const payload = await chatApi.sendMessage({ message: trimmed, sessionKey });

        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: payload.message,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          payload,
        };

        setMessages((prev) => [...prev, botMsg]);

        // Auto dispatch triggers if returned
        if (payload.actionTrigger) {
          triggerAppAction(payload.actionTrigger.action, payload.actionTrigger.payload);
        }
      } catch (err: unknown) {
        console.error("[useCampusChat] error:", err);
        setError("Network connection issue. Please try again.");

        const errorMsg: ChatMessage = {
          id: `bot_err_${Date.now()}`,
          sender: "bot",
          text: "I experienced a temporary network issue. Please check your connection and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, sessionKey]
  );

  const clearChat = useCallback(() => {
    const newSession = `session_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem(SESSION_KEY_STORAGE, newSession);
    setSessionKey(newSession);
    setMessages([
      {
        id: "welcome_reset",
        sender: "bot",
        text: "Conversation reset! How can I assist you with AASTU Campus navigation?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        payload: {
          message: "",
          type: "general",
          confidence: 1,
          sessionKey: newSession,
          canNavigate: false,
          suggestions: ["Where is the Registrar?", "Where do I pay tuition?", "Where is Block 12?"],
          followUpChips: [],
        },
      },
    ]);
  }, []);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    clearChat,
  };
}

/**
 * Dispatch global app control events for Map navigation & Panorama viewers
 */
export function triggerAppAction(action: string, payload: Record<string, unknown>) {
  if (action === "START_NAVIGATION") {
    window.dispatchEvent(new CustomEvent("aastu_start_navigation", { detail: payload }));
  } else if (action === "CENTER_MAP") {
    window.dispatchEvent(new CustomEvent("aastu_center_building", { detail: payload }));
  } else if (action === "OPEN_PANORAMA") {
    window.dispatchEvent(new CustomEvent("aastu_open_panorama", { detail: payload }));
  }
}
