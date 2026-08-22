"use client";

import { useState } from "react";

interface Message {
  author: string;
  role: string;
  text: string;
  time: string;
  color: string;
}

interface Channel {
  id: string;
  label: string;
  messages: Message[];
}

const CHANNELS: Channel[] = [
  {
    id: "engineering",
    label: "#engineering",
    messages: [
      { author: "Sarah Miller", role: "HR", text: "Reminder: Independence Day holiday on Monday! Enjoy the weekend everyone! 🎉", time: "10:15 AM", color: "#4ade80" },
      { author: "Alex Johnson", role: "", text: "Prisma migration scripts for CrewBase database are complete and tested.", time: "11:05 AM", color: "#6366f1" },
    ],
  },
  {
    id: "general",
    label: "#general",
    messages: [
      { author: "Sarah Miller", role: "HR", text: "Reminder: Independence Day holiday on Monday! Enjoy the weekend everyone! 🎉", time: "10:15 AM", color: "#4ade80" },
      { author: "Alex Johnson", role: "", text: "Prisma migration scripts for CrewBase database are complete and tested.", time: "11:05 AM", color: "#6366f1" },
    ],
  },
  {
    id: "announcements",
    label: "#announcements",
    messages: [
      { author: "Sarah Miller", role: "HR", text: "Reminder: Independence Day holiday on Monday! Enjoy the weekend everyone! 🎉", time: "10:15 AM", color: "#4ade80" },
      { author: "Alex Johnson", role: "", text: "Prisma migration scripts for CrewBase database are complete and tested.", time: "11:05 AM", color: "#6366f1" },
    ],
  },
  {
    id: "design-reviews",
    label: "#design-reviews",
    messages: [
      { author: "Sarah Miller", role: "HR", text: "Reminder: Independence Day holiday on Monday! Enjoy the weekend everyone! 🎉", time: "10:15 AM", color: "#4ade80" },
      { author: "Alex Johnson", role: "", text: "Prisma migration scripts for CrewBase database are complete and tested.", time: "11:05 AM", color: "#6366f1" },
    ],
  },
];

export default function ChatPage() {
  const [activeId, setActiveId] = useState("engineering");
  const active = CHANNELS.find((c) => c.id === activeId)!;

  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* Header */}
      <div className="px-[20px] pt-[28px] pb-[24px] border-b border-[var(--border-default)]">
        <h1 className="text-heading-page" style={{ color: "var(--text-primary)" }}>Team Chat Channels</h1>
        <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>
          Real-time team communication and updates (India Hub)
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4 p-[20px] min-h-[500px]">
        {/* Left: channel list */}
        <div
          className="w-[260px] shrink-0 rounded-[12px] border border-[var(--border-default)] p-4 flex flex-col gap-1"
          style={{ backgroundColor: "var(--bg-field)" }}
        >
          <p className="text-label-caps mb-3 px-2" style={{ color: "var(--text-tertiary)" }}>CHANNELS</p>
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveId(ch.id)}
              className="w-full text-left px-3 py-2.5 rounded-[8px] text-body-regular transition-all"
              style={{
                backgroundColor: activeId === ch.id ? "var(--bg-primary)" : "transparent",
                color: activeId === ch.id ? "var(--text-on-primary)" : "var(--text-secondary)",
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Right: message panel */}
        <div
          className="flex-1 rounded-[12px] border border-[var(--border-default)] p-6 flex flex-col"
          style={{ backgroundColor: "var(--bg-field)" }}
        >
          {/* Channel header */}
          <div className="mb-5 pb-4 border-b border-[var(--border-default)]">
            <h2 className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "16px" }}>{active.label}</h2>
            <p className="text-body-small mt-0.5" style={{ color: "var(--text-secondary)" }}>Channel discussion &amp; daily updates</p>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-5">
            {active.messages.map((msg, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body-medium" style={{ color: msg.color, fontWeight: 600 }}>
                      {msg.author}
                      {msg.role && (
                        <span className="text-body-small ml-1" style={{ color: "var(--text-tertiary)" }}>({msg.role})</span>
                      )}
                    </span>
                  </div>
                  <span className="text-body-small" style={{ color: "var(--text-tertiary)" }}>{msg.time}</span>
                </div>
                <p className="text-body-regular" style={{ color: "var(--text-secondary)" }}>{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
