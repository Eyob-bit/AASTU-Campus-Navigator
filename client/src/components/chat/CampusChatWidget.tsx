import { useState, useRef, useEffect } from "react";
import {
  Sparkles, X, Send, Bot, User, Compass, MapPin, Eye, RotateCcw,
  Building2, UserCheck, Layers, ChevronRight,
} from "lucide-react";
import { useCampusChat, triggerAppAction } from "@/hooks/useCampusChat";
import { cn } from "@/utils/cn";

export function CampusChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isTyping, sendMessage, clearChat } = useCampusChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleChipClick = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end font-sans">
      {/* ── Collapsible Chat Window ──────────────────────────────────────────── */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[540px] sm:h-[580px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] mb-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Top Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between flex-shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-snug flex items-center gap-1.5">
                  AASTU Campus Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                </h3>
                <p className="text-[11px] text-indigo-100 font-medium">Smart AI Navigator & Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset Conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close Chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-950/50 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5 max-w-[90%]",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm mt-0.5",
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                  )}
                >
                  {msg.sender === "user" ? <User size={14} /> : <Bot size={15} />}
                </div>

                {/* Bubble */}
                <div className="flex flex-col space-y-2">
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm",
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                        : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-100 dark:border-slate-700/60 rounded-tl-none"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Rich Entity Card Component */}
                    {msg.payload?.campusData && msg.payload.campusData.buildingName && (
                      <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-700/80 text-gray-900 dark:text-slate-100 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {msg.payload.type === "staff" ? "Staff Member" : msg.payload.type === "building" ? "Building" : "Office"}
                          </span>
                          {msg.payload.campusData.buildingCode && (
                            <span className="text-[10px] font-mono text-gray-500 dark:text-slate-400">
                              {msg.payload.campusData.buildingCode}
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-xs sm:text-sm text-indigo-900 dark:text-indigo-300">
                          {msg.payload.campusData.entityName || msg.payload.campusData.officeName}
                        </div>

                        <div className="text-[11px] text-gray-600 dark:text-slate-300 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{msg.payload.campusData.buildingName}</span>
                          </div>
                          {msg.payload.campusData.floorNumber !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Layers size={12} className="text-gray-400 flex-shrink-0" />
                              <span>Floor {msg.payload.campusData.floorNumber}</span>
                              {msg.payload.campusData.roomNumber && (
                                <span className="font-semibold text-gray-700 dark:text-slate-200">
                                  · Room {msg.payload.campusData.roomNumber}
                                </span>
                              )}
                            </div>
                          )}
                          {msg.payload.campusData.position && (
                            <div className="flex items-center gap-1.5">
                              <UserCheck size={12} className="text-gray-400 flex-shrink-0" />
                              <span>{msg.payload.campusData.position}</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="pt-2 flex flex-wrap gap-1.5 border-t border-gray-200/60 dark:border-slate-800">
                          {msg.payload.canNavigate && msg.payload.campusData.entranceLatitude && (
                            <button
                              onClick={() => {
                                const cd = msg.payload?.campusData;
                                triggerAppAction("START_NAVIGATION", {
                                  name: cd?.officeName || cd?.staffName || cd?.buildingName || "Destination",
                                  latitude: cd?.entranceLatitude,
                                  longitude: cd?.entranceLongitude,
                                  buildingId: cd?.buildingId,
                                  buildingName: cd?.buildingName,
                                  officeId: cd?.officeId,
                                  officeName: cd?.officeName,
                                  floorId: (cd as any)?.floorId,
                                  floorNumber: cd?.floorNumber,
                                  roomNumber: cd?.roomNumber,
                                  staffName: cd?.staffName,
                                  entrySceneId: cd?.entrySceneId,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            >
                              <Compass size={12} /> Start Navigation
                            </button>
                          )}

                          {msg.payload.campusData.entranceLatitude && (
                            <button
                              onClick={() => {
                                triggerAppAction("CENTER_MAP", {
                                  latitude: msg.payload?.campusData?.entranceLatitude,
                                  longitude: msg.payload?.campusData?.entranceLongitude,
                                  buildingId: msg.payload?.campusData?.buildingId,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <MapPin size={12} /> Show on Map
                            </button>
                          )}

                          {msg.payload.campusData.entrySceneId && (
                            <button
                              onClick={() => {
                                triggerAppAction("OPEN_PANORAMA", {
                                  sceneId: msg.payload?.campusData?.entrySceneId,
                                  buildingId: msg.payload?.campusData?.buildingId,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            >
                              <Eye size={12} /> Show Inside
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contextual Follow-up Chips */}
                  {msg.payload?.followUpChips && msg.payload.followUpChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.payload.followUpChips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleChipClick(chip)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{chip}</span>
                          <ChevronRight size={10} />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-gray-400 dark:text-slate-500 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-slate-400 py-1">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center justify-center flex-shrink-0">
                  <Bot size={15} />
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px] font-medium text-gray-400 dark:text-slate-400">
                    Thinking…
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions Bar */}
          {messages.length < 3 && (
            <div className="px-4 py-2 bg-gray-100/60 dark:bg-slate-900/60 border-t border-gray-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex-shrink-0">
                Try asking:
              </span>
              {["Where is Registrar?", "Where do I pay tuition?", "Where is Block 12?"].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(suggestion)}
                  className="px-2.5 py-1 rounded-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-indigo-300 transition-colors cursor-pointer flex-shrink-0"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AASTU Assistant…"
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Action Button (FAB) ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 cursor-pointer active:scale-95",
          isOpen
            ? "bg-slate-900 dark:bg-slate-800 text-white"
            : "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white hover:shadow-indigo-500/25"
        )}
        aria-label="Toggle AI Assistant"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-amber-300 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-700 animate-pulse" />
        </div>
        <span className="font-bold text-xs sm:text-sm tracking-wide">
          {isOpen ? "Close Assistant" : "Ask AI Assistant"}
        </span>
      </button>
    </div>
  );
}
