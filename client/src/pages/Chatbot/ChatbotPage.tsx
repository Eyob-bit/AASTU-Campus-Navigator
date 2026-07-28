import { useState } from "react";
import { Bot, Send, MapPin, BookOpen, Building, Sparkles } from "lucide-react";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "ai",
    text: "Hello! I am the AASTU AI assistant. How can I help you today? I know about Block 76, Block 71, the Library, and Social Science Hall.",
    timestamp: "Just now",
  },
];

const SUGGESTED_PROMPTS = [
  {
    icon: MapPin,
    text: "Where is the Registrar's Office?",
    response:
      "The Registrar's Office is located on the Ground Floor of Block 71 (Administration Building), Room 102.",
  },
  {
    icon: BookOpen,
    text: "What are the Library hours?",
    response:
      "The AASTU Main Library is open Monday to Friday from 8:00 AM – 10:00 PM, and Saturday/Sunday from 9:00 AM – 6:00 PM.",
  },
  {
    icon: Building,
    text: "Where is Block 76?",
    response:
      "Block 76 is located near the Electrical Engineering Department in the Northern Sector of the campus.",
  },
];

export function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState("");

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery.trim();
    if (!query) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");

    // Simulate AI response
    setTimeout(() => {
      let aiText =
        "I can help you navigate to offices, faculties, or find staff at AASTU! Feel free to ask about specific block numbers or departments.";

      const lower = query.toLowerCase();
      if (lower.includes("registrar")) {
        aiText =
          "The Registrar's Office is located in Block 71 (Administration Block), Ground Floor. Use our Campus Map to view indoor floor plans.";
      } else if (lower.includes("library")) {
        aiText =
          "The AASTU Library is located central campus, opposite Block 54. It offers quiet study areas, digital archives, and e-learning resources.";
      } else if (lower.includes("block 76")) {
        aiText =
          "Block 76 houses Computer Science & Software Engineering labs. It is located near the main academic walkway.";
      } else if (lower.includes("block 71")) {
        aiText =
          "Block 71 is the Administration Building containing the President's office, Registrar, and Finance department.";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <div className="relative h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-8rem)] w-full max-w-4xl mx-auto bg-[#080E1E] text-slate-100 flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-2xl">
      {/* Background aerial graphic overlay */}
      <div
        className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80')",
        }}
      />

      {/* Page Header */}
      <div className="relative z-10 border-b border-slate-800/80 bg-[#0B132B]/90 backdrop-blur-md px-6 py-4 text-center">
        <h1 className="font-display text-lg font-bold text-slate-100 tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          AASTU AI Assistant
        </h1>
      </div>

      {/* Messages Scroll Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {msg.sender === "ai" && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
                <Bot className="h-5 w-5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/30"
                  : "bg-[#131F3F]/90 text-slate-200 border border-slate-700/60 rounded-bl-none backdrop-blur-md"
              }`}
            >
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Suggested Prompts */}
        {messages.length <= 2 && (
          <div className="pt-4 space-y-2 max-w-md mx-auto">
            <p className="text-xs text-center text-slate-400 font-medium mb-3">
              Suggested Questions:
            </p>
            {SUGGESTED_PROMPTS.map((prompt, i) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(prompt.text)}
                  className="w-full flex items-center gap-3 rounded-xl border border-slate-700/60 bg-[#131F3F]/70 px-4 py-3 text-left text-xs font-medium text-slate-200 transition-all hover:bg-[#1A2952] hover:border-cyan-500/50 hover:text-white"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{prompt.text}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <div className="relative z-10 border-t border-slate-800/80 bg-[#0B132B]/90 backdrop-blur-md p-4 max-w-2xl mx-auto w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-[#131F3F]/90 px-4 py-2.5 focus-within:border-cyan-500"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 transition-transform active:scale-95 hover:scale-105"
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
