-- AlterTable
ALTER TABLE "public"."Roles" ADD COLUMN     "can_access_settings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dashboard_title" TEXT,
ADD COLUMN     "menu_items" JSONB,
ADD COLUMN     "permissions" JSONB;
