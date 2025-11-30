/*
  Warnings:

  - You are about to alter the column `total` on the `penjualan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `harga_karton` on the `penjualan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.
  - You are about to alter the column `harga_pcs` on the `penjualan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(65,30)`.

*/
-- DropIndex
DROP INDEX `employees_email_key` ON `employees`;

-- DropIndex
DROP INDEX `produk_sku_key` ON `produk`;

-- AlterTable
ALTER TABLE `penjualan` MODIFY `total` DECIMAL(65, 30) NOT NULL,
    MODIFY `harga_karton` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    MODIFY `harga_pcs` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `penjualan_produk_id_fkey` ON `penjualan`(`produk_id`);

-- CreateIndex
CREATE INDEX `penjualan_spg_id_fkey` ON `penjualan`(`spg_id`);

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_produk_id_fkey` FOREIGN KEY (`produk_id`) REFERENCES `produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penjualan` ADD CONSTRAINT `penjualan_spg_id_fkey` FOREIGN KEY (`spg_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
