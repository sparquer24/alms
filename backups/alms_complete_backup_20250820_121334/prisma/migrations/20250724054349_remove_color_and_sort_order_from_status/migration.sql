/*
  Warnings:

  - You are about to drop the column `color` on the `Status` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Status` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Status" DROP COLUMN "color",
DROP COLUMN "sortOrder";
