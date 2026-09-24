-- CreateTable
CREATE TABLE "CancelFormFileUploads" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,

    CONSTRAINT "CancelFormFileUploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CancelFormFileUploads_applicationId_idx" ON "CancelFormFileUploads"("applicationId");

-- AddForeignKey
ALTER TABLE "CancelFormFileUploads" ADD CONSTRAINT "CancelFormFileUploads_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CancelFormRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
