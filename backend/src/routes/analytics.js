const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/analytics/summary
router.get("/summary", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const attendanceStats = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        checkIn: { gte: currentMonthStart },
        user: { companyId: req.user.companyId },
      },
      _count: { id: true },
    });

    const attendanceSummary = attendanceStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    const leaveStats = await prisma.leaveRequest.groupBy({
      by: ["status"],
      where: { user: { companyId: req.user.companyId } },
      _count: { id: true },
    });

    const leaveSummary = leaveStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    const headcountStats = await prisma.user.groupBy({
      by: ["department"],
      where: {
        companyId: req.user.companyId,
        role: "EMPLOYEE",
      },
      _count: { id: true },
    });

    const headcountSummary = headcountStats.reduce((acc, curr) => {
      const dept = curr.department || "Unassigned";
      acc[dept] = curr._count.id;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        attendance: attendanceSummary,
        leaveRequests: leaveSummary,
        headcount: headcountSummary,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
