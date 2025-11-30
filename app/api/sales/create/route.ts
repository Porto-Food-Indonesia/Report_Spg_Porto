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
      totalPcs,
      hargaPcs,
      hargaKarton,
      namaTokoTransaksi,
      notes
    } = body

    // ✅ Validasi input
    if (
      !spgId ||
      !tanggal ||
      !produkId ||
      !totalPcs ||
      !hargaPcs ||
      !hargaKarton ||
      !namaTokoTransaksi
    ) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      )
    }

    if (totalPcs < 1) {
      return NextResponse.json(
        { error: "Total pcs minimal 1" },
        { status: 400 }
      )
    }

    // ✅ Ambil data produk untuk dapatkan pcs_per_karton
    const produk = await prisma.produk.findUnique({
      where: { id: Number(produkId) },
    })

    if (!produk) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      )
    }

    // ✅ Auto-convert total pcs ke karton + sisa pcs
    const penjualanKarton = Math.floor(totalPcs / produk.pcs_per_karton)
    const penjualanPcs = totalPcs % produk.pcs_per_karton

    // ✅ Hitung total harga
    const total =
      penjualanKarton * Number(hargaKarton) +
      penjualanPcs * Number(hargaPcs)

    // ✅ Simpan ke database
    const penjualan = await prisma.penjualan.create({
      data: {
        spg_id: Number(spgId),
        tanggal: new Date(tanggal),
        produk_id: Number(produkId),
        penjualan_karton: penjualanKarton,
        penjualan_pcs: penjualanPcs,
        harga_karton: Number(hargaKarton),
        harga_pcs: Number(hargaPcs),
        nama_toko_transaksi: namaTokoTransaksi,
        total,
        notes: notes || null,
      },
      include: {
        produk: true,
        user: true,
      },
    })

    console.log("✅ Sales created:", {
      totalPcs,
      penjualanKarton,
      penjualanPcs,
      total,
    })

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
