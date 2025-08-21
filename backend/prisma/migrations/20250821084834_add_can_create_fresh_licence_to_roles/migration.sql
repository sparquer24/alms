-- DropIndex
DROP INDEX "public"."Users_username_key";

-- AlterTable
ALTER TABLE "public"."Roles" ADD COLUMN     "can_create_freshLicence" BOOLEAN NOT NULL DEFAULT false;
