CREATE TYPE "LeaveType" AS ENUM ('PAID', 'SICK', 'UNPAID');

ALTER TABLE "LeaveAllocation"
  ALTER COLUMN "leaveType" TYPE "LeaveType"
  USING ("leaveType"::"LeaveType");

ALTER TABLE "LeaveRequest"
  ALTER COLUMN "leaveType" TYPE "LeaveType"
  USING ("leaveType"::"LeaveType");
