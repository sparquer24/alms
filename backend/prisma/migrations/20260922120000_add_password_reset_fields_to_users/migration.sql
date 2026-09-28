-- AlterTable
ALTER TABLE "Users" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "Users" ADD COLUMN "passwordResetExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Users_passwordResetToken_key" ON "Users"("passwordResetToken");
