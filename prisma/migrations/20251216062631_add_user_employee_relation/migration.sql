/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `employees` ADD COLUMN `foto_profil` TEXT NULL,
    ADD COLUMN `user_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `employees_user_id_key` ON `employees`(`user_id`);

-- CreateIndex
CREATE INDEX `employees_user_id_idx` ON `employees`(`user_id`);

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
