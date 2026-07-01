-- CreateTable
CREATE TABLE "CancelFormRequests" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "applicationType" TEXT NOT NULL,
    "cancellationReason" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" INTEGER NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionedBy" INTEGER,
    "actionedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancelFormRequests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CancelFormRequests_applicationId_idx" ON "CancelFormRequests"("applicationId");

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelFormRequests" ADD CONSTRAINT "CancelFormRequests_actionedBy_fkey" FOREIGN KEY ("actionedBy") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
