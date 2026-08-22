const express = require("express");
const { z } = require("zod");

const prisma = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { calculateSalary } = require("../utils/salary");

const router = express.Router();

const salarySchema = z.object({
  wageType: z.enum(["MONTHLY", "YEARLY"]),
  fixedWage: z.number().positive(),
  pfEmployeePercent: z.number().min(0).max(100),
  pfEmployerPercent: z.number().min(0).max(100),
  professionalTax: z.number().min(0),
  components: z.array(z.object({
    name: z.string().trim().min(1),
    compType: z.enum(["FIXED", "PERCENT_OF_WAGE", "PERCENT_OF_BASIC"]),
    value: z.number().min(0),
  })).min(1),
});

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

async function loadSalary(req, res, next, userId) {
  try {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: req.user.companyId },
      select: { id: true, name: true, loginId: true },
    });
    if (!user) return fail(res, 404, "Employee not found");

    const structure = await prisma.salaryStructure.findUnique({
      where: { userId },
      include: { components: { orderBy: { createdAt: "asc" } } },
    });
    if (!structure) return fail(res, 404, "No salary structure defined for this employee");

    const breakdown = calculateSalary({
      ...structure,
      components: structure.components,
    });
    return res.json({ success: true, data: { user, structure, breakdown } });
  } catch (err) {
    next(err);
  }
}

router.get("/me", authenticate, (req, res, next) => loadSalary(req, res, next, req.user.id));

router.get("/:userId", authenticate, async (req, res, next) => {
  if (req.user.role !== "ADMIN" && req.user.id !== req.params.userId) {
    return fail(res, 403, "Access denied");
  }
  return loadSalary(req, res, next, req.params.userId);
});

async function saveSalary(req, res, next) {
  try {
    const parsed = salarySchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, parsed.error.errors[0].message);

    const user = await prisma.user.findFirst({
      where: { id: req.params.userId, companyId: req.user.companyId },
      select: { id: true },
    });
    if (!user) return fail(res, 404, "Employee not found");

    let breakdown;
    try {
      breakdown = calculateSalary(parsed.data);
    } catch (err) {
      return fail(res, 400, err.message);
    }

    const structure = await prisma.$transaction(async (tx) => {
      const saved = await tx.salaryStructure.upsert({
        where: { userId: user.id },
        update: {
          wageType: parsed.data.wageType,
          fixedWage: parsed.data.fixedWage,
          pfEmployeePercent: parsed.data.pfEmployeePercent,
          pfEmployerPercent: parsed.data.pfEmployerPercent,
          professionalTax: parsed.data.professionalTax,
        },
        create: {
          userId: user.id,
          wageType: parsed.data.wageType,
          fixedWage: parsed.data.fixedWage,
          pfEmployeePercent: parsed.data.pfEmployeePercent,
          pfEmployerPercent: parsed.data.pfEmployerPercent,
          professionalTax: parsed.data.professionalTax,
        },
      });

      await tx.salaryComponent.deleteMany({ where: { salaryStructureId: saved.id } });
      await tx.salaryComponent.createMany({
        data: breakdown.earnings.map((component) => ({
          salaryStructureId: saved.id,
          name: component.name,
          compType: component.compType,
          value: component.value,
          calculatedAmount: component.calculatedAmount,
        })),
      });

      return tx.salaryStructure.findUnique({
        where: { id: saved.id },
        include: { components: { orderBy: { createdAt: "asc" } } },
      });
    });

    return res.json({
      success: true,
      message: "Salary structure updated",
      data: { structure, breakdown },
    });
  } catch (err) {
    next(err);
  }
}

router.put("/:userId", authenticate, requireAdmin, saveSalary);
router.post("/:userId", authenticate, requireAdmin, saveSalary);

module.exports = router;
