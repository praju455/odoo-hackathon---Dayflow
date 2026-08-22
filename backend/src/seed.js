require("dotenv").config();
const bcrypt = require("bcryptjs");

const prisma = require("./db");
const { seedDefaultLeaveAllocations } = require("./utils/leaveHelpers");
const { calculateSalary } = require("./utils/salary");

const year = new Date().getUTCFullYear();
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

// ─── User definitions ─────────────────────────────────────────────────────────
// [name, email, role, department, jobTitle, managerEmail]
const USER_DEFS = [
  // ── Admin ──────────────────────────────────────────────────────────────────
  ["Ava Morgan",          "admin@dayflow.local",      "ADMIN",    "People",       "HR Director",              null],

  // ── Engineering ───────────────────────────────────────────────────────────
  ["Noah Chen",           "noah@dayflow.local",       "EMPLOYEE", "Engineering",  "Engineering Manager",      "admin@dayflow.local"],
  ["Emma Johansson",      "emma@shiftly.local",       "EMPLOYEE", "Engineering",  "Senior Frontend Engineer", "noah@dayflow.local"],
  ["Mason Allen",         "mason@shiftly.local",      "EMPLOYEE", "Engineering",  "Backend Engineer",         "noah@dayflow.local"],
  ["Lucas Patel",         "lucas@shiftly.local",      "EMPLOYEE", "Engineering",  "DevOps Engineer",          "noah@dayflow.local"],
  ["Aria Thompson",       "aria@shiftly.local",       "EMPLOYEE", "Engineering",  "Frontend Engineer",        "noah@dayflow.local"],
  ["Omar Farouk",         "omar@shiftly.local",       "EMPLOYEE", "Engineering",  "Full-Stack Engineer",      "noah@dayflow.local"],
  ["Priya Sharma",        "priya@shiftly.local",      "EMPLOYEE", "Engineering",  "QA Engineer",              "noah@dayflow.local"],

  // ── Design ────────────────────────────────────────────────────────────────
  ["Mia Rodriguez",       "mia@dayflow.local",        "EMPLOYEE", "Design",       "Design Lead",              "admin@dayflow.local"],
  ["Isabella Hernandez",  "isabella@shiftly.local",   "EMPLOYEE", "Design",       "UX Designer",              "mia@dayflow.local"],
  ["Nico Blanco",         "nico@shiftly.local",       "EMPLOYEE", "Design",       "Product Designer",         "mia@dayflow.local"],
  ["Fatima Al-Rashid",    "fatima@shiftly.local",     "EMPLOYEE", "Design",       "Brand Designer",           "mia@dayflow.local"],

  // ── Product ───────────────────────────────────────────────────────────────
  ["Liam Johnson",        "liam@shiftly.local",       "EMPLOYEE", "Product",      "Product Manager",          "admin@dayflow.local"],
  ["William Lee",         "william@shiftly.local",    "EMPLOYEE", "Product",      "Senior Product Manager",   "liam@shiftly.local"],
  ["Zara Nkosi",          "zara@shiftly.local",       "EMPLOYEE", "Product",      "Product Analyst",          "liam@shiftly.local"],

  // ── Finance ───────────────────────────────────────────────────────────────
  ["Ethan Williams",      "ethan@dayflow.local",      "EMPLOYEE", "Finance",      "Finance Manager",          "admin@dayflow.local"],
  ["James Young",         "james@shiftly.local",      "EMPLOYEE", "Finance",      "Accountant",               "ethan@dayflow.local"],
  ["Mei Lin",             "mei@shiftly.local",        "EMPLOYEE", "Finance",      "Financial Analyst",        "ethan@dayflow.local"],

  // ── Sales ─────────────────────────────────────────────────────────────────
  ["Sophia Ashton",       "sophia@dayflow.local",     "EMPLOYEE", "Sales",        "Sales Manager",            "admin@dayflow.local"],
  ["Jack Robinson",       "jack@shiftly.local",       "EMPLOYEE", "Sales",        "Account Executive",        "sophia@dayflow.local"],
  ["Amara Diallo",        "amara@shiftly.local",      "EMPLOYEE", "Sales",        "Sales Development Rep",    "sophia@dayflow.local"],
  ["Leo Hartmann",        "leo@shiftly.local",        "EMPLOYEE", "Sales",        "Sales Associate",          "sophia@dayflow.local"],

  // ── Marketing ─────────────────────────────────────────────────────────────
  ["Lily Walker",         "lily@shiftly.local",       "EMPLOYEE", "Marketing",    "Marketing Manager",        "admin@dayflow.local"],
  ["Diego Morales",       "diego@shiftly.local",      "EMPLOYEE", "Marketing",    "Growth Marketer",          "lily@shiftly.local"],
  ["Sofia Andersen",      "sofiaA@shiftly.local",     "EMPLOYEE", "Marketing",    "Content Strategist",       "lily@shiftly.local"],
  ["Jin Park",            "jin@shiftly.local",        "EMPLOYEE", "Marketing",    "SEO Specialist",           "lily@shiftly.local"],

  // ── People (HR) ───────────────────────────────────────────────────────────
  ["Olivia Davis",        "olivia@shiftly.local",     "EMPLOYEE", "People",       "People Partner",           "admin@dayflow.local"],
  ["Aisha Khan",          "aisha@shiftly.local",      "EMPLOYEE", "People",       "Recruiter",                "olivia@shiftly.local"],

  // ── Support ───────────────────────────────────────────────────────────────
  ["Daniel Kim",          "daniel@shiftly.local",     "EMPLOYEE", "Support",      "Customer Success Lead",    "admin@dayflow.local"],
  ["Chloe Bennett",       "chloe@shiftly.local",      "EMPLOYEE", "Support",      "Customer Specialist",      "daniel@shiftly.local"],
  ["Raj Gupta",           "raj@shiftly.local",        "EMPLOYEE", "Support",      "Customer Specialist",      "daniel@shiftly.local"],

  // ── Operations ────────────────────────────────────────────────────────────
  ["Eva Svensson",        "eva@shiftly.local",        "EMPLOYEE", "Operations",   "Operations Manager",       "admin@dayflow.local"],
  ["Marcus Baptiste",     "marcus@shiftly.local",     "EMPLOYEE", "Operations",   "Operations Executive",     "eva@shiftly.local"],
];

