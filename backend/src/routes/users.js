const express = require("express");
const { z } = require("zod");

const prisma = require("../db");
const { authenticate } = require("../middleware/auth");
const { toUserProfile } = require("../utils/userResponse");
const { formatZodError } = require("../utils/validation");

const router = express.Router();

const forbiddenSelfUpdateFields = [
  "role",
  "department",
  "jobTitle",
  "salary",
  "salaryStructure",
  "salaryComponents",
  "annualCtc",
  "passwordHash",
  "mustChangePassword",
  "loginId",
  "email",
  "companyId",
  "managerId",
  "joiningDate",
];

const selfUpdateSchema = z.object({
  phone: z.string().trim().min(7).optional(),
  profilePictureUrl: z.string().trim().url().optional(),
  about: z.string().trim().optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  certifications: z.array(z.string().trim().min(1)).optional(),
  interests: z.array(z.string().trim().min(1)).optional(),
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: toUserProfile(user) });
  } catch (err) {
    next(err);
  }
});

router.put("/me", authenticate, async (req, res, next) => {
  try {
    const attemptedForbiddenField = forbiddenSelfUpdateFields.find((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field),
    );

    if (attemptedForbiddenField) {
      return res.status(400).json({ error: `Cannot update ${attemptedForbiddenField}` });
    }

    const parsed = selfUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed) });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: parsed.data,
    });

    return res.json({ user: toUserProfile(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
