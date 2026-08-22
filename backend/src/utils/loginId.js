function cleanNamePart(value) {
  return value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase().padEnd(2, "X");
}

function getYearBounds(joiningYear) {
  const year = Number(joiningYear);

  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

async function generateLoginId(prisma, company, firstName, lastName, joiningYear) {
  const companyCode = company.code.toUpperCase();
  const firstPart = cleanNamePart(firstName);
  const lastPart = cleanNamePart(lastName);
  const year = Number(joiningYear);
  const { start, end } = getYearBounds(year);

  const usersJoinedThisYear = await prisma.user.findMany({
    where: {
      companyId: company.id,
      joiningDate: {
        gte: start,
        lt: end,
      },
    },
    select: {
      loginId: true,
    },
  });

  const maxSerial = usersJoinedThisYear.reduce((currentMax, user) => {
    const serial = Number(user.loginId.slice(-4));

    return Number.isNaN(serial) ? currentMax : Math.max(currentMax, serial);
  }, 0);

  const serial = String(maxSerial + 1).padStart(4, "0");

  return `${companyCode}${firstPart}${lastPart}${year}${serial}`;
}

function splitName(name) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || "User";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : firstName;

  return { firstName, lastName };
}

module.exports = {
  generateLoginId,
  splitName,
};
