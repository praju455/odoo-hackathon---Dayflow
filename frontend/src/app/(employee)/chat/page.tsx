"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChannelInfo {
  id: string;
  label: string;
  lastMessage: string | null;
  lastAuthor: string | null;
  lastAt: string | null;
}

interface ChannelMsg {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; jobTitle: string | null };
}

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#4ade80", "#f59e0b", "#f87171"];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [activeId, setActiveId] = useState<string>("general");
  const [messages, setMessages] = useState<ChannelMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load channel list
  useEffect(() => {
    api.get<{ success: boolean; data: ChannelInfo[] }>("/messages/channels")
      .then((r) => setChannels(r.data.data))
      .catch(() => {});
  }, []);

  // Load messages when channel changes
  const loadMessages = useCallback(async (channelId: string) => {
    try {
      const r = await api.get<{ success: boolean; data: ChannelMsg[] }>(`/messages/channels/${channelId}`);
      setMessages(r.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const r = await api.post<{ success: boolean; data: ChannelMsg }>(`/messages/channels/${activeId}`, { content: text });
      setMessages((prev) => [...prev, r.data.data]);
      setInput("");
      // Refresh channel list to update preview
      api.get<{ success: boolean; data: ChannelInfo[] }>("/messages/channels")
        .then((r) => setChannels(r.data.data))
        .catch(() => {});
    } catch {}
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendMessage();
  }

  const activeChannel = channels.find((c) => c.id === activeId);

  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* Header */}
      <div className="px-[20px] pt-[28px] pb-[24px] border-b border-[var(--border-default)]">
        <h1 className="text-heading-page" style={{ color: "var(--text-primary)" }}>Team Channels</h1>
        <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>
          Company-wide conversations and announcements
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4 p-[20px]" style={{ height: "calc(100vh - 220px)", minHeight: "480px" }}>
        {/* Left: channel list */}
        <div
          className="w-[260px] shrink-0 rounded-[12px] border border-[var(--border-default)] p-4 flex flex-col gap-1 overflow-y-auto"
          style={{ backgroundColor: "var(--bg-field)" }}
        >
          <p className="text-label-caps mb-3 px-2" style={{ color: "var(--text-tertiary)" }}>CHANNELS</p>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveId(ch.id)}
              className="w-full text-left px-3 py-2.5 rounded-[8px] text-body-regular transition-all"
              style={{
                backgroundColor: activeId === ch.id ? "var(--bg-primary)" : "transparent",
                color: activeId === ch.id ? "var(--text-on-primary)" : "var(--text-secondary)",
              }}
            >
              <span>{ch.label}</span>
              {ch.lastMessage && (
                <p
                  className="text-body-small truncate mt-0.5"
                  style={{ color: activeId === ch.id ? "var(--text-on-primary)" : "var(--text-tertiary)", opacity: 0.75 }}
                >
                  {ch.lastAuthor}: {ch.lastMessage}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Right: message panel */}
        <div
          className="flex-1 rounded-[12px] border border-[var(--border-default)] flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--bg-field)" }}
        >
          {/* Channel header */}
          <div className="mb-0 px-6 py-4 border-b border-[var(--border-default)] shrink-0">
            <h2 className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "16px" }}>
              {activeChannel?.label ?? `#${activeId}`}
            </h2>
            <p className="text-body-small mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Channel discussion &amp; daily updates
            </p>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-body-small" style={{ color: "var(--text-tertiary)" }}>
                  No messages in {activeChannel?.label ?? `#${activeId}`} yet — be the first!
                </p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.user.id === user?.id;
              return (
                <div key={msg.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: avatarColor(msg.user.name) }}
                      >
                        {msg.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-body-medium" style={{ color: avatarColor(msg.user.name), fontWeight: 600 }}>
                        {msg.user.name}
                        {isMe && (
                          <span className="text-body-small ml-1" style={{ color: "var(--text-tertiary)" }}>(you)</span>
                        )}
                        {msg.user.jobTitle && (
                          <span className="text-body-small ml-1" style={{ color: "var(--text-tertiary)" }}>
                            · {msg.user.jobTitle}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-body-small" style={{ color: "var(--text-tertiary)" }}>{fmtTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-body-regular pl-9" style={{ color: "var(--text-secondary)" }}>{msg.content}</p>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t border-[var(--border-default)] flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${activeChannel?.label ?? `#${activeId}`}…`}
              className="flex-1 rounded-[10px] px-4 py-2.5 text-body-regular outline-none border border-[var(--border-default)] focus:border-[var(--border-strong)] transition-colors"
              style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}
            />
            <button
              onClick={sendMessage}
              disabled={sending}
              className="px-4 py-2.5 rounded-[10px] text-body-medium font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-on-primary)", minWidth: "70px" }}
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
