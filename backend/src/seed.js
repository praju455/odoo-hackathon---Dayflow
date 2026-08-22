require("dotenv").config();
const bcrypt = require("bcryptjs");

const prisma = require("./db");
const { seedDefaultLeaveAllocations } = require("./utils/leaveHelpers");
const { calculateSalary } = require("./utils/salary");

const year = new Date().getUTCFullYear();
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const demoUsers = [
  { loginId: `DFAVMO${year}0001`, name: "Ava Morgan", email: "admin@dayflow.local", role: "ADMIN", department: "People", jobTitle: "HR Director" },
  { loginId: `DFNOCH${year}0002`, name: "Noah Chen", email: "noah@dayflow.local", role: "EMPLOYEE", department: "Engineering", jobTitle: "Software Engineer" },
  { loginId: `DFMIRO${year}0003`, name: "Mia Rodriguez", email: "mia@dayflow.local", role: "EMPLOYEE", department: "Design", jobTitle: "Product Designer" },
  { loginId: `DFETWI${year}0004`, name: "Ethan Williams", email: "ethan@dayflow.local", role: "EMPLOYEE", department: "Finance", jobTitle: "Finance Analyst" },
  { loginId: `DFSOAS${year}0005`, name: "Sophia Ashton", email: "sophia@dayflow.local", role: "EMPLOYEE", department: "Sales", jobTitle: "Account Executive" },
];

async function saveSalary(userId, index) {
  const fixedWage = 50000 + index * 5000;
  const payload = {
    fixedWage,
    pfEmployeePercent: 12,
    pfEmployerPercent: 12,
    professionalTax: 200,
    components: [
      { name: "Basic", compType: "PERCENT_OF_WAGE", value: 60 },
      { name: "HRA", compType: "PERCENT_OF_BASIC", value: 40 },
      { name: "Standard Allowance", compType: "PERCENT_OF_WAGE", value: 16 },
    ],
  };
  const breakdown = calculateSalary(payload);
  const structure = await prisma.salaryStructure.upsert({
    where: { userId },
    update: { wageType: "MONTHLY", fixedWage, pfEmployeePercent: 12, pfEmployerPercent: 12, professionalTax: 200 },
    create: { userId, wageType: "MONTHLY", fixedWage, pfEmployeePercent: 12, pfEmployerPercent: 12, professionalTax: 200 },
  });
  await prisma.salaryComponent.deleteMany({ where: { salaryStructureId: structure.id } });
  await prisma.salaryComponent.createMany({
    data: breakdown.earnings.map((component) => ({
      salaryStructureId: structure.id,
      name: component.name,
      compType: component.compType,
      value: component.value,
      calculatedAmount: component.calculatedAmount,
    })),
  });
}

async function main() {
  const company = await prisma.company.upsert({
    where: { code: "DF" },
    update: { name: "Dayflow Demo" },
    create: { name: "Dayflow Demo", code: "DF" },
  });
  const passwordHash = await bcrypt.hash("Dayflow123!", 10);
  const users = [];

  for (const definition of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: definition.email },
      update: { ...definition, companyId: company.id, passwordHash, mustChangePassword: false },
      create: {
        ...definition,
        companyId: company.id,
        passwordHash,
        mustChangePassword: false,
        joiningDate: new Date(`${year}-01-15T00:00:00.000Z`),
      },
    });
    await seedDefaultLeaveAllocations(user.id, year);
    await prisma.leaveAllocation.updateMany({ where: { userId: user.id, year }, data: { usedDays: 0 } });
    users.push(user);
  }

  await prisma.attendance.deleteMany({ where: { userId: { in: users.map((user) => user.id) }, date: today } });
  for (const [index, user] of users.slice(0, 3).entries()) {
    if (index === 2) continue;
    const checkIn = new Date(today);
    checkIn.setUTCHours(9 + index, 0, 0, 0);
    await prisma.attendance.create({ data: { userId: user.id, date: today, checkIn, status: "PRESENT" } });
  }

  const leaveUser = users[3];
  await prisma.leaveRequest.deleteMany({ where: { userId: leaveUser.id, reason: "Demo approved leave" } });
  await prisma.leaveRequest.create({
    data: {
      userId: leaveUser.id,
      leaveType: "PAID",
      startDate: today,
      endDate: today,
      allocationDays: 1,
      reason: "Demo approved leave",
      status: "APPROVED",
      adminComment: "Approved for demo",
    },
  });
  await prisma.leaveAllocation.update({
    where: { userId_leaveType_year: { userId: leaveUser.id, leaveType: "PAID", year } },
    data: { usedDays: 1 },
  });

  for (const [index, user] of users.slice(1).entries()) {
    await saveSalary(user.id, index);
  }

  console.log("Dayflow demo data ready");
  console.log("Admin login: admin@dayflow.local / Dayflow123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
