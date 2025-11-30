-- RenameIndex
ALTER TABLE `penjualan` RENAME INDEX `penjualan_produk_id_fkey` TO `penjualan_produk_id_idx`;

-- RenameIndex
ALTER TABLE `penjualan` RENAME INDEX `penjualan_spg_id_fkey` TO `penjualan_spg_id_idx`;
