// src/routes/projects.js
// Dayflow HRMS — Projects API
// Admin: full CRUD + assign employees
// Employee: read-only, own assignments only

const express = require("express");
const { z } = require("zod");
const prisma = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#4ade80", "#f59e0b", "#f87171"];
function avatarColor(name = "") {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatProject(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    department: project.department,
    status: project.status,
    progress: project.progress,
    dueDate: project.dueDate,
    createdAt: project.createdAt,
    members: (project.assignments ?? []).map((a) => ({
      id: a.user.id,
      name: a.user.name,
      initial: a.user.name.charAt(0).toUpperCase(),
      color: avatarColor(a.user.name),
      jobTitle: a.user.jobTitle,
      department: a.user.department,
    })),
  };
}

const projectInclude = {
  assignments: {
    include: {
      user: {
        select: { id: true, name: true, jobTitle: true, department: true },
      },
    },
  },
};

// ─── GET /api/projects ────────────────────────────────────────────────────────
// Admin: all projects for the company
// Employee: only projects they are assigned to

router.get("/", authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "ADMIN";

    let projects;
    if (isAdmin) {
      projects = await prisma.project.findMany({
        where: { companyId: req.user.companyId },
        include: projectInclude,
        orderBy: { createdAt: "desc" },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          companyId: req.user.companyId,
          assignments: { some: { userId: req.user.userId } },
        },
        include: projectInclude,
        orderBy: { createdAt: "desc" },
      });
    }

    return res.json({ success: true, data: projects.map(formatProject) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/projects — Admin only ──────────────────────────────────────────

const createSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  department: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "IN_REVIEW"]).default("ACTIVE"),
  progress: z.number().int().min(0).max(100).default(0),
  dueDate: z.string().datetime().optional().nullable(),
  memberIds: z.array(z.string()).optional(),
});

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }
    const { memberIds = [], ...data } = parsed.data;

    const project = await prisma.project.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        companyId: req.user.companyId,
        assignments: memberIds.length
          ? { create: memberIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: projectInclude,
    });

    return res.status(201).json({ success: true, data: formatProject(project) });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/projects/:id — Admin only ───────────────────────────────────────

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  status: z.enum(["ACTIVE", "COMPLETED", "IN_REVIEW"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

router.put("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate !== undefined
          ? (parsed.data.dueDate ? new Date(parsed.data.dueDate) : null)
          : undefined,
      },
      include: projectInclude,
    });

    return res.json({ success: true, data: formatProject(project) });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/projects/:id — Admin only ────────────────────────────────────

router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: "Project not found" });

    await prisma.project.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/projects/:id/assign — Admin only ───────────────────────────────
// Body: { memberIds: string[] } — replaces the entire member list

router.post("/:id/assign", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const { memberIds = [] } = req.body;

    // Replace assignments atomically
    await prisma.$transaction([
      prisma.projectAssignment.deleteMany({ where: { projectId: req.params.id } }),
      ...(memberIds.length
        ? [prisma.projectAssignment.createMany({
            data: memberIds.map((userId) => ({ projectId: req.params.id, userId })),
            skipDuplicates: true,
          })]
        : []),
    ]);

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: projectInclude,
    });

    return res.json({ success: true, data: formatProject(project) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
