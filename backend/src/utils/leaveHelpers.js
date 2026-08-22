const prisma = require("../lib/prisma");

/**
 * Seed default leave allocations for a new employee.
 * Run this when Member 1 creates a new User.
 *
 * Defaults:
 *  - PAID: 24 days
 *  - SICK: 7 days
 *  - UNPAID: 9999 days (effectively no cap)
 *
 * @param {string} userId - The ID of the newly created user
 * @param {number} year - The calendar year for this allocation (defaults to current year)
 */
async function seedDefaultLeaveAllocations(
  userId,
  year = new Date().getFullYear(),
  client = prisma,
) {
  const allocations = [
    { userId, leaveType: "PAID", totalDays: 24, usedDays: 0, year },
    { userId, leaveType: "SICK", totalDays: 7, usedDays: 0, year },
    { userId, leaveType: "UNPAID", totalDays: 9999, usedDays: 0, year },
  ];

  await client.leaveAllocation.createMany({
    data: allocations,
    skipDuplicates: true, // Prevent errors if allocations already exist for this year
  });
}

module.exports = { seedDefaultLeaveAllocations };
