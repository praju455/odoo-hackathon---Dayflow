// src/routes/leave.js
// Member 2 — Leave endpoints
//
// Step 4: GET /api/leave/allocations/me      — own leave balances
//         GET /api/leave/allocations/:userId — admin: view anyone's balances
//
// (Steps 5 & 6 will add leave application and approval endpoints here)

const express = require("express");
const { z } = require("zod");
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

// ─── POST /api/leave ────────────────────────────────────────────────────────
/**
 * Employee applies for leave.
 */
router.post("/", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const applySchema = z.object({
      leaveType: z.enum(["PAID", "SICK", "UNPAID"]),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
      endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
      reason:    z.string().optional(),
      attachmentUrl: z.string().optional(),
    });

    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, parsed.error.errors[0].message);
    }

    const { leaveType, startDate, endDate, reason, attachmentUrl } = parsed.data;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return fail(res, 400, "startDate cannot be after endDate.");
    }

    // Soft-require attachment for SICK leave
    if (leaveType === "SICK" && !attachmentUrl) {
      return fail(res, 400, "SICK leave requires an attachmentUrl (e.g., medical certificate).");
    }

    // Compute allocationDays (inclusive of start and end date)
    const allocationDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check balance for PAID/SICK
    if (leaveType !== "UNPAID") {
      const allocation = await prisma.leaveAllocation.findUnique({
        where: { userId_leaveType_year: { userId, leaveType, year: currentYear } }
      });

      if (!allocation) {
        return fail(res, 400, `No allocation found for ${leaveType} leave this year.`);
      }

      const remaining = allocation.totalDays - allocation.usedDays;
      if (allocationDays > remaining) {
        return fail(res, 400, `Cannot request ${allocationDays} days. You only have ${remaining} ${leaveType} days remaining.`);
      }
    }

    // Create the leave request (PENDING status is default)
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType,
        startDate: start,
        endDate: end,
        allocationDays,
        reason,
        attachmentUrl,
      }
    });

    return res.status(201).json({ success: true, message: "Leave request submitted successfully.", data: leaveRequest });
  } catch (err) {
    next(err);
  }
});
// ─── GET /api/leave/requests/me ─────────────────────────────────────────────
/**
 * Returns the logged-in employee's own leave requests.
 */
router.get("/requests/me", authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const requests = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/leave/requests (admin) ────────────────────────────────────────
/**
 * Returns all leave requests across the company.
 * Admin / HR only.
 */
router.get("/requests", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const requests = await prisma.leaveRequest.findMany({
      include: {
        user: {
          select: { id: true, loginId: true, name: true, department: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/leave/requests/:id (admin) ──────────────────────────────────
/**
 * Admin approves or rejects a leave request.
 * If APPROVED, we deduct the days from the employee's allocation.
 */
router.patch("/requests/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const statusSchema = z.object({
      status: z.enum(["APPROVED", "REJECTED"]),
      adminComment: z.string().optional()
    });

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, parsed.error.errors[0].message);
    }

    const { status, adminComment } = parsed.data;

    // Fetch the request
    const leaveReq = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!leaveReq) {
      return fail(res, 404, "Leave request not found.");
    }

    if (leaveReq.status !== "PENDING") {
      return fail(res, 400, `Leave request is already ${leaveReq.status}.`);
    }

    // Wrap in a transaction to ensure atomic update of request and allocation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the request status
      const updatedReq = await tx.leaveRequest.update({
        where: { id },
        data: { status, adminComment }
      });

      // 2. If APPROVED and not UNPAID, deduct from allocation
      if (status === "APPROVED" && leaveReq.leaveType !== "UNPAID") {
        const year = new Date(leaveReq.startDate).getFullYear();
        
        const allocation = await tx.leaveAllocation.findUnique({
          where: { 
            userId_leaveType_year: { 
              userId: leaveReq.userId, 
              leaveType: leaveReq.leaveType, 
              year 
            } 
          }
        });

        if (!allocation) {
          throw new Error(`Cannot approve: No ${leaveReq.leaveType} allocation found for ${year}.`);
        }

        const remaining = allocation.totalDays - allocation.usedDays;
        if (leaveReq.allocationDays > remaining) {
          throw new Error(`Cannot approve: Employee only has ${remaining} days left.`);
        }

        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: {
            usedDays: { increment: leaveReq.allocationDays }
          }
        });
      }

      return updatedReq;
    });

    return res.json({ success: true, message: `Leave request ${status.toLowerCase()}.`, data: result });
  } catch (err) {
    // If it's our thrown error from the transaction, send as 400. Otherwise 500.
    if (err.message && err.message.startsWith("Cannot approve")) {
      return fail(res, 400, err.message);
    }
    next(err);
  }
});

module.exports = router;
