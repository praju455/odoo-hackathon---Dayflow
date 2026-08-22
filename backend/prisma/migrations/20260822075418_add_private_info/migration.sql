-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "homeAddress" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "panCode" TEXT,
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "uanCode" TEXT;
