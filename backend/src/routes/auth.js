const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const prisma = require("../db");
const { authenticate } = require("../middleware/auth");
const { toUserProfile } = require("../utils/userResponse");
const { formatZodError } = require("../utils/validation");

const router = express.Router();

const loginSchema = z.object({
  identifier: z.string().trim().min(2),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

function signUserToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
}

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed) });
    }

    const { identifier, password } = parsed.data;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { loginId: identifier.toUpperCase() },
          { email: identifier.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      token: signUserToken(user),
      mustChangePassword: user.mustChangePassword,
      user: toUserProfile(user),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/change-password", authenticate, async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed) });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatches = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
      },
    });

    return res.json({
      message: "Password changed successfully",
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
