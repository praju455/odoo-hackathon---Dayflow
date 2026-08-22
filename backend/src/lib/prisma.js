// src/lib/prisma.js
// Singleton Prisma client — import this everywhere instead of new PrismaClient()

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