// ─── Build demoUsers ─────────────────────────────────────────────────────────
const demoUsers = USER_DEFS.map(([name, email, role, department, jobTitle, managerEmail], index) => ({
  loginId: `SF${String(name).split(" ").map((p) => p.slice(0, 2).toUpperCase()).join("")}${year}${String(index + 1).padStart(4, "0")}`,
  name,
  email,
  role,
  department,
  jobTitle,
  managerEmail,
  joiningDate: new Date(
    Date.UTC(year, (index % 10), Math.min(28, (index % 22) + 1))
  ),
}));

// ─── Salary helper ───────────────────────────────────────────────────────────
async function saveSalary(userId, baseSalary) {
  const payload = {
    fixedWage: baseSalary,
    pfEmployeePercent: 12,
    pfEmployerPercent: 12,
    professionalTax: 200,
    components: [
      { name: "Basic",               compType: "PERCENT_OF_WAGE",  value: 60 },
      { name: "HRA",                 compType: "PERCENT_OF_BASIC", value: 40 },
      { name: "Standard Allowance",  compType: "PERCENT_OF_WAGE",  value: 16 },
    ],
  };
  const breakdown = calculateSalary(payload);
  const structure = await prisma.salaryStructure.upsert({
    where: { userId },
    update: { wageType: "MONTHLY", fixedWage: baseSalary, pfEmployeePercent: 12, pfEmployerPercent: 12, professionalTax: 200 },
    create: { userId, wageType: "MONTHLY", fixedWage: baseSalary, pfEmployeePercent: 12, pfEmployerPercent: 12, professionalTax: 200 },
  });
  await prisma.salaryComponent.deleteMany({ where: { salaryStructureId: structure.id } });
  await prisma.salaryComponent.createMany({
    data: breakdown.earnings.map((c) => ({
      salaryStructureId: structure.id,
      name: c.name,
      compType: c.compType,
      value: c.value,
      calculatedAmount: c.calculatedAmount,
    })),
  });
}

// ─── Salary by job title ──────────────────────────────────────────────────────
function salaryFor(jobTitle) {
  if (!jobTitle) return 60000;
  const t = jobTitle.toLowerCase();
  if (t.includes("director") || t.includes("manager") || t.includes("lead")) return 120000 + Math.floor(Math.random() * 40000);
  if (t.includes("senior"))  return 90000 + Math.floor(Math.random() * 30000);
  if (t.includes("engineer") || t.includes("designer") || t.includes("analyst")) return 70000 + Math.floor(Math.random() * 20000);
  return 50000 + Math.floor(Math.random() * 15000);
}

