-- In-app notifications: one row per recipient, created when an officer acts on
-- an application (forward, approve, reject, ...). Idempotent like the other migrations.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "applicationId" INTEGER,
    "applicationType" VARCHAR(20),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notifications_userId_isRead_createdAt_idx" ON "Notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notifications_userId_createdAt_idx" ON "Notifications"("userId", "createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
