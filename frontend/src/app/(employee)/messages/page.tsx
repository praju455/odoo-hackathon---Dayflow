"use client";

import { useState, useRef, useEffect } from "react";

interface Msg { from: "me" | "them"; text: string; time: string; }
interface Conversation {
  id: string;
  name: string;
  role: string;
  initial: string;
  color: string;
  preview: string;
  time: string;
  messages: Msg[];
}

const CONVOS: Conversation[] = [
  {
    id: "milena",
    name: "Milena Page",
    role: "Senior Frontend Developer",
    initial: "M",
    color: "#6366f1",
    preview: "Hey! The component review for pay...",
    time: "Yesterday",
    messages: [
      { from: "them", text: "Hi Aditi! Did you get a chance to review the HDFC payment UI?", time: "10:30 AM" },
      { from: "me", text: "Yes, Milena! Looks super clean. We just need to check the UPI callback status.", time: "10:35 AM" },
      { from: "them", text: "Awesome! The callback status has been tested on staging.", time: "10:40 AM" },
    ],
  },
  {
    id: "sarah",
    name: "Sarah Miller",
    role: "HR Manager",
    initial: "S",
    color: "#4ade80",
    preview: "Please check the leave request appr...",
    time: "Yesterday",
    messages: [
      { from: "them", text: "Please check the leave request approval flow when you get a chance.", time: "09:15 AM" },
      { from: "me", text: "On it! I'll review it by EOD.", time: "09:45 AM" },
    ],
  },
  {
    id: "alex",
    name: "Alex Johnson",
    role: "Backend Engineer",
    initial: "A",
    color: "#8b5cf6",
    preview: "API endpoint for attendance sync is d...",
    time: "Aug 21",
    messages: [
      { from: "them", text: "API endpoint for attendance sync is done. Ready for review.", time: "03:20 PM" },
      { from: "me", text: "Great work! I'll pull it tonight.", time: "04:00 PM" },
    ],
  },
];

export default function MessagesPage() {
  const [activeId, setActiveId] = useState("milena");
  const [input, setInput] = useState("");
  const [convos, setConvos] = useState(CONVOS);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = convos.find((c) => c.id === activeId)!;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, active.messages.length]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setConvos((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, { from: "me", text, time: now }], preview: text.slice(0, 40) + (text.length > 40 ? "..." : "") }
          : c
      )
    );
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* Header */}
      <div className="px-[20px] pt-[28px] pb-[24px] border-b border-[var(--border-default)]">
        <h1 className="text-heading-page" style={{ color: "var(--text-primary)" }}>Direct Messages</h1>
        <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>Private conversations with teammates</p>
      </div>

      <div className="flex gap-4 p-[20px]" style={{ height: "calc(100vh - 280px)", minHeight: "480px" }}>
        {/* Left: conversation list */}
        <div
          className="w-[280px] shrink-0 rounded-[12px] border border-[var(--border-default)] flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--bg-field)" }}
        >
          <div className="px-4 pt-4 pb-3 border-b border-[var(--border-default)]">
            <p className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Direct Messages</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convos.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[var(--border-default)]"
                style={{ backgroundColor: activeId === c.id ? "var(--bg-canvas)" : "transparent" }}
              >
                <div
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: c.color }}
                >
                  {c.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-body-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                    <span className="text-body-small shrink-0 ml-1" style={{ color: "var(--text-tertiary)" }}>{c.time}</span>
                  </div>
                  <p className="text-body-small truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{c.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: chat thread */}
        <div
          className="flex-1 rounded-[12px] border border-[var(--border-default)] flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--bg-field)" }}
        >
          {/* Thread header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)] shrink-0">
            <div
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: active.color }}
            >
              {active.initial}
            </div>
            <div>
              <p className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{active.name}</p>
              <p className="text-body-small" style={{ color: "var(--text-secondary)" }}>{active.role}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {active.messages.map((msg, i) => {
              const isMe = msg.from === "me";
              return (
                <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className="max-w-[70%] rounded-[12px] px-4 py-2.5 text-body-regular"
                    style={{
                      backgroundColor: isMe ? "var(--bg-primary)" : "var(--bg-canvas)",
                      color: isMe ? "var(--text-on-primary)" : "var(--text-primary)",
                      borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    }}
                  >
                    {msg.text}
                  </div>
                  <span className="text-body-small mt-1" style={{ color: "var(--text-tertiary)" }}>{msg.time}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 px-4 py-3 border-t border-[var(--border-default)] flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${active.name}...`}
              className="flex-1 rounded-[10px] px-4 py-2.5 text-body-regular outline-none border border-[var(--border-default)] focus:border-[var(--border-strong)] transition-colors"
              style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2.5 rounded-[10px] text-body-medium font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-on-primary)", minWidth: "70px" }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
