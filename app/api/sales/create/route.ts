import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// === CREATE PENJUALAN ===
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("=== POST /sales/create ===", body)

    const {
      spgId,
      tanggal,
      produkId,
      namaTokoTransaksi,
      notes,
      category, // "Pack/Karton" atau "Curah"
      // Pack/Karton fields
      totalPcs,
      hargaPcs,
      hargaKarton,
      stockPack,
      stockKarton,
      // Curah fields
      totalGram,
      totalHargaCurah,
    } = body

    // ✅ Validasi input dasar
    if (!spgId || !tanggal || !produkId || !namaTokoTransaksi || !category) {
      return NextResponse.json(
        { error: "SPG, tanggal, produk, nama toko, dan kategori wajib diisi" },
        { status: 400 }
      )
    }

    // ✅ Ambil data produk
    const produk = await prisma.produk.findUnique({
      where: { id: Number(produkId) },
    })

    if (!produk) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      )
    }

    // ✅ Validasi kategori produk sesuai
    if (produk.category !== category) {
      return NextResponse.json(
        { error: `Produk ini adalah kategori ${produk.category}, bukan ${category}` },
        { status: 400 }
      )
    }

    let penjualan

    // ✅ PROSES BERDASARKAN KATEGORI
    if (category === "Pack/Karton") {
      // Validasi Pack/Karton - hargaKarton OPSIONAL
      if (!totalPcs || !hargaPcs || stockPack === undefined || stockKarton === undefined) {
        return NextResponse.json(
          { error: "Total pack, harga per pack, dan stok wajib diisi" },
          { status: 400 }
        )
      }

      if (totalPcs < 1) {
        return NextResponse.json(
          { error: "Total pack minimal 1" },
          { status: 400 }
        )
      }

      // Auto-convert total pcs ke karton + sisa pcs
      const penjualanKarton = Math.floor(totalPcs / produk.pcs_per_karton)
      const penjualanPcs = totalPcs % produk.pcs_per_karton

      // Hitung total harga
      let total = 0
      const hargaKartonValue = hargaKarton ? Number(hargaKarton) : 0

      if (hargaKartonValue > 0) {
        // Ada harga karton: hitung karton + sisa pack
        total = penjualanKarton * hargaKartonValue + penjualanPcs * Number(hargaPcs)
      } else {
        // Tidak ada harga karton: hitung semua sebagai pack
        total = totalPcs * Number(hargaPcs)
      }

      // Simpan ke database
      penjualan = await prisma.penjualan.create({
        data: {
          spg_id: Number(spgId),
          tanggal: new Date(tanggal),
          produk_id: Number(produkId),
          penjualan_karton: penjualanKarton,
          penjualan_pcs: penjualanPcs,
          harga_karton: hargaKartonValue,
          harga_pcs: Number(hargaPcs),
          nama_toko_transaksi: namaTokoTransaksi,
          total,
          notes: notes || null,
          // Kolom curah dikosongkan (default 0)
          harga_per_gram: 0,
          penjualan_gram: 0,
        },
        include: {
          produk: true,
          user: true,
        },
      })

      // Update stok SPG
      await prisma.stok_spg.upsert({
        where: {
          spg_id_produk_id: {
            spg_id: Number(spgId),
            produk_id: Number(produkId),
          },
        },
        update: {
          stok_karton: Number(stockKarton),
          stok_pcs: Number(stockPack),
          tanggal_update: new Date(),
          keterangan: `Update stok setelah penjualan ${namaTokoTransaksi}`,
        },
        create: {
          spg_id: Number(spgId),
          produk_id: Number(produkId),
          stok_karton: Number(stockKarton),
          stok_pcs: Number(stockPack),
          stok_gram: 0,
          keterangan: `Stok awal untuk produk ${produk.nama}`,
        },
      })

      console.log("✅ Pack/Karton Sales created:", {
        totalPcs,
        penjualanKarton,
        penjualanPcs,
        hargaKarton: hargaKartonValue,
        calculationMethod: hargaKartonValue > 0 ? "karton+pack" : "all-pack",
        total,
        stockUpdate: { stockPack, stockKarton },
      })

    } else if (category === "Curah") {
      // Validasi Curah
      if (!totalGram || !totalHargaCurah) {
        return NextResponse.json(
          { error: "Total gram dan total harga curah wajib diisi" },
          { status: 400 }
        )
      }

      if (totalGram <= 0 || totalHargaCurah <= 0) {
        return NextResponse.json(
          { error: "Total gram dan total harga harus lebih dari 0" },
          { status: 400 }
        )
      }

      // Simpan ke database - harga curah masuk ke kolom harga_pcs
      penjualan = await prisma.penjualan.create({
        data: {
          spg_id: Number(spgId),
          tanggal: new Date(tanggal),
          produk_id: Number(produkId),
          penjualan_gram: Number(totalGram),
          harga_pcs: Number(totalHargaCurah), // 🔥 HARGA CURAH MASUK KE HARGA_PCS
          nama_toko_transaksi: namaTokoTransaksi,
          total: Number(totalHargaCurah),
          notes: notes || null,
          // Kolom lainnya dikosongkan (default 0)
          penjualan_karton: 0,
          penjualan_pcs: 0,
          harga_karton: 0,
          harga_per_gram: 0,
        },
        include: {
          produk: true,
          user: true,
        },
      })

      console.log("✅ Curah Sales created:", {
        totalGram,
        totalHargaCurah,
        savedInHargaPcs: true,
      })

    } else {
      return NextResponse.json(
        { error: "Kategori tidak valid. Harus 'Pack/Karton' atau 'Curah'" },
        { status: 400 }
      )
    }

    return NextResponse.json(penjualan, { status: 201 })
  } catch (error) {
    console.error("[POST /sales/create] Error:", error)
    return NextResponse.json(
      {
        error: "Gagal menyimpan laporan penjualan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// === GET SEMUA PENJUALAN ===
export async function GET() {
  try {
    const sales = await prisma.penjualan.findMany({
      include: {
        produk: true,
        user: true,
      },
      orderBy: {
        tanggal: "desc",
      },
    })
    return NextResponse.json(sales)
  } catch (error) {
    console.error("[GET /sales/create] Error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data penjualan" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}