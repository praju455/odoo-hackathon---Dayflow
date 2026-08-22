// src/routes/leave.js
// Member 2 — Leave endpoints
//
// Step 4: GET /api/leave/allocations/me      — own leave balances
//         GET /api/leave/allocations/:userId — admin: view anyone's balances
//
// (Steps 5 & 6 will add leave application and approval endpoints here)

const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

// ─── GET /api/leave/allocations/me ──────────────────────────────────────────
/**
 * Returns the logged-in employee's own leave allocations for the current year.
 * Shows totalDays and usedDays for PAID, SICK, and UNPAID leaves.
 */
router.get("/allocations/me", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const allocations = await prisma.leaveAllocation.findMany({
      where: { userId, year: currentYear },
      orderBy: { leaveType: "asc" },
    });

    return res.json({ success: true, data: allocations });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/leave/allocations/:userId (admin) ─────────────────────────────
/**
 * Returns a specific employee's leave allocations.
 * Admin / HR only.
 */
router.get("/allocations/:userId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentYear = new Date().getFullYear();

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, loginId: true, name: true }
    });

    if (!user) {
      return fail(res, 404, "User not found.");
    }

    const allocations = await prisma.leaveAllocation.findMany({
      where: { userId, year: currentYear },
      orderBy: { leaveType: "asc" },
    });

    return res.json({ success: true, user, data: allocations });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
