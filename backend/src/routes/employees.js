const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

const prisma = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { generateLoginId, splitName } = require("../utils/loginId");
const { generateTempPassword } = require("../utils/password");
const { seedDefaultLeaveAllocations } = require("../utils/leaveHelpers");
const { toDirectoryUser, toUserProfile } = require("../utils/userResponse");
const { formatZodError } = require("../utils/validation");

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

const updateEmployeeSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(7).optional(),
  department: z.string().trim().min(2).optional(),
  jobTitle: z.string().trim().min(2).optional(),
  managerId: z.string().uuid().nullable().optional(),
  profilePictureUrl: z.string().trim().url().nullable().optional(),
  joiningDate: z.string().date().optional(),
  about: z.string().trim().nullable().optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  certifications: z.array(z.string().trim().min(1)).optional(),
  interests: z.array(z.string().trim().min(1)).optional(),
  dateOfBirth: z.string().date().nullable().optional(),
  gender: z.string().trim().min(1).nullable().optional(),
  maritalStatus: z.string().trim().min(1).nullable().optional(),
  personalEmail: z.string().trim().email().nullable().optional(),
  panCode: z.string().trim().min(1).nullable().optional(),
  uanCode: z.string().trim().min(1).nullable().optional(),
  accountNumber: z.string().trim().min(1).nullable().optional(),
  homeAddress: z.string().trim().min(1).nullable().optional(),
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      include: {
        manager: { select: { id: true, name: true } },
      },
      orderBy: [{ joiningDate: "desc" }, { name: "asc" }],
    });

    return res.json({ employees: users.map(toDirectoryUser) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.json({ employee: toUserProfile(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = createEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed) });
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

      await seedDefaultLeaveAllocations(
        employee.id,
        joiningDate.getUTCFullYear(),
        tx,
      );

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

router.put("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed) });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (parsed.data.managerId) {
      const manager = await prisma.user.findFirst({
        where: {
          id: parsed.data.managerId,
          companyId: req.user.companyId,
        },
        select: { id: true },
      });

      if (!manager) {
        return res.status(400).json({ error: "Manager not found" });
      }
    }

    const updateData = {
      ...parsed.data,
      email: parsed.data.email?.toLowerCase(),
      joiningDate: parsed.data.joiningDate
        ? new Date(`${parsed.data.joiningDate}T00:00:00.000Z`)
        : undefined,
      dateOfBirth: parsed.data.dateOfBirth
        ? new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`)
        : parsed.data.dateOfBirth,
    };

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return res.json({ employee: toUserProfile(user) });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Employee email already exists" });
    }

    next(err);
  }
});

module.exports = router;
