-- CreateTable
CREATE TABLE "User" (
    "Id" TEXT NOT NULL,
    "UserCognitoId" TEXT NOT NULL,
    "EmailId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "RoleId" TEXT NOT NULL,
    "StateId" TEXT,
    "DistrictId" TEXT,
    "WingId" TEXT,
    "ZoneId" TEXT,
    "DivisionId" TEXT,
    "PoliceStationId" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Role" (
    "Id" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Active" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "Id" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Active" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "RolePermissionLink" (
    "Id" TEXT NOT NULL,
    "RoleId" TEXT NOT NULL,
    "PermissionId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermissionLink_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Country" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "State" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "CountryId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "District" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "StateId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Wings" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "DistrictId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wings_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "WingId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Division" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "ZoneId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "PoliceStation" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "DivisionId" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceStation_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_UserCognitoId_key" ON "User"("UserCognitoId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_RoleId_fkey" FOREIGN KEY ("RoleId") REFERENCES "Role"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_StateId_fkey" FOREIGN KEY ("StateId") REFERENCES "State"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_DistrictId_fkey" FOREIGN KEY ("DistrictId") REFERENCES "District"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_WingId_fkey" FOREIGN KEY ("WingId") REFERENCES "Wings"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ZoneId_fkey" FOREIGN KEY ("ZoneId") REFERENCES "Zone"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_DivisionId_fkey" FOREIGN KEY ("DivisionId") REFERENCES "Division"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_PoliceStationId_fkey" FOREIGN KEY ("PoliceStationId") REFERENCES "PoliceStation"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissionLink" ADD CONSTRAINT "RolePermissionLink_RoleId_fkey" FOREIGN KEY ("RoleId") REFERENCES "Role"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissionLink" ADD CONSTRAINT "RolePermissionLink_PermissionId_fkey" FOREIGN KEY ("PermissionId") REFERENCES "Permission"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_CountryId_fkey" FOREIGN KEY ("CountryId") REFERENCES "Country"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_StateId_fkey" FOREIGN KEY ("StateId") REFERENCES "State"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wings" ADD CONSTRAINT "Wings_DistrictId_fkey" FOREIGN KEY ("DistrictId") REFERENCES "District"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_WingId_fkey" FOREIGN KEY ("WingId") REFERENCES "Wings"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_ZoneId_fkey" FOREIGN KEY ("ZoneId") REFERENCES "Zone"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceStation" ADD CONSTRAINT "PoliceStation_DivisionId_fkey" FOREIGN KEY ("DivisionId") REFERENCES "Division"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
