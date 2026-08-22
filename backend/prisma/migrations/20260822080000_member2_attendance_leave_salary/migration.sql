-- ============================================================
-- Migration: member2_attendance_leave_salary
-- Extends Member 1's Company + User tables with Member 2's
-- Attendance (extended), LeaveAllocation, LeaveRequest,
-- SalaryStructure, and SalaryComponent models.
--
-- PREREQUISITE: Member 1's migration must have already created
--   the "Company" and "User" tables.
-- ============================================================

-- ── Enums (PostgreSQL requires CREATE TYPE) ─────────────────

-- Member 2 adds LEAVE to Member 1's AttendanceStatus enum
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'LEAVE';

-- Leave request lifecycle
DO $$ BEGIN
  CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Salary wage period
DO $$ BEGIN
  CREATE TYPE "WageType" AS ENUM ('MONTHLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Salary component calculation type
DO $$ BEGIN
  CREATE TYPE "ComponentType" AS ENUM ('FIXED', 'PERCENT_OF_WAGE', 'PERCENT_OF_BASIC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Attendance (extend Member 1's base model) ───────────────
-- Add the check-in/out and work-hour columns to whatever
-- Member 1 created. IF Member 1 didn't create Attendance yet,
-- the CREATE TABLE below handles it.

-- Case A: Member 1 already created Attendance — add our columns
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "checkIn"    TIMESTAMPTZ;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "checkOut"   TIMESTAMPTZ;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "workHours"  DOUBLE PRECISION;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "extraHours" DOUBLE PRECISION;

-- Case B: Attendance table doesn't exist yet — create it in full
CREATE TABLE IF NOT EXISTS "Attendance" (
  "id"         TEXT              NOT NULL PRIMARY KEY,
  "userId"     TEXT              NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "date"       DATE              NOT NULL,
  "checkIn"    TIMESTAMPTZ,
  "checkOut"   TIMESTAMPTZ,
  "workHours"  DOUBLE PRECISION,
  "extraHours" DOUBLE PRECISION,
  "status"     "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
  "createdAt"  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  CONSTRAINT "Attendance_userId_date_key" UNIQUE ("userId", "date")
);
CREATE INDEX IF NOT EXISTS "Attendance_userId_idx" ON "Attendance"("userId");

-- ── LeaveAllocation ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LeaveAllocation" (
  "id"        TEXT        NOT NULL PRIMARY KEY,
  "userId"    TEXT        NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "leaveType" TEXT        NOT NULL,            -- "PAID" | "SICK" | "UNPAID"
  "totalDays" INTEGER     NOT NULL,
  "usedDays"  INTEGER     NOT NULL DEFAULT 0,
  "year"      INTEGER     NOT NULL,            -- calendar year, e.g. 2026
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "LeaveAllocation_userId_leaveType_year_key" UNIQUE ("userId", "leaveType", "year")
);
CREATE INDEX IF NOT EXISTS "LeaveAllocation_userId_idx" ON "LeaveAllocation"("userId");

-- ── LeaveRequest ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
  "id"             TEXT                 NOT NULL PRIMARY KEY,
  "userId"         TEXT                 NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "leaveType"      TEXT                 NOT NULL,   -- "PAID" | "SICK" | "UNPAID"
  "startDate"      DATE                 NOT NULL,
  "endDate"        DATE                 NOT NULL,
  "allocationDays" INTEGER              NOT NULL,   -- (endDate - startDate) + 1
  "reason"         TEXT,
  "attachmentUrl"  TEXT,                            -- filename/path; soft-required for SICK
  "status"         "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
  "adminComment"   TEXT,
  "createdAt"      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");

-- ── SalaryStructure ──────────────────────────────────────────
-- Replaces / extends Member 1's simpler salary concept.
CREATE TABLE IF NOT EXISTS "SalaryStructure" (
  "id"                TEXT        NOT NULL PRIMARY KEY,
  "userId"            TEXT        NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "wageType"          "WageType"  NOT NULL DEFAULT 'MONTHLY',
  "fixedWage"         DOUBLE PRECISION NOT NULL,
  "pfEmployeePercent" DOUBLE PRECISION NOT NULL DEFAULT 12,
  "pfEmployerPercent" DOUBLE PRECISION NOT NULL DEFAULT 12,
  "professionalTax"   DOUBLE PRECISION NOT NULL DEFAULT 200,
  "effectiveFrom"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SalaryComponent ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SalaryComponent" (
  "id"                TEXT            NOT NULL PRIMARY KEY,
  "salaryStructureId" TEXT            NOT NULL REFERENCES "SalaryStructure"("id") ON DELETE CASCADE,
  "name"              TEXT            NOT NULL,
  "compType"          "ComponentType" NOT NULL,
  "value"             DOUBLE PRECISION NOT NULL,
  "calculatedAmount"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SalaryComponent_salaryStructureId_idx" ON "SalaryComponent"("salaryStructureId");
