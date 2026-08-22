const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const prisma = require("../db");
const { generateLoginId, splitName } = require("../utils/loginId");
const { formatZodError } = require("../utils/validation");
const { seedDefaultLeaveAllocations } = require("../utils/leaveHelpers");

const router = express.Router();

const setupSchema = z.object({
  companyName: z.string().trim().min(2),
  companyCode: z.string().trim().length(2),
  adminName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).optional(),
  password: z.string().min(8),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = setupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed) });
    }

    const data = parsed.data;
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (existingAdmin) {
      return res.status(409).json({ error: "Company setup has already been completed" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          code: data.companyCode.toUpperCase(),
        },
      });

      const { firstName, lastName } = splitName(data.adminName);
      const joiningDate = new Date();
      const loginId = await generateLoginId(
        tx,
        company,
        firstName,
        lastName,
        joiningDate.getUTCFullYear(),
      );
      const passwordHash = await bcrypt.hash(data.password, 10);

      const admin = await tx.user.create({
        data: {
          companyId: company.id,
          loginId,
          name: data.adminName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          passwordHash,
          mustChangePassword: false,
          role: "ADMIN",
          joiningDate,
        },
        select: {
          id: true,
          loginId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      await seedDefaultLeaveAllocations(
        admin.id,
        joiningDate.getUTCFullYear(),
        tx,
      );

      return { company, admin };
    });

    const token = jwt.sign(
      {
        userId: result.admin.id,
        companyId: result.company.id,
        role: result.admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(201).json({
      token,
      company: {
        id: result.company.id,
        name: result.company.name,
        code: result.company.code,
      },
      admin: result.admin,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Company code or admin email already exists" });
    }

    next(err);
  }
});

module.exports = router;
