require("dotenv").config();

const prisma = require("../src/db");
const { generateLoginId } = require("../src/utils/loginId");

async function main() {
  const company = await prisma.company.findFirst({
    where: { code: "OC" },
  });

  if (!company) {
    console.log("Create the company/admin setup first, then run this check.");
    return;
  }

  const bob = await generateLoginId(prisma, company, "Bob", "Carter", 2025);
  const tempUser = await prisma.user.create({
    data: {
      companyId: company.id,
      loginId: bob,
      name: "Bob Carter",
      email: `bob.carter.${Date.now()}@example.test`,
      passwordHash: "not-used",
      joiningDate: new Date(Date.UTC(2025, 0, 1)),
    },
  });

  const ann = await generateLoginId(prisma, company, "Ann", "Lee", 2025);

  await prisma.user.delete({
    where: { id: tempUser.id },
  });

  console.log(`Bob Carter, 2025 -> ${bob}`);
  console.log(`Ann Lee after Bob is stored, 2025 -> ${ann}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
