-- CreateTable
CREATE TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "previousUserId" TEXT NOT NULL,
    "nextUserId" TEXT NOT NULL,
    "previousRoleId" TEXT NOT NULL,
    "nextRoleId" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."FreshLicenseApplicationsFormWorkflowHistories" ADD CONSTRAINT "FreshLicenseApplicationsFormWorkflowHistories_applicationI_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."FreshLicenseApplicationsForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
