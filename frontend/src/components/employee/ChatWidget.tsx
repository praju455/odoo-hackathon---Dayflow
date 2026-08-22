"use client";

import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  provider?: "gemini" | "groq";
  error?: boolean;
}

// History item shape expected by the backend (role is "user" | "model")
interface HistoryItem {
  role: "user" | "model";
  text: string;
}

interface ChatResponse {
  success: boolean;
  reply: string;
  provider: "gemini" | "groq";
  message?: string;
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Provider badge ───────────────────────────────────────────────────────────
function ProviderBadge({ provider }: { provider?: "gemini" | "groq" }) {
  if (!provider) return null;
  const isGroq = provider === "groq";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${
        isGroq
          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
      }`}
      title={isGroq ? "Powered by Groq (fallback)" : "Powered by Gemini"}
    >
      {isGroq ? "⚡ Groq" : "✦ Gemini"}
    </span>
  );
}

// ─── Simple markdown-ish text renderer ───────────────────────────────────────
// Handles **bold**, `code`, and newlines without a full markdown library.
function MessageText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, li) => {
        if (line === "") return <br key={li} />;
        // Split on **bold** and `code` patterns
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return (
          <p key={li}>
            {parts.map((part, pi) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={pi}>{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={pi}
                    className="bg-slate-700/70 text-indigo-300 rounded px-1 py-0.5 text-xs font-mono"
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pi}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

// ─── ChatWidget ───────────────────────────────────────────────────────────────
// Floats fixed bottom-right.
// offsetRight: CSS value — set to "1.5rem" when no CheckInWidget is present,
// or "calc(1.5rem + 160px)" (default) to sit left of CheckInWidget.
interface ChatWidgetProps {
  offsetRight?: string;
}

export default function ChatWidget({ offsetRight = "calc(1.5rem + 160px)" }: ChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi ${user?.name?.split(" ")[0] ?? "there"} 👋 I'm Dayflow Assistant. Ask me anything about attendance, leaves, your profile, or how to use Dayflow.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [hasUnread, setHasUnread] = useState(false);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      // Focus the input when drawer opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen, scrollToBottom]);

  // Build history for the API (last 10 exchanges = 20 messages, excluding welcome)
  function buildHistory(): HistoryItem[] {
    const realMessages = messages.filter((m) => m.id !== "welcome" && !m.error);
    const last20 = realMessages.slice(-20);
    return last20.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      text: m.text,
    }));
  }

  // ─── Send message ─────────────────────────────────────────────────────────
  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const { data } = await api.post<ChatResponse>("/chat", {
        message: trimmed,
        history: buildHistory(),
      });

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: data.reply,
        provider: data.provider,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If drawer is closed, show unread indicator on the bubble
      if (!isOpen) setHasUnread(true);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Something went wrong. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: errMsg,
          error: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  // Allow Shift+Enter for newlines, Enter to send
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  function clearChat() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: `Hi ${user?.name?.split(" ")[0] ?? "there"} 👋 I'm Dayflow Assistant. Ask me anything about attendance, leaves, your profile, or how to use Dayflow.`,
      },
    ]);
  }

  return (
    // Positioned to the left of CheckInWidget (right-6 + ~120px offset)
    <div className="fixed bottom-6 z-40 flex flex-col items-end gap-2 select-none" style={{ right: offsetRight }}>

      {/* ── Chat drawer ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="
            w-[340px] sm:w-[380px]
            bg-slate-900 border border-slate-700/60
            rounded-2xl shadow-2xl shadow-black/60
            flex flex-col overflow-hidden
            animate-in fade-in slide-in-from-bottom-2 duration-200
          "
          style={{ maxHeight: "min(520px, calc(100vh - 120px))" }}
          role="dialog"
          aria-label="Dayflow AI Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-white"
                  aria-hidden="true"
                >
                  <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                  <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">Dayflow Assistant</p>
                <p className="text-slate-500 text-[10px] leading-tight">
                  Powered by Gemini · Groq fallback
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Clear chat */}
              <button
                type="button"
                onClick={clearChat}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-colors"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-colors"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {/* AI avatar */}
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600/80 flex items-center justify-center shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white" aria-hidden="true">
                        <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                        <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                      </svg>
                    </div>
                  )}

                  <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : msg.error
                          ? "bg-red-500/10 border border-red-500/20 text-red-400 rounded-bl-sm"
                          : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/40"
                      }`}
                    >
                      <MessageText text={msg.text} />
                    </div>
                    {/* Provider badge for AI messages */}
                    {!isUser && <ProviderBadge provider={msg.provider} />}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-indigo-600/80 flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white" aria-hidden="true">
                    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                  </svg>
                </div>
                <div className="bg-slate-800 border border-slate-700/40 rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-700/50 px-3 py-3 bg-slate-800/50 shrink-0">
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Dayflow…"
                rows={1}
                disabled={isTyping}
                aria-label="Chat message input"
                className="
                  flex-1 resize-none min-h-[36px] max-h-[120px]
                  bg-slate-900/80 border border-slate-600/60
                  text-white placeholder-slate-500 text-sm
                  rounded-xl px-3 py-2
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150
                  scrollbar-thin scrollbar-thumb-slate-700
                "
                style={{ overflow: "hidden" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="
                  w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                  bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-150 shadow-md shadow-indigo-500/20
                "
              >
                {isTyping ? (
                  <Spinner className="w-4 h-4 text-white" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 text-white"
                    aria-hidden="true"
                  >
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                )}
              </button>
            </form>
            <p className="text-slate-600 text-[10px] mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* ── Toggle bubble ─────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((v) => !v);
          if (!isOpen) setHasUnread(false);
        }}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
        aria-expanded={isOpen}
        className={`
          relative w-12 h-12 rounded-2xl
          flex items-center justify-center
          shadow-xl transition-all duration-200
          ${
            isOpen
              ? "bg-slate-700 hover:bg-slate-600 shadow-slate-500/20 active:scale-95"
              : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30 active:scale-95"
          }
        `}
      >
        {/* Unread dot */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950 animate-pulse" />
        )}

        {/* Chat / X icon */}
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white" aria-hidden="true">
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
