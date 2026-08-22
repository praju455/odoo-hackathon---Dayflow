// src/routes/messages.js
// Dayflow HRMS — Direct Messages + Channel Messages API

const express = require("express");
const prisma = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// ─── DM: List conversation partners ──────────────────────────────────────────
// Returns a list of users the current user has exchanged DMs with,
// plus the most recent message and timestamp for each.

router.get("/conversations", authenticate, async (req, res, next) => {
  try {
    const myId = req.user.userId;

    // Find all DM partners (deduplicated)
    const sent = await prisma.message.findMany({
      where: { senderId: myId },
      select: { receiver: { select: { id: true, name: true, jobTitle: true, department: true } }, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const received = await prisma.message.findMany({
      where: { receiverId: myId },
      select: { sender: { select: { id: true, name: true, jobTitle: true, department: true } }, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // Merge and deduplicate by partner ID, keeping latest message
    const partnerMap = new Map();
    for (const m of sent) {
      const p = m.receiver;
      if (!partnerMap.has(p.id) || partnerMap.get(p.id).lastAt < m.createdAt) {
        partnerMap.set(p.id, { user: p, lastMessage: m.content, lastAt: m.createdAt });
      }
    }
    for (const m of received) {
      const p = m.sender;
      if (!partnerMap.has(p.id) || partnerMap.get(p.id).lastAt < m.createdAt) {
        partnerMap.set(p.id, { user: p, lastMessage: m.content, lastAt: m.createdAt });
      }
    }

    const conversations = [...partnerMap.values()].sort((a, b) => b.lastAt - a.lastAt);
    return res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
});

// ─── DM: Get thread with a specific user ──────────────────────────────────────

router.get("/dm/:userId", authenticate, async (req, res, next) => {
  try {
    const myId = req.user.userId;
    const otherId = req.params.userId;

    // Verify other user exists in same company
    const other = await prisma.user.findFirst({
      where: { id: otherId, companyId: req.user.companyId },
      select: { id: true, name: true, jobTitle: true, department: true },
    });
    if (!other) return res.status(404).json({ error: "User not found" });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderId: true, content: true, createdAt: true },
    });

    return res.json({ success: true, data: { user: other, messages } });
  } catch (err) {
    next(err);
  }
});

// ─── DM: Send a message ───────────────────────────────────────────────────────

router.post("/dm/:userId", authenticate, async (req, res, next) => {
  try {
    const myId = req.user.userId;
    const otherId = req.params.userId;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: "Message content required" });

    const other = await prisma.user.findFirst({
      where: { id: otherId, companyId: req.user.companyId },
    });
    if (!other) return res.status(404).json({ error: "User not found" });

    const message = await prisma.message.create({
      data: { senderId: myId, receiverId: otherId, content: content.trim() },
    });

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
});

// ─── Channels: List available channels ───────────────────────────────────────
// Returns static channel list + last message preview for each

const DEFAULT_CHANNELS = ["general", "announcements", "engineering", "design-reviews"];

router.get("/channels", authenticate, async (req, res, next) => {
  try {
    const channelData = await Promise.all(
      DEFAULT_CHANNELS.map(async (channel) => {
        const last = await prisma.channelMessage.findFirst({
          where: { companyId: req.user.companyId, channel },
          orderBy: { createdAt: "desc" },
          select: { content: true, createdAt: true, user: { select: { name: true } } },
        });
        return {
          id: channel,
          label: `#${channel}`,
          lastMessage: last?.content ?? null,
          lastAuthor: last?.user?.name ?? null,
          lastAt: last?.createdAt ?? null,
        };
      })
    );
    return res.json({ success: true, data: channelData });
  } catch (err) {
    next(err);
  }
});

// ─── Channels: Get messages in a channel ──────────────────────────────────────

router.get("/channels/:channel", authenticate, async (req, res, next) => {
  try {
    const messages = await prisma.channelMessage.findMany({
      where: { companyId: req.user.companyId, channel: req.params.channel },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true, jobTitle: true } },
      },
    });
    return res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

// ─── Channels: Post a message ─────────────────────────────────────────────────

router.post("/channels/:channel", authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Message content required" });

    const allowed = DEFAULT_CHANNELS;
    if (!allowed.includes(req.params.channel)) {
      return res.status(400).json({ error: "Unknown channel" });
    }

    const msg = await prisma.channelMessage.create({
      data: {
        companyId: req.user.companyId,
        channel: req.params.channel,
        userId: req.user.userId,
        content: content.trim(),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true, jobTitle: true } },
      },
    });

    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
});

// ─── DM: List all company employees (for starting new DMs) ───────────────────

router.get("/people", authenticate, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        companyId: req.user.companyId,
        NOT: { id: req.user.userId }, // exclude self
      },
      select: { id: true, name: true, jobTitle: true, department: true },
      orderBy: { name: "asc" },
    });
    return res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
