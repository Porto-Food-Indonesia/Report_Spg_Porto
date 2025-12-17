-- AlterTable
ALTER TABLE `penjualan` ADD COLUMN `harga_per_gram` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `penjualan_gram` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `produk` ADD COLUMN `gram_per_pcs` INTEGER NULL;

-- CreateTable
CREATE TABLE `stok_spg` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spg_id` INTEGER NOT NULL,
    `produk_id` INTEGER NOT NULL,
    `stok_karton` INTEGER NOT NULL DEFAULT 0,
    `stok_pcs` INTEGER NOT NULL DEFAULT 0,
    `stok_gram` INTEGER NOT NULL DEFAULT 0,
    `tanggal_update` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stok_spg_produk_id_idx`(`produk_id`),
    INDEX `stok_spg_spg_id_idx`(`spg_id`),
    UNIQUE INDEX `stok_spg_spg_id_produk_id_key`(`spg_id`, `produk_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `penjualan_tanggal_idx` ON `penjualan`(`tanggal`);

-- AddForeignKey
ALTER TABLE `stok_spg` ADD CONSTRAINT `stok_spg_produk_id_fkey` FOREIGN KEY (`produk_id`) REFERENCES `produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_spg` ADD CONSTRAINT `stok_spg_spg_id_fkey` FOREIGN KEY (`spg_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
