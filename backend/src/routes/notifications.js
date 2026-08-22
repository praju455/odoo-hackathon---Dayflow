const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications
router.get("/", authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20 // Recent 20
    });
    return res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    return res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
