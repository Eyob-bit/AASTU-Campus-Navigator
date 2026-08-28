import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Send, Bot, User, Compass, MapPin, Eye, RotateCcw,
  Building2, UserCheck, Layers, ChevronRight,
} from "lucide-react";
import { useCampusChat } from "@/hooks/useCampusChat";
import { useAppActions } from "@/store";
import { cn } from "@/utils/cn";

export function ChatbotPage() {
  const navigate = useNavigate();
  const { setDestinationTarget } = useAppActions();
  const [input, setInput] = useState("");

  const { messages, isTyping, sendMessage, clearChat } = useCampusChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
    <div className="relative flex flex-col min-h-[calc(100dvh-80px)] w-full max-w-4xl mx-auto bg-slate-50 dark:bg-[#080E1E] text-slate-900 dark:text-slate-100 overflow-hidden sm:rounded-3xl sm:border sm:border-slate-800/80 sm:shadow-2xl sm:my-3 sm:min-h-[calc(100dvh-100px)] transition-colors">
      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}

      <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-indigo-900/90 dark:via-slate-900 dark:to-purple-950/90 border-b border-indigo-500/30 dark:border-slate-800 flex items-center justify-between flex-shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 dark:bg-indigo-500/20 border border-white/30 dark:border-indigo-400/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-300 dark:text-amber-400 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
              Chatbot
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white dark:bg-cyan-500/20 dark:text-cyan-400 border border-white/30 dark:border-cyan-500/30 font-mono">
                AI Assistant
              </span>
            </h1>
            <p className="text-xs text-indigo-100 dark:text-slate-400 hidden xs:block">
              AASTU Intelligent Navigation & Campus Knowledge Guide
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-xs font-semibold text-white dark:text-slate-300 dark:hover:text-white border border-white/20 dark:border-slate-700 transition-all cursor-pointer"
          title="Reset Conversation"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Reset Chat</span>
        </button>
      </div>

      {/* ── Main Chat Conversation Body ───────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100/70 dark:bg-slate-950/60 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-[92%] sm:max-w-[85%]",
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md mt-0.5",
                msg.sender === "user"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                  : "bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300"
              )}
            >
              {msg.sender === "user" ? <User size={16} /> : <Bot size={18} />}
            </div>

            {/* Bubble */}
            <div className="flex flex-col space-y-2 min-w-0">
              <div
                className={cn(
                  "px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md",
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                    : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Rich Campus Location Card */}
                {msg.payload?.campusData && msg.payload.campusData.buildingName && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-indigo-500/30 text-slate-900 dark:text-slate-100 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-500/40">
                        {msg.payload.type === "staff" ? "Staff Member" : msg.payload.type === "building" ? "Building" : "Office"}
                      </span>
                      {msg.payload.campusData.buildingCode && (
                        <span className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400 font-bold">
                          {msg.payload.campusData.buildingCode}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-sm text-indigo-900 dark:text-cyan-300">
                      {msg.payload.campusData.entityName || msg.payload.campusData.officeName}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{msg.payload.campusData.buildingName}</span>
                      </div>
                      {msg.payload.campusData.floorNumber !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <Layers size={13} className="text-slate-400 flex-shrink-0" />
                          <span>Floor {msg.payload.campusData.floorNumber}</span>
                          {msg.payload.campusData.roomNumber && (
                            <span className="font-semibold text-indigo-700 dark:text-cyan-300">
                              · Room {msg.payload.campusData.roomNumber}
                            </span>
                          )}
                        </div>
                      )}
                      {msg.payload.campusData.position && (
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={13} className="text-slate-400 flex-shrink-0" />
                          <span>{msg.payload.campusData.position}</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-800/80">
                      {msg.payload.canNavigate && msg.payload.campusData.entranceLatitude && (
                        <button
                          onClick={() => {
                            const cd = msg.payload?.campusData;
                            if (cd) {
                              const targetName = cd.staffName
                                ? `${cd.staffName}'s Office`
                                : cd.officeName || cd.buildingName || "Destination";
                              navigate("/", {
                                state: {
                                  chatAction: "START_NAVIGATION",
                                  payload: {
                                    id: cd.entityId || cd.officeId || cd.buildingId || "chat-nav",
                                    type: cd.entityId && cd.staffName ? "STAFF" : cd.officeId ? "OFFICE" : "BUILDING",
                                    name: targetName,
                                    latitude: cd.entranceLatitude,
                                    longitude: cd.entranceLongitude,
                                    buildingId: cd.buildingId,
                                    buildingName: cd.buildingName,
                                    officeId: cd.officeId,
                                    officeName: cd.officeName,
                                    floorNumber: cd.floorNumber,
                                    roomNumber: cd.roomNumber,
                                    staffName: cd.staffName,
                                    staffPosition: cd.position,
                                    entrySceneId: cd.entrySceneId,
                                  },
                                },
                              });
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                        >
                          <Compass size={13} /> Start Navigation
                        </button>
                      )}

                      {msg.payload.campusData.entranceLatitude && (
                        <button
                          onClick={() => {
                            navigate("/", {
                              state: {
                                chatAction: "CENTER_MAP",
                                payload: {
                                  name: msg.payload?.campusData?.buildingName,
                                  latitude: msg.payload?.campusData?.entranceLatitude,
                                  longitude: msg.payload?.campusData?.entranceLongitude,
                                  buildingId: msg.payload?.campusData?.buildingId,
                                },
                              },
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <MapPin size={13} /> Show on Map
                        </button>
                      )}

                      {msg.payload.campusData.entrySceneId && (
                        <button
                          onClick={() => {
                            const cd = msg.payload?.campusData;
                            if (cd) {
                              const targetName = cd.staffName
                                ? `${cd.staffName}'s Office`
                                : cd.officeName || cd.buildingName || "Target Office";
                              setDestinationTarget({
                                id: cd.entityId || cd.officeId || cd.buildingId || "chat-target",
                                type: cd.entityId && cd.staffName ? "STAFF" : cd.officeId ? "OFFICE" : "BUILDING",
                                name: targetName,
                                latitude: cd.entranceLatitude || 0,
                                longitude: cd.entranceLongitude || 0,
                                buildingId: cd.buildingId,
                                buildingName: cd.buildingName,
                                officeId: cd.officeId,
                                officeName: cd.officeName,
                                floorNumber: cd.floorNumber,
                                roomNumber: cd.roomNumber,
                                staffName: cd.staffName,
                                staffPosition: cd.position,
                                entrySceneId: cd.entrySceneId,
                              });
                            }
                            navigate(`/panorama/${msg.payload?.campusData?.entrySceneId}`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                        >
                          <Eye size={13} /> Show Inside
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
                      className="px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-900 text-indigo-600 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-cyan-500 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <span>{chip}</span>
                      <ChevronRight size={12} />
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 py-1">
            <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Chatbot is thinking…
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested Prompts Bar ────────────────────────────────────────── */}
      {messages.length < 3 && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex-shrink-0">
            Suggestions:
          </span>
          {["Where is the Registrar Office?", "Where do I pay tuition?", "Where is Block 12?", "Where is Main Library?"].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(suggestion)}
              className="px-3 py-1 rounded-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-cyan-400 transition-colors cursor-pointer flex-shrink-0 shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Bar ──────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Chatbot anything about AASTU campus…"
          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-cyan-400 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-4 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 flex-shrink-0"
        >
          <Send size={15} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );

}
