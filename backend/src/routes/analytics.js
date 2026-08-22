const express = require("express");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function countByStatus(records) {
  return records.reduce((summary, record) => {
    summary[record.status] = (summary[record.status] || 0) + 1;
    return summary;
  }, {});
}

router.get("/summary", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date();
    const today = startOfUtcDay(now);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [employees, todayAttendance, monthAttendance, leaveRequests, activeLeave] =
      await Promise.all([
        prisma.user.findMany({
          where: { companyId: req.user.companyId, role: "EMPLOYEE" },
          select: {
            id: true,
            name: true,
            email: true,
            loginId: true,
            department: true,
            jobTitle: true,
            joiningDate: true,
            manager: { select: { id: true, name: true } },
          },
          orderBy: [{ joiningDate: "desc" }, { name: "asc" }],
        }),
        prisma.attendance.findMany({
          where: {
            date: { gte: today, lt: tomorrow },
            user: { companyId: req.user.companyId, role: "EMPLOYEE" },
          },
          include: {
            user: {
              select: { id: true, name: true, department: true, jobTitle: true },
            },
          },
          orderBy: { checkIn: "asc" },
        }),
        prisma.attendance.findMany({
          where: {
            date: { gte: monthStart, lt: nextMonth },
            user: { companyId: req.user.companyId, role: "EMPLOYEE" },
          },
          select: { status: true, workMinutes: true, extraMinutes: true },
        }),
        prisma.leaveRequest.findMany({
          where: { user: { companyId: req.user.companyId } },
          include: {
            user: { select: { id: true, name: true, department: true, jobTitle: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.leaveRequest.findMany({
          where: {
            status: "APPROVED",
            startDate: { lte: today },
            endDate: { gte: today },
            user: { companyId: req.user.companyId, role: "EMPLOYEE" },
          },
          select: { userId: true },
        }),
      ]);

    const presentToday = todayAttendance.filter((record) =>
      ["PRESENT", "HALF_DAY"].includes(record.status)
    ).length;
    const headcount = employees.reduce((summary, employee) => {
      const department = employee.department || "Unassigned";
      summary[department] = (summary[department] || 0) + 1;
      return summary;
    }, {});

    return res.json({
      success: true,
      data: {
        totals: {
          totalEmployees: employees.length,
          presentToday,
          onLeaveToday: new Set(activeLeave.map((request) => request.userId)).size,
          pendingLeaveRequests: leaveRequests.filter((request) => request.status === "PENDING").length,
          workHoursThisMonth: Math.round(
            monthAttendance.reduce((total, record) => total + (record.workMinutes || 0), 0) / 60
          ),
        },
        attendance: countByStatus(monthAttendance),
        leaveRequests: countByStatus(leaveRequests),
        headcount,
        todayAttendance,
        recentHires: employees.slice(0, 6),
        recentLeaveRequests: leaveRequests.slice(0, 8),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const today = startOfUtcDay(now);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [attendance, allocations, leaveRequests] = await Promise.all([
      prisma.attendance.findMany({
        where: { userId: req.user.id, date: { gte: monthStart, lt: nextMonth } },
        orderBy: { date: "desc" },
      }),
      prisma.leaveAllocation.findMany({
        where: { userId: req.user.id, year: now.getUTCFullYear() },
        orderBy: { leaveType: "asc" },
      }),
      prisma.leaveRequest.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    const todayRecord = attendance.find(
      (record) => record.date >= today && record.date < tomorrow
    );

    return res.json({
      success: true,
      data: {
        totals: {
          daysPresent: attendance.filter((record) =>
            ["PRESENT", "HALF_DAY"].includes(record.status)
          ).length,
          workHours: Math.round(
            (attendance.reduce((total, record) => total + (record.workMinutes || 0), 0) / 60) * 10
          ) / 10,
          extraHours: Math.round(
            (attendance.reduce((total, record) => total + (record.extraMinutes || 0), 0) / 60) * 10
          ) / 10,
          approvedLeaveDays: leaveRequests
            .filter((request) => request.status === "APPROVED")
            .reduce((total, request) => total + request.days, 0),
        },
        attendance,
        attendanceSummary: countByStatus(attendance),
        allocations,
        leaveRequests,
        today: todayRecord || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
