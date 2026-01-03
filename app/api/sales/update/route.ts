import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== PUT /api/sales/update ===', body);

    const {
      id,
      penjualanKarton,    // ✅ TAMBAH: Accept karton langsung
      penjualanPcs,        // ✅ TAMBAH: Accept pcs langsung
      totalPcs,            // ✅ KEEP: Backward compatibility
      hargaPcs,
      hargaKarton,
      stockPack,
      stockKarton,
      namaTokoTransaksi,
      notes
    } = body;

    // ✅ Validasi: Hanya ID yang wajib
    if (!id) {
      return NextResponse.json({ error: "ID transaksi wajib diisi" }, { status: 400 });
    }

    // 1. Ambil data penjualan existing
    const existingSale = await prisma.penjualan.findUnique({
      where: { id: Number(id) },
      include: { 
        produk: true,
        user: true 
      }
    });

    if (!existingSale) {
      return NextResponse.json({ error: "Data penjualan tidak ditemukan" }, { status: 404 });
    }

    // 2. Cek apakah masih bisa edit (H+2)
    const salesDate = new Date(existingSale.tanggal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    salesDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - salesDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 2) {
      return NextResponse.json(
        { error: "Laporan hanya bisa diedit maksimal 2 hari setelah tanggal transaksi" },
        { status: 403 }
      );
    }

    // 3. Prepare update data untuk tabel penjualan
    const updateData: any = {};
    let needRecalcTotal = false;

    // ✅ PRIORITAS 1: Handle penjualanKarton dan penjualanPcs secara terpisah
    if (penjualanKarton !== undefined && penjualanKarton !== null && penjualanKarton !== '') {
      updateData.penjualan_karton = Number(penjualanKarton);
      needRecalcTotal = true;
      console.log('📦 Update penjualan_karton:', updateData.penjualan_karton);
    }

    if (penjualanPcs !== undefined && penjualanPcs !== null && penjualanPcs !== '') {
      updateData.penjualan_pcs = Number(penjualanPcs);
      needRecalcTotal = true;
      console.log('📦 Update penjualan_pcs:', updateData.penjualan_pcs);
    }

    // ✅ PRIORITAS 2: Handle totalPcs (untuk backward compatibility)
    // Hanya digunakan jika penjualanKarton dan penjualanPcs tidak dikirim
    if (!updateData.hasOwnProperty('penjualan_karton') && 
        !updateData.hasOwnProperty('penjualan_pcs') &&
        totalPcs !== undefined && totalPcs !== null && totalPcs !== '') {
      const pcsPerKarton = existingSale.produk.pcs_per_karton;
      updateData.penjualan_karton = Math.floor(Number(totalPcs) / pcsPerKarton);
      updateData.penjualan_pcs = Number(totalPcs) % pcsPerKarton;
      needRecalcTotal = true;
      
      console.log('📦 Auto-convert totalPcs:', {
        totalPcs: Number(totalPcs),
        pcsPerKarton,
        karton: updateData.penjualan_karton,
        pcs: updateData.penjualan_pcs
      });
    }

    // Handle harga karton
    if (hargaKarton !== undefined && hargaKarton !== null && hargaKarton !== '') {
      updateData.harga_karton = Number(hargaKarton);
      needRecalcTotal = true;
    }

    // Handle harga pcs
    if (hargaPcs !== undefined && hargaPcs !== null && hargaPcs !== '') {
      updateData.harga_pcs = Number(hargaPcs);
      needRecalcTotal = true;
    }

    // Handle nama toko
    if (namaTokoTransaksi !== undefined && namaTokoTransaksi !== null && namaTokoTransaksi.trim() !== '') {
      updateData.nama_toko_transaksi = namaTokoTransaksi.trim();
    }

    // Handle notes
    if (notes !== undefined && notes !== null) {
      updateData.notes = notes.trim() || null;
    }

    // 4. Recalculate total jika ada perubahan qty atau harga
    if (needRecalcTotal) {
      const finalKarton = updateData.penjualan_karton ?? existingSale.penjualan_karton;
      const finalPcs = updateData.penjualan_pcs ?? existingSale.penjualan_pcs;
      const finalHargaKarton = updateData.harga_karton ?? existingSale.harga_karton;
      const finalHargaPcs = updateData.harga_pcs ?? existingSale.harga_pcs;

      updateData.total = (finalKarton * finalHargaKarton) + (finalPcs * finalHargaPcs);
      
      console.log('💰 Recalculate total:', {
        karton: finalKarton,
        pcs: finalPcs,
        hargaKarton: finalHargaKarton,
        hargaPcs: finalHargaPcs,
        total: updateData.total
      });
    }

    // 5. Update sales record jika ada perubahan
    let updated = existingSale;
    if (Object.keys(updateData).length > 0) {
      console.log('📝 Update penjualan data:', updateData);

      updated = await prisma.penjualan.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          produk: true,
          user: true
        }
      });
    }

    // 6. Update stock di tabel stok_spg (bukan di produk!)
    let updatedStock = null;
    if ((stockPack !== undefined && stockPack !== null && stockPack !== '') || 
        (stockKarton !== undefined && stockKarton !== null && stockKarton !== '')) {
      
      const stockUpdateData: any = {};
      
      if (stockPack !== undefined && stockPack !== null && stockPack !== '') {
        stockUpdateData.stok_pcs = Number(stockPack);
      }
      
      if (stockKarton !== undefined && stockKarton !== null && stockKarton !== '') {
        stockUpdateData.stok_karton = Number(stockKarton);
      }

      if (Object.keys(stockUpdateData).length > 0) {
        // Update atau create stock record untuk SPG ini
        try {
          updatedStock = await prisma.stok_spg.upsert({
            where: {
              spg_id_produk_id: {
                spg_id: existingSale.spg_id,
                produk_id: existingSale.produk_id
              }
            },
            update: stockUpdateData,
            create: {
              spg_id: existingSale.spg_id,
              produk_id: existingSale.produk_id,
              stok_karton: stockUpdateData.stok_karton ?? 0,
              stok_pcs: stockUpdateData.stok_pcs ?? 0,
              stok_gram: 0,
            }
          });
          
          console.log('📦 Stock SPG updated:', stockUpdateData);
        } catch (stockError) {
          console.error('❌ Error updating stock:', stockError);
          // Tidak throw error, biarkan update penjualan tetap berhasil
        }
      }
    }

    // 7. Check if there are any changes at all
    if (Object.keys(updateData).length === 0 && !updatedStock) {
      return NextResponse.json(
        { error: "Tidak ada perubahan yang dilakukan" },
        { status: 400 }
      );
    }

    console.log('✅ Sales report updated:', updated.id);

    return NextResponse.json({
      success: true,
      message: "Data penjualan berhasil diupdate",
      data: updated
    }, { status: 200 });

  } catch (error) {
    console.error("[PUT /api/sales/update] Error:", error);
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan server",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}