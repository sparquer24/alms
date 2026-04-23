-- CreateTable
CREATE TABLE "public"."RenewalFormPersonalDetails" (
    "id" SERIAL NOT NULL,
    "acknowledgementNo" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "parentOrSpouseName" TEXT NOT NULL,
    "sex" "public"."Sex" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "dobInWords" TEXT,
    "panNumber" TEXT,
    "aadharNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filledBy" TEXT,
    "occupationAndBusinessId" INTEGER,
    "permanentAddressId" INTEGER,
    "presentAddressId" INTEGER,
    "currentUserId" INTEGER,
    "previousUserId" INTEGER,
    "workflowStatusId" INTEGER,
    "isAwareOfLegalConsequences" BOOLEAN DEFAULT false,
    "isDeclarationAccepted" BOOLEAN DEFAULT false,
    "isTermsAccepted" BOOLEAN DEFAULT false,
    "isSubmit" BOOLEAN DEFAULT false,
    "renewalLicenseId" TEXT,
    "isApproved" BOOLEAN DEFAULT false,
    "isGroundReportGenerated" BOOLEAN DEFAULT false,
    "isPending" BOOLEAN DEFAULT false,
    "isReEnquiry" BOOLEAN DEFAULT false,
    "isReEnquiryDone" BOOLEAN DEFAULT false,
    "isRejected" BOOLEAN DEFAULT false,
    "isRecommended" BOOLEAN DEFAULT false,
    "isNotRecommended" BOOLEAN DEFAULT false,

    CONSTRAINT "RenewalFormPersonalDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RenewalAddressesAndContactDetails" (
    "id" SERIAL NOT NULL,
    "addressLine" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "policeStationId" INTEGER NOT NULL,
    "sinceResiding" TIMESTAMP(3) NOT NULL,
    "divisionId" INTEGER NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "telephoneOffice" TEXT,
    "telephoneResidence" TEXT,
    "officeMobileNumber" TEXT,
    "alternativeMobile" TEXT,

    CONSTRAINT "RenewalAddressesAndContactDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RenewalOccupationAndBusiness" (
    "id" SERIAL NOT NULL,
    "occupation" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "districtId" INTEGER NOT NULL,
    "cropLocation" TEXT,
    "areaUnderCultivation" DOUBLE PRECISION,

    CONSTRAINT "RenewalOccupationAndBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RenewalLicenseDetails" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "needForLicense" "public"."LicensePurpose",
    "armsCategory" "public"."ArmsCategory",
    "areaOfValidity" TEXT,
    "ammunitionDescription" TEXT,
    "specialConsiderationReason" TEXT,
    "licencePlaceArea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenewalLicenseDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RenewalFileUploads" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "fileType" "public"."FileType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,

    CONSTRAINT "RenewalFileUploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RenewalBiometricDatas" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "biometricData" JSONB NOT NULL,

    CONSTRAINT "RenewalBiometricDatas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RenewalApplicationsFormWorkflowHistories" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "previousUserId" INTEGER NOT NULL,
    "nextUserId" INTEGER NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousRoleId" INTEGER,
    "nextRoleId" INTEGER,
    "actionesId" INTEGER,
    "attachments" JSONB,

    CONSTRAINT "RenewalApplicationsFormWorkflowHistories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_RenewalRequestedWeapons" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RenewalRequestedWeapons_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "RenewalFormPersonalDetails_licenseNumber_key" ON "public"."RenewalFormPersonalDetails"("licenseNumber");

-- CreateIndex
CREATE INDEX "RenewalFormPersonalDetails_aadharNumber_idx" ON "public"."RenewalFormPersonalDetails"("aadharNumber");

-- CreateIndex
CREATE INDEX "RenewalFormPersonalDetails_licenseNumber_idx" ON "public"."RenewalFormPersonalDetails"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RenewalBiometricDatas_applicationId_key" ON "public"."RenewalBiometricDatas"("applicationId");

-- CreateIndex
CREATE INDEX "_RenewalRequestedWeapons_B_index" ON "public"."_RenewalRequestedWeapons"("B");

-- AddForeignKey
ALTER TABLE "public"."RenewalFormPersonalDetails" ADD CONSTRAINT "RenewalFormPersonalDetails_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalFormPersonalDetails" ADD CONSTRAINT "RenewalFormPersonalDetails_occupationAndBusinessId_fkey" FOREIGN KEY ("occupationAndBusinessId") REFERENCES "public"."RenewalOccupationAndBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalFormPersonalDetails" ADD CONSTRAINT "RenewalFormPersonalDetails_permanentAddressId_fkey" FOREIGN KEY ("permanentAddressId") REFERENCES "public"."RenewalAddressesAndContactDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalFormPersonalDetails" ADD CONSTRAINT "RenewalFormPersonalDetails_presentAddressId_fkey" FOREIGN KEY ("presentAddressId") REFERENCES "public"."RenewalAddressesAndContactDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalFormPersonalDetails" ADD CONSTRAINT "RenewalFormPersonalDetails_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalFormPersonalDetails" ADD CONSTRAINT "RenewalFormPersonalDetails_workflowStatusId_fkey" FOREIGN KEY ("workflowStatusId") REFERENCES "public"."Statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalAddressesAndContactDetails" ADD CONSTRAINT "RenewalAddressesAndContactDetails_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalAddressesAndContactDetails" ADD CONSTRAINT "RenewalAddressesAndContactDetails_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "public"."Divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalAddressesAndContactDetails" ADD CONSTRAINT "RenewalAddressesAndContactDetails_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "public"."PoliceStations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalAddressesAndContactDetails" ADD CONSTRAINT "RenewalAddressesAndContactDetails_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalAddressesAndContactDetails" ADD CONSTRAINT "RenewalAddressesAndContactDetails_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalOccupationAndBusiness" ADD CONSTRAINT "RenewalOccupationAndBusiness_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."Districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalOccupationAndBusiness" ADD CONSTRAINT "RenewalOccupationAndBusiness_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."States"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalLicenseDetails" ADD CONSTRAINT "RenewalLicenseDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."RenewalFormPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalFileUploads" ADD CONSTRAINT "RenewalFileUploads_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."RenewalFormPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalBiometricDatas" ADD CONSTRAINT "RenewalBiometricDatas_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."RenewalFormPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalApplicationsFormWorkflowHistories" ADD CONSTRAINT "RenewalApplicationsFormWorkflowHistories_actionesId_fkey" FOREIGN KEY ("actionesId") REFERENCES "public"."Actiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalApplicationsFormWorkflowHistories" ADD CONSTRAINT "RenewalApplicationsFormWorkflowHistories_nextRoleId_fkey" FOREIGN KEY ("nextRoleId") REFERENCES "public"."Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalApplicationsFormWorkflowHistories" ADD CONSTRAINT "RenewalApplicationsFormWorkflowHistories_nextUserId_fkey" FOREIGN KEY ("nextUserId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalApplicationsFormWorkflowHistories" ADD CONSTRAINT "RenewalApplicationsFormWorkflowHistories_previousRoleId_fkey" FOREIGN KEY ("previousRoleId") REFERENCES "public"."Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalApplicationsFormWorkflowHistories" ADD CONSTRAINT "RenewalApplicationsFormWorkflowHistories_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RenewalApplicationsFormWorkflowHistories" ADD CONSTRAINT "RenewalApplicationsFormWorkflowHistories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."RenewalFormPersonalDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RenewalRequestedWeapons" ADD CONSTRAINT "_RenewalRequestedWeapons_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."RenewalLicenseDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RenewalRequestedWeapons" ADD CONSTRAINT "_RenewalRequestedWeapons_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."WeaponTypeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
