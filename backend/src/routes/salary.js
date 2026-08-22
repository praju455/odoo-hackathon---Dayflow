// src/routes/salary.js
// Member 2 — Salary Engine
//
// Step 7: Salary calculation engine
// Provides endpoints to configure a salary structure and preview the math.

const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

// ─── SALARY MATH ENGINE ─────────────────────────────────────────────────────
/**
 * Simple & Traceable Salary Calculation
 * Base assumption for this hackathon: fixedWage acts as the 'Basic' for percentages.
 */
function calculateSalaryBreakdown(structure, components) {
  let grossEarnings = structure.fixedWage;
  
  // 1. Calculate each earning component
  const calculatedComponents = components.map(comp => {
    let amount = 0;
    if (comp.compType === "FIXED") {
      amount = comp.value;
    } else if (comp.compType === "PERCENT_OF_WAGE" || comp.compType === "PERCENT_OF_BASIC") {
      amount = structure.fixedWage * (comp.value / 100);
    }
    
    // Round to 2 decimal places
    amount = parseFloat(amount.toFixed(2));
    grossEarnings += amount;

    return { ...comp, calculatedAmount: amount };
  });

  // 2. Calculate Deductions
  const pfEmployee = parseFloat((structure.fixedWage * (structure.pfEmployeePercent / 100)).toFixed(2));
  const pfEmployer = parseFloat((structure.fixedWage * (structure.pfEmployerPercent / 100)).toFixed(2));
  const pt = structure.professionalTax;

  const totalDeductions = pfEmployee + pt;
  
  // 3. Net Salary
  const netSalary = parseFloat((grossEarnings - totalDeductions).toFixed(2));

  return {
    fixedWage: structure.fixedWage,
    earnings: calculatedComponents,
    grossEarnings: parseFloat(grossEarnings.toFixed(2)),
    deductions: {
      pfEmployee,
      pfEmployer, // Employer contribution is usually an expense, not deducted from net (unless CTC model), keeping separate.
      professionalTax: pt,
      totalDeductions: parseFloat(totalDeductions.toFixed(2))
    },
    netSalary
  };
}

// ─── GET /api/salary/:userId ────────────────────────────────────────────────
/**
 * View salary structure and generated breakdown.
 * Employees can view their own, Admins can view anyone's.
 */
router.get("/:userId", authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Authorization: Must be admin or the user themselves
    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return fail(res, 403, "Access denied.");
    }

    const structure = await prisma.salaryStructure.findUnique({
      where: { userId },
      include: { components: true }
    });

    if (!structure) {
      return fail(res, 404, "No salary structure defined for this user.");
    }

    const breakdown = calculateSalaryBreakdown(structure, structure.components);

    return res.json({ success: true, data: { structure, breakdown } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/salary/:userId (admin) ───────────────────────────────────────
/**
 * Define or update an employee's salary structure and components.
 */
router.post("/:userId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const schema = z.object({
      wageType: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
      fixedWage: z.number().positive(),
      pfEmployeePercent: z.number().min(0).max(100).default(12),
      pfEmployerPercent: z.number().min(0).max(100).default(12),
      professionalTax: z.number().min(0).default(200),
      components: z.array(z.object({
        name: z.string().min(1),
        compType: z.enum(["FIXED", "PERCENT_OF_WAGE", "PERCENT_OF_BASIC"]),
        value: z.number().positive()
      })).default([])
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, parsed.error.errors[0].message);
    }

    const { wageType, fixedWage, pfEmployeePercent, pfEmployerPercent, professionalTax, components } = parsed.data;

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail(res, 404, "User not found.");

    // Transaction to safely replace the old structure
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the main structure
      const structure = await tx.salaryStructure.upsert({
        where: { userId },
        update: { wageType, fixedWage, pfEmployeePercent, pfEmployerPercent, professionalTax },
        create: { userId, wageType, fixedWage, pfEmployeePercent, pfEmployerPercent, professionalTax }
      });

      // Clear old components and add new ones
      await tx.salaryComponent.deleteMany({
        where: { salaryStructureId: structure.id }
      });

      if (components.length > 0) {
        // Pre-calculate component amounts for DB storage using the math engine logic
        const mappedComponents = components.map(comp => {
          let calculatedAmount = 0;
          if (comp.compType === "FIXED") calculatedAmount = comp.value;
          else calculatedAmount = fixedWage * (comp.value / 100);

          return {
            salaryStructureId: structure.id,
            name: comp.name,
            compType: comp.compType,
            value: comp.value,
            calculatedAmount: parseFloat(calculatedAmount.toFixed(2))
          };
        });

        await tx.salaryComponent.createMany({ data: mappedComponents });
      }

      // Return the full updated entity
      return tx.salaryStructure.findUnique({
        where: { id: structure.id },
        include: { components: true }
      });
    });

    const breakdown = calculateSalaryBreakdown(result, result.components);

    return res.json({ 
      success: true, 
      message: "Salary structure updated.", 
      data: { structure: result, breakdown } 
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
