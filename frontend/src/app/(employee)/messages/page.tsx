"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  id: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
}

interface Conversation {
  user: Partner;
  lastMessage: string | null;
  lastAt: string | null;
}

interface DmMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#4ade80", "#f59e0b", "#f87171"];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allPeople, setAllPeople] = useState<Partner[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<Partner | null>(null);
  const [thread, setThread] = useState<DmMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    try {
      const r = await api.get<{ success: boolean; data: Conversation[] }>("/messages/conversations");
      setConversations(r.data.data);
    } catch {}
  }, []);

  // Load people for new DM
  const loadPeople = useCallback(async () => {
    try {
      const r = await api.get<{ success: boolean; data: Partner[] }>("/messages/people");
      setAllPeople(r.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    loadConversations();
    loadPeople();
  }, [loadConversations, loadPeople]);

  // Load DM thread when activeId changes
  useEffect(() => {
    if (!activeId) return;
    api.get<{ success: boolean; data: { user: Partner; messages: DmMessage[] } }>(`/messages/dm/${activeId}`)
      .then((r) => {
        setActiveUser(r.data.data.user);
        setThread(r.data.data.messages);
      })
      .catch(() => {});
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      const r = await api.post<{ success: boolean; data: DmMessage }>(`/messages/dm/${activeId}`, { content: text });
      setThread((prev) => [...prev, r.data.data]);
      setInput("");
      loadConversations();
    } catch {}
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendMessage();
  }

  function openDm(partner: Partner) {
    setActiveId(partner.id);
    setActiveUser(partner);
    setShowNewDm(false);
    setSearch("");
    // Add to conversations list if not already there
    setConversations((prev) => {
      if (prev.some((c) => c.user.id === partner.id)) return prev;
      return [{ user: partner, lastMessage: null, lastAt: null }, ...prev];
    });
  }

  const filteredPeople = allPeople.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.department ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* Header */}
      <div className="flex items-center justify-between px-[20px] pt-[28px] pb-[24px] border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-heading-page" style={{ color: "var(--text-primary)" }}>Direct Messages</h1>
          <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>Private conversations with teammates</p>
        </div>
        <button
          onClick={() => setShowNewDm(true)}
          className="px-4 py-2 rounded-[10px] text-body-medium font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-on-primary)" }}
        >
          + New Message
        </button>
      </div>

      <div className="flex gap-4 p-[20px]" style={{ height: "calc(100vh - 220px)", minHeight: "480px" }}>
        {/* Left: conversation list */}
        <div
          className="w-[280px] shrink-0 rounded-[12px] border border-[var(--border-default)] flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--bg-field)" }}
        >
          <div className="px-4 pt-4 pb-3 border-b border-[var(--border-default)]">
            <p className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              Conversations ({conversations.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-body-small" style={{ color: "var(--text-tertiary)" }}>No conversations yet</p>
                <p className="text-body-small mt-1" style={{ color: "var(--text-tertiary)" }}>Click "+ New Message" to start one</p>
              </div>
            )}
            {conversations.map((c) => (
              <button
                key={c.user.id}
                onClick={() => openDm(c.user)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[var(--border-default)]"
                style={{ backgroundColor: activeId === c.user.id ? "var(--bg-canvas)" : "transparent" }}
              >
                <div
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: avatarColor(c.user.name) }}
                >
                  {c.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-body-medium truncate" style={{ color: "var(--text-primary)" }}>{c.user.name}</span>
                    {c.lastAt && (
                      <span className="text-body-small shrink-0 ml-1" style={{ color: "var(--text-tertiary)" }}>{fmtTime(c.lastAt)}</span>
                    )}
                  </div>
                  <p className="text-body-small truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {c.lastMessage ?? c.user.jobTitle ?? "Start a conversation"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: chat thread or empty state */}
        {!activeId ? (
          <div
            className="flex-1 rounded-[12px] border border-[var(--border-default)] flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-field)" }}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-body-medium" style={{ color: "var(--text-primary)" }}>Select a conversation</p>
              <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>or start a new one</p>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 rounded-[12px] border border-[var(--border-default)] flex flex-col overflow-hidden"
            style={{ backgroundColor: "var(--bg-field)" }}
          >
            {/* Thread header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)] shrink-0">
              <div
                className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: avatarColor(activeUser?.name ?? "") }}
              >
                {activeUser?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{activeUser?.name}</p>
                <p className="text-body-small" style={{ color: "var(--text-secondary)" }}>{activeUser?.jobTitle ?? activeUser?.department ?? ""}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {thread.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-body-small" style={{ color: "var(--text-tertiary)" }}>
                    No messages yet — say hello!
                  </p>
                </div>
              )}
              {thread.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className="max-w-[70%] rounded-[12px] px-4 py-2.5 text-body-regular"
                      style={{
                        backgroundColor: isMe ? "var(--bg-primary)" : "var(--bg-canvas)",
                        color: isMe ? "var(--text-on-primary)" : "var(--text-primary)",
                        borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      }}
                    >
                      {msg.content}
                    </div>
                    <span className="text-body-small mt-1" style={{ color: "var(--text-tertiary)" }}>
                      {fmtTime(msg.createdAt)}
                    </span>
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
                placeholder={`Message ${activeUser?.name ?? ""}…`}
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
        )}
      </div>

      {/* New DM modal */}
      {showNewDm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowNewDm(false)}>
          <div
            className="rounded-[16px] border border-[var(--border-default)] p-6 w-full max-w-md mx-4"
            style={{ backgroundColor: "var(--bg-field)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-body-medium mb-4" style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "16px" }}>
              New Message
            </h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or department…"
              autoFocus
              className="w-full rounded-[10px] px-4 py-2.5 mb-3 text-body-regular outline-none border border-[var(--border-default)] focus:border-[var(--border-strong)] transition-colors"
              style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}
            />
            <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border-default)]">
              {filteredPeople.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openDm(p)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:opacity-80 transition-opacity"
                >
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: avatarColor(p.name) }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-body-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                    <p className="text-body-small" style={{ color: "var(--text-secondary)" }}>
                      {[p.jobTitle, p.department].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </button>
              ))}
              {filteredPeople.length === 0 && (
                <p className="py-6 text-center text-body-small" style={{ color: "var(--text-tertiary)" }}>No teammates found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
