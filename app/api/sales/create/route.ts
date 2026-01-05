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
      jumlahKarton,
      jumlahPack,
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
      // Validasi Pack/Karton - ALLOW ZERO VALUES
      const kartonQty = Number(jumlahKarton) || 0
      const packQty = Number(jumlahPack) || 0
      
      // ✅ Penjualan bisa 0 (untuk pencatatan stok saja)
      // Hanya validasi harga jika ada penjualan
      
      if (kartonQty > 0 && (!hargaKarton || Number(hargaKarton) <= 0)) {
        return NextResponse.json(
          { error: "Harga per karton wajib diisi (lebih dari 0) jika ada penjualan karton" },
          { status: 400 }
        )
      }

      if (packQty > 0 && (!hargaPcs || Number(hargaPcs) <= 0)) {
        return NextResponse.json(
          { error: "Harga per pack wajib diisi (lebih dari 0) jika ada penjualan pack" },
          { status: 400 }
        )
      }

      // Validasi stok (wajib diisi, tapi boleh 0)
      if (stockPack === undefined || stockPack === null || stockKarton === undefined || stockKarton === null) {
        return NextResponse.json(
          { error: "Stok pack dan karton wajib diisi (boleh 0)" },
          { status: 400 }
        )
      }

      // Hitung total harga - MANUAL CALCULATION
      const hargaKartonValue = hargaKarton ? Number(hargaKarton) : 0
      const hargaPcsValue = hargaPcs ? Number(hargaPcs) : 0
      
      const totalKarton = kartonQty * hargaKartonValue
      const totalPack = packQty * hargaPcsValue
      const total = totalKarton + totalPack

      // Simpan ke database
      penjualan = await prisma.penjualan.create({
        data: {
          spg_id: Number(spgId),
          tanggal: new Date(tanggal),
          produk_id: Number(produkId),
          penjualan_karton: kartonQty,
          penjualan_pcs: packQty,
          harga_karton: hargaKartonValue,
          harga_pcs: hargaPcsValue,
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
        jumlahKarton: kartonQty,
        jumlahPack: packQty,
        totalPcs,
        hargaKarton: hargaKartonValue,
        hargaPcs: hargaPcsValue,
        totalKarton,
        totalPack,
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