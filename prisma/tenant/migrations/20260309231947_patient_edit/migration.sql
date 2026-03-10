/*
  Warnings:

  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_patient_id_fkey`;

-- DropForeignKey
ALTER TABLE `document_access_logs` DROP FOREIGN KEY `document_access_logs_patient_id_fkey`;

-- DropForeignKey
ALTER TABLE `documents` DROP FOREIGN KEY `documents_patient_id_fkey`;

-- DropTable
DROP TABLE `patients`;
