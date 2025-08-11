-- AlterTable
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD COLUMN     "actionesId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Actiones" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Actiones_code_key" ON "public"."Actiones"("code");

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_actionesId_fkey" FOREIGN KEY ("actionesId") REFERENCES "public"."Actiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
