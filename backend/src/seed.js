require("dotenv").config();
const bcrypt = require("bcryptjs");

const prisma = require("./db");
const { seedDefaultLeaveAllocations } = require("./utils/leaveHelpers");
const { calculateSalary } = require("./utils/salary");

const year = new Date().getUTCFullYear();
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const demoUsers = [
  ["Ava Morgan", "admin@dayflow.local", "ADMIN", "People", "HR Director", null],
  ["Noah Chen", "noah@dayflow.local", "EMPLOYEE", "Engineering", "Engineering Manager", "admin@dayflow.local"],
  ["Mia Rodriguez", "mia@dayflow.local", "EMPLOYEE", "Design", "Product Designer", "admin@dayflow.local"],
  ["Ethan Williams", "ethan@dayflow.local", "EMPLOYEE", "Finance", "Finance Analyst", "admin@dayflow.local"],
  ["Sophia Ashton", "sophia@dayflow.local", "EMPLOYEE", "Sales", "Account Executive", "admin@dayflow.local"],
  ["Emma Johansson", "emma@shiftly.local", "EMPLOYEE", "Engineering", "Frontend Engineer", "noah@dayflow.local"],
  ["Liam Johnson", "liam@shiftly.local", "EMPLOYEE", "Product", "Product Manager", "admin@dayflow.local"],
  ["Olivia Davis", "olivia@shiftly.local", "EMPLOYEE", "People", "People Partner", "admin@dayflow.local"],
  ["Isabella Hernandez", "isabella@shiftly.local", "EMPLOYEE", "Design", "UX Designer", "mia@dayflow.local"],
  ["William Lee", "william@shiftly.local", "EMPLOYEE", "Product", "Business Analyst", "liam@shiftly.local"],
  ["Lily Walker", "lily@shiftly.local", "EMPLOYEE", "Marketing", "Growth Marketer", "admin@dayflow.local"],
  ["James Young", "james@shiftly.local", "EMPLOYEE", "Finance", "Accountant", "ethan@dayflow.local"],
  ["Mason Allen", "mason@shiftly.local", "EMPLOYEE", "Engineering", "Backend Engineer", "noah@dayflow.local"],
  ["Jack Robinson", "jack@shiftly.local", "EMPLOYEE", "Sales", "Sales Associate", "sophia@dayflow.local"],
  ["Aisha Khan", "aisha@shiftly.local", "EMPLOYEE", "Support", "Customer Specialist", "olivia@shiftly.local"],
  ["Daniel Kim", "daniel@shiftly.local", "EMPLOYEE", "Operations", "Operations Executive", "admin@dayflow.local"],
].map(([name, email, role, department, jobTitle, managerEmail], index) => ({
  loginId: `SF${String(name).split(" ").map((part) => part.slice(0, 2).toUpperCase()).join("")}${year}${String(index + 1).padStart(4, "0")}`,
  name, email, role, department, jobTitle, managerEmail,
  joiningDate: new Date(`${year}-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 20) + 1).padStart(2, "0")}T00:00:00.000Z`),
}));

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
    update: { name: "Shiftly Demo" },
    create: { name: "Shiftly Demo", code: "DF" },
  });
  const passwordHash = await bcrypt.hash("Dayflow123!", 10);
  const users = [];

  for (const definition of demoUsers) {
    const { managerEmail, ...userData } = definition;
    const user = await prisma.user.upsert({
      where: { email: definition.email },
      update: { ...userData, companyId: company.id, passwordHash, mustChangePassword: false },
      create: {
        ...userData,
        companyId: company.id,
        passwordHash,
        mustChangePassword: false,
      },
    });
    await seedDefaultLeaveAllocations(user.id, year);
    await prisma.leaveAllocation.updateMany({ where: { userId: user.id, year }, data: { usedDays: 0 } });
    users.push(user);
  }

  for (const definition of demoUsers) {
    const user = users.find((item) => item.email === definition.email);
    const manager = users.find((item) => item.email === definition.managerEmail);
    await prisma.user.update({ where: { id: user.id }, data: { managerId: manager?.id || null } });
  }

  const dates = [];
  for (let offset = 0; dates.length < 7; offset += 1) {
    const date = new Date(today); date.setUTCDate(date.getUTCDate() - offset);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) dates.push(date);
  }
  await prisma.attendance.deleteMany({ where: { userId: { in: users.map((user) => user.id) }, date: { in: dates } } });
  for (const [userIndex, user] of users.entries()) {
    for (const [dateIndex, date] of dates.entries()) {
      if ((userIndex + dateIndex) % 13 === 0) continue;
      const checkIn = new Date(date); checkIn.setUTCHours(9, (userIndex * 3) % 18, 0, 0);
      const checkOut = new Date(date); checkOut.setUTCHours(17, (userIndex * 2) % 20, 0, 0);
      const workHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
      await prisma.attendance.create({ data: { userId: user.id, date, checkIn, checkOut, workHours, extraHours: Math.max(workHours - 8, 0), status: "PRESENT" } });
    }
  }

  const leaveUser = users[3];
  await prisma.attendance.deleteMany({ where: { userId: leaveUser.id, date: today } });
  await prisma.leaveRequest.deleteMany({ where: { userId: { in: users.map((user) => user.id) }, reason: { startsWith: "[DEMO]" } } });
  await prisma.leaveRequest.create({
    data: {
      userId: leaveUser.id,
      leaveType: "PAID",
      startDate: today,
      endDate: today,
      allocationDays: 1,
      reason: "[DEMO] Family appointment",
      status: "APPROVED",
      adminComment: "Approved for demo",
    },
  });
  const future = new Date(today); future.setUTCDate(future.getUTCDate() + 7);
  await prisma.leaveRequest.create({ data: { userId: users[2].id, leaveType: "PAID", startDate: future, endDate: future, allocationDays: 1, reason: "[DEMO] Personal day", status: "PENDING" } });
  const past = new Date(today); past.setUTCDate(past.getUTCDate() - 5);
  await prisma.leaveRequest.create({ data: { userId: users[4].id, leaveType: "UNPAID", startDate: past, endDate: past, allocationDays: 1, reason: "[DEMO] Travel", status: "REJECTED", adminComment: "Coverage unavailable" } });
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
