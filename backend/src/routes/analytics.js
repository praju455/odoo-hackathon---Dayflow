const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/analytics/summary
router.get("/summary", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    // 1. Attendance % this month
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        checkIn: {
          gte: currentMonthStart
        }
      },
      _count: {
        id: true
      }
    });

    const attendanceSummary = attendanceStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    // 2. Leave Requests by status
    const leaveStats = await prisma.leaveRequest.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const leaveSummary = leaveStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    // 3. Headcount by department
    const headcountStats = await prisma.user.groupBy({
      by: ['department'],
      where: {
        role: 'EMPLOYEE' // Only count employees if needed, but let's count everyone
      },
      _count: {
        id: true
      }
    });
    
    // Default to 'Unassigned' if department is null
    const headcountSummary = headcountStats.reduce((acc, curr) => {
      const dept = curr.department || 'Unassigned';
      acc[dept] = curr._count.id;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        attendance: attendanceSummary,
        leaveRequests: leaveSummary,
        headcount: headcountSummary
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
