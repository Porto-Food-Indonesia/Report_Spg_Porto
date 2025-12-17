/*
  Warnings:

  - You are about to drop the column `harga_per_gram` on the `penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `penjualan_gram` on the `penjualan` table. All the data in the column will be lost.
  - You are about to drop the column `gram_per_pcs` on the `produk` table. All the data in the column will be lost.
  - You are about to drop the `stok_spg` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `stok_spg` DROP FOREIGN KEY `stok_spg_produk_id_fkey`;

-- DropForeignKey
ALTER TABLE `stok_spg` DROP FOREIGN KEY `stok_spg_spg_id_fkey`;

-- DropIndex
DROP INDEX `penjualan_tanggal_idx` ON `penjualan`;

-- AlterTable
ALTER TABLE `penjualan` DROP COLUMN `harga_per_gram`,
    DROP COLUMN `penjualan_gram`;

-- AlterTable
ALTER TABLE `produk` DROP COLUMN `gram_per_pcs`;

-- DropTable
DROP TABLE `stok_spg`;
