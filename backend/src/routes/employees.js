const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

const prisma = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { generateLoginId, splitName } = require("../utils/loginId");
const { generateTempPassword } = require("../utils/password");

const router = express.Router();

const createEmployeeSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).optional(),
  department: z.string().trim().min(2),
  jobTitle: z.string().trim().min(2),
  managerId: z.string().uuid().optional(),
  joiningDate: z.string().date(),
});

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = createEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid employee details" });
    }

    const data = parsed.data;
    const joiningDate = new Date(`${data.joiningDate}T00:00:00.000Z`);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({
        where: { id: req.user.companyId },
      });

      if (!company) {
        return null;
      }

      if (data.managerId) {
        const manager = await tx.user.findFirst({
          where: {
            id: data.managerId,
            companyId: company.id,
          },
          select: { id: true },
        });

        if (!manager) {
          throw new Error("MANAGER_NOT_FOUND");
        }
      }

      const { firstName, lastName } = splitName(data.name);
      const loginId = await generateLoginId(
        tx,
        company,
        firstName,
        lastName,
        joiningDate.getUTCFullYear(),
      );
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const employee = await tx.user.create({
        data: {
          companyId: company.id,
          loginId,
          name: data.name,
          email: data.email.toLowerCase(),
          phone: data.phone,
          passwordHash,
          mustChangePassword: true,
          role: "EMPLOYEE",
          department: data.department,
          jobTitle: data.jobTitle,
          managerId: data.managerId,
          joiningDate,
        },
        select: {
          id: true,
          loginId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          department: true,
          jobTitle: true,
          managerId: true,
          joiningDate: true,
          mustChangePassword: true,
        },
      });

      return { employee, tempPassword };
    });

    if (!result) {
      return res.status(404).json({ error: "Company not found" });
    }

    return res.status(201).json(result);
  } catch (err) {
    if (err.message === "MANAGER_NOT_FOUND") {
      return res.status(400).json({ error: "Manager not found" });
    }

    if (err.code === "P2002") {
      return res.status(409).json({ error: "Employee email or Login ID already exists" });
    }

    next(err);
  }
});

module.exports = router;
