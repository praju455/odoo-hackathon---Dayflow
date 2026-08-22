// src/routes/chat.js
// Dayflow HRMS — AI Chat endpoint
// Primary provider: Google Gemini (gemini-1.5-flash)
// Fallback provider: Groq (llama-3.1-8b-instant)
//
// POST /api/chat
//   Body: { message: string, history?: { role: "user"|"model", text: string }[] }
//   Auth: Bearer JWT (authenticate middleware)
//   Returns: { success: true, reply: string, provider: "gemini"|"groq" }

const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const { z } = require("zod");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// ─── System prompt ────────────────────────────────────────────────────────────
// Gives the model context about Dayflow HRMS so it can answer HR-specific
// questions accurately without inventing features that don't exist.
function buildSystemPrompt(user) {
  return `You are Dayflow Assistant, a helpful AI assistant embedded in the Dayflow HRMS (Human Resource Management System).

You are talking to: ${user.name ?? "an employee"} (Role: ${user.role ?? "EMPLOYEE"}, Login ID: ${user.loginId ?? "unknown"}).

About Dayflow HRMS:
- It is a company HR platform for managing employees, attendance, leaves, and salaries.
- Employees can check in/out, view their attendance history, apply for time-off (leaves), and view their profile.
- Admins can manage all employees, approve/reject leave requests, view attendance reports, and configure salary structures.
- Leave types available: PAID, SICK, UNPAID.
- Attendance statuses: PRESENT, ABSENT, HALF_DAY, LEAVE.

Your role:
- Answer HR-related questions helpfully and concisely.
- Help employees understand how to use Dayflow (check-in, time-off requests, profiles).
- Help admins with HR tasks like managing leave approvals, salary setup, employee onboarding.
- If asked about something outside Dayflow or HR, politely redirect to HR topics.
- Keep responses concise and friendly. Use markdown for structured answers when helpful.
- Never make up employee data — if specific data is needed, tell the user to navigate to the relevant page.`;
}

// ─── Input validation ─────────────────────────────────────────────────────────
const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().max(2000),
      })
    )
    .max(20, "History too long")
    .optional()
    .default([]),
});

// ─── Gemini helper ────────────────────────────────────────────────────────────
async function callGemini(systemPrompt, history, userMessage) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  });

  // Gemini uses "parts" format for history
  const geminiHistory = history.map((h) => ({
    role: h.role, // "user" or "model"
    parts: [{ text: h.text }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

// ─── Groq helper ─────────────────────────────────────────────────────────────
async function callGroq(systemPrompt, history, userMessage) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Build OpenAI-style messages array
  const messages = [
    { role: "system", content: systemPrompt },
    // Convert history: Gemini uses "model", OpenAI/Groq uses "assistant"
    ...history.map((h) => ({
      role: h.role === "model" ? "assistant" : "user",
      content: h.text,
    })),
    { role: "user", content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content ?? "I couldn't generate a response.";
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
router.post("/", authenticate, async (req, res) => {
  // Validate input
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.errors[0]?.message ?? "Invalid request",
    });
  }

  const { message, history } = parsed.data;
  const systemPrompt = buildSystemPrompt(req.user);

  // ── Try Gemini first ──────────────────────────────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    try {
      const reply = await callGemini(systemPrompt, history, message);
      return res.json({ success: true, reply, provider: "gemini" });
    } catch (geminiError) {
      console.warn(
        "[Chat] Gemini failed, falling back to Groq:",
        geminiError?.message ?? geminiError
      );
      // Fall through to Groq
    }
  } else {
    console.warn("[Chat] GEMINI_API_KEY not set — skipping Gemini, trying Groq");
  }

  // ── Fall back to Groq ─────────────────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const reply = await callGroq(systemPrompt, history, message);
      return res.json({ success: true, reply, provider: "groq" });
    } catch (groqError) {
      console.error("[Chat] Groq also failed:", groqError?.message ?? groqError);
      return res.status(503).json({
        success: false,
        message: "AI service is temporarily unavailable. Please try again later.",
      });
    }
  }

  // ── No providers configured ───────────────────────────────────────────────
  return res.status(503).json({
    success: false,
    message: "No AI provider configured. Please set GEMINI_API_KEY or GROQ_API_KEY.",
  });
});

module.exports = router;