// ─── Attendance helper ────────────────────────────────────────────────────────
// Generate last 20 working days of attendance for each employee (batched)
async function seedAttendance(users) {
  const workingDates = [];
  for (let offset = 0; workingDates.length < 20; offset += 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - offset);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) workingDates.push(d);
  }

  // Delete existing attendance for these dates
  await prisma.attendance.deleteMany({
    where: { userId: { in: users.map((u) => u.id) }, date: { in: workingDates } },
  });

  // Build all records at once
  const records = [];
  for (const user of users) {
    for (const [di, date] of workingDates.entries()) {
      const roll = (user.id.charCodeAt(0) + di) % 10;
      if (roll === 0 && di > 0) continue; // ~10% absent

      const checkIn = new Date(date);
      checkIn.setUTCHours(8 + (roll % 2), (roll * 7) % 60, 0, 0);

      const checkOut = new Date(date);
      checkOut.setUTCHours(17 + (roll % 2), (roll * 3) % 60, 0, 0);

      const workHours = parseFloat(((checkOut - checkIn) / 3600000).toFixed(2));
      const extraHours = parseFloat(Math.max(0, workHours - 8).toFixed(2));
      const status = workHours < 4 ? "HALF_DAY" : "PRESENT";

      records.push({ userId: user.id, date, checkIn, checkOut, workHours, extraHours, status });
    }
  }

  // Batch insert in chunks of 100 to avoid payload limits
  const CHUNK = 100;
  for (let i = 0; i < records.length; i += CHUNK) {
    await prisma.attendance.createMany({ data: records.slice(i, i + CHUNK), skipDuplicates: true });
  }
  console.log(`  → Seeded ${records.length} attendance records`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Company
  const company = await prisma.company.upsert({
    where: { code: "DF" },
    update: { name: "Shiftly Demo" },
    create: { name: "Shiftly Demo", code: "DF" },
  });

  const passwordHash = await bcrypt.hash("Dayflow123!", 10);
  const users = [];

  // 2. Upsert users (without manager link first)
  for (const def of demoUsers) {
    const { managerEmail, ...userData } = def;
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: { ...userData, companyId: company.id, passwordHash, mustChangePassword: false },
      create: { ...userData, companyId: company.id, passwordHash, mustChangePassword: false },
    });
    await seedDefaultLeaveAllocations(user.id, year);
    await prisma.leaveAllocation.updateMany({ where: { userId: user.id, year }, data: { usedDays: 0 } });
    users.push(user);
  }

  // 3. Wire up manager relationships
  for (const def of demoUsers) {
    const user    = users.find((u) => u.email === def.email);
    const manager = users.find((u) => u.email === def.managerEmail);
    await prisma.user.update({ where: { id: user.id }, data: { managerId: manager?.id || null } });
  }

  // 4. Attendance (last 20 working days)
  await seedAttendance(users);

  // 5. Sample leave requests (varied statuses)
  const leaveSeeds = [
    { userEmail: "ethan@dayflow.local",   type: "PAID",   offsetStart: 0,  offsetEnd: 0,   status: "APPROVED",  comment: "Approved"           },
    { userEmail: "mia@dayflow.local",      type: "PAID",   offsetStart: 7,  offsetEnd: 8,   status: "PENDING",   comment: null                 },
    { userEmail: "sophia@dayflow.local",   type: "UNPAID", offsetStart: -5, offsetEnd: -5,  status: "REJECTED",  comment: "Coverage unavailable"},
    { userEmail: "emma@shiftly.local",     type: "PAID",   offsetStart: 14, offsetEnd: 16,  status: "PENDING",   comment: null                 },
    { userEmail: "mason@shiftly.local",    type: "SICK",   offsetStart: -3, offsetEnd: -2,  status: "APPROVED",  comment: "Medical cert received"},
    { userEmail: "jack@shiftly.local",     type: "PAID",   offsetStart: 10, offsetEnd: 12,  status: "PENDING",   comment: null                 },
    { userEmail: "lily@shiftly.local",     type: "PAID",   offsetStart: 20, offsetEnd: 22,  status: "APPROVED",  comment: "Approved"           },
    { userEmail: "daniel@shiftly.local",   type: "UNPAID", offsetStart: 3,  offsetEnd: 3,   status: "PENDING",   comment: null                 },
    { userEmail: "olivia@shiftly.local",   type: "SICK",   offsetStart: -8, offsetEnd: -7,  status: "APPROVED",  comment: "Get well soon"      },
  ];

  await prisma.leaveRequest.deleteMany({ where: { reason: { startsWith: "[DEMO]" } } });

  for (const seed of leaveSeeds) {
    const user = users.find((u) => u.email === seed.userEmail);
    if (!user) continue;
    const start = new Date(today); start.setUTCDate(start.getUTCDate() + seed.offsetStart);
    const end   = new Date(today); end.setUTCDate(end.getUTCDate()   + seed.offsetEnd);
    const days  = Math.round((end - start) / 86400000) + 1;

    try {
      await prisma.leaveRequest.create({
        data: {
          userId: user.id,
          leaveType: seed.type,
          startDate: start,
          endDate: end,
          allocationDays: days,
          reason: `[DEMO] ${seed.status === "APPROVED" ? "Approved leave" : seed.status === "REJECTED" ? "Travel" : "Upcoming leave"}`,
          status: seed.status,
          adminComment: seed.comment,
        },
      });
      if (seed.status === "APPROVED" && seed.type !== "UNPAID") {
        await prisma.leaveAllocation.updateMany({
          where: { userId: user.id, leaveType: seed.type, year },
          data: { usedDays: { increment: days } },
        });
      }
    } catch { /* skip if allocation exceeded */ }
  }

  // 6. Salaries for all employees
  for (const user of users) {
    const def = demoUsers.find((d) => d.email === user.email);
    await saveSalary(user.id, salaryFor(def?.jobTitle));
  }

  console.log(`\n✅ Shiftly demo data ready — ${users.length} users seeded`);
  console.log(`Admin login: admin@dayflow.local / Dayflow123!`);
  console.log(`Employee sample: emma@shiftly.local / Dayflow123!\n`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
