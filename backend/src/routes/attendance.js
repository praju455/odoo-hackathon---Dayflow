// src/routes/attendance.js
// Member 2 — Attendance endpoints
//
// Step 2: POST /api/attendance/checkin   — clock in for today
//         POST /api/attendance/checkout  — clock out + compute hours
// Step 3: GET  /api/attendance/me        — own month view
//         GET  /api/attendance/today     — admin: who's present right now
//         GET  /api/attendance           — admin: any employee's month

const express  = require("express");
const { z }    = require("zod");
const prisma   = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Returns today as a UTC midnight Date object.
 * Prisma @db.Date fields are compared by date-only, so we strip the time part.
 */
function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Build a standard error response (matches Member 1's shape).
 */
function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

// ─── POST /api/attendance/checkin ───────────────────────────────────────────
/**
 * Creates (or updates) today's attendance record with:
 *   - checkIn  = now
 *   - status   = PRESENT
 *
 * Rejects with 409 if the employee already checked in today.
 */
router.post("/checkin", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today  = todayUTC();
    const now    = new Date();

    // Check whether a record already exists for today
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing?.checkIn) {
      // Duplicate check-in on the same day — reject clearly
      return fail(res, 409, "Already checked in today. You can only check in once per day.");
    }

    let record;

    if (existing) {
      // Record exists (e.g. manually marked ABSENT) — update it
      record = await prisma.attendance.update({
        where: { userId_date: { userId, date: today } },
        data:  { checkIn: now, status: "PRESENT" },
      });
    } else {
      // First touch of the day — create fresh
      record = await prisma.attendance.create({
        data: {
          userId,
          date:    today,
          checkIn: now,
          status:  "PRESENT",
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Checked in successfully.",
      data:    record,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/attendance/checkout ──────────────────────────────────────────
/**
 * Adds checkOut to today's record and computes:
 *   workHours  = (checkOut − checkIn) in decimal hours
 *   extraHours = max(0, workHours − 8)   — hours beyond the standard day
 *
 * Status becomes HALF_DAY if workHours < 4, stays PRESENT otherwise.
 *
 * Rejects if:
 *   - No check-in record for today (404)
 *   - Already checked out today (409)
 */
router.post("/checkout", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today  = todayUTC();
    const now    = new Date();

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!existing || !existing.checkIn) {
      return fail(res, 404, "No check-in found for today. Please check in first.");
    }

    if (existing.checkOut) {
      return fail(res, 409, "Already checked out today. You can only check out once per day.");
    }

    // ── Compute hours ────────────────────────────────────────────────────────
    const checkIn    = new Date(existing.checkIn);
    const checkOut   = now;

    // workHours in decimal (e.g. 7.5 = 7h 30m)
    const workHours  = (checkOut - checkIn) / (1000 * 60 * 60);
    // extraHours = anything beyond the standard 8-hour day
    const extraHours = Math.max(0, workHours - 8);
    // HALF_DAY if worked less than 4 hours
    const status     = workHours < 4 ? "HALF_DAY" : "PRESENT";

    const record = await prisma.attendance.update({
      where: { userId_date: { userId, date: today } },
      data:  {
        checkOut,
        workHours:  parseFloat(workHours.toFixed(2)),
        extraHours: parseFloat(extraHours.toFixed(2)),
        status,
      },
    });

    return res.json({
      success: true,
      message: "Checked out successfully.",
      data:    record,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/attendance/me?month=YYYY-MM ───────────────────────────────────
/**
 * Returns the logged-in employee's own attendance records for a given month.
 * Defaults to the current month if ?month is omitted.
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Parse ?month=YYYY-MM (default: current month)
    const monthParam = req.query.month || new Date().toISOString().slice(0, 7);
    const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM");
    const parsed = monthSchema.safeParse(monthParam);
    if (!parsed.success) return fail(res, 400, parsed.error.errors[0].message);

    const [year, month] = monthParam.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));           // 1st of month
    const end   = new Date(Date.UTC(year, month, 1));               // 1st of next month

    const records = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: "asc" },
    });

    return res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/attendance/today  (admin) ─────────────────────────────────────
/**
 * Returns every employee's attendance status for today.
 * Powers the directory's green/yellow/plane status dots.
 * Admin / HR only.
 */
router.get("/today", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const today = todayUTC();

    const records = await prisma.attendance.findMany({
      where: { date: today },
      include: {
        user: {
          select: { id: true, loginId: true, name: true, department: true, jobTitle: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/attendance?userId=&month=YYYY-MM  (admin) ─────────────────────
/**
 * Returns any employee's monthly attendance records.
 * Both userId and month are required query params.
 * Admin / HR only.
 */
router.get("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const querySchema = z.object({
      userId: z.string().min(1, "userId is required"),
      month:  z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM"),
    });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 400, parsed.error.errors[0].message);
    }

    const { userId, month } = parsed.data;
    const [year, mo] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year, mo - 1, 1));
    const end   = new Date(Date.UTC(year, mo, 1));

    // Confirm the target user exists
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, loginId: true, name: true },
    });
    if (!user) return fail(res, 404, "User not found.");

    const records = await prisma.attendance.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: "asc" },
    });

    return res.json({ success: true, user, data: records });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
