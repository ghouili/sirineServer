/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,email]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `patients` ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `last_login` DATETIME(3) NULL,
    ADD COLUMN `password_hash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `patients_tenant_id_email_key` ON `patients`(`tenant_id`, `email`);
