import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("=== PUT /api/sales/update ===", body)

    const { id, totalPcs, hargaPcs, hargaKarton, namaTokoTransaksi } = body

    if (!id || !totalPcs || !hargaPcs || !hargaKarton || !namaTokoTransaksi) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const existingSale = await prisma.penjualan.findUnique({
      where: { id: Number(id) },
      include: { produk: true },
    })

    if (!existingSale) {
      return NextResponse.json({ error: "Data penjualan tidak ditemukan" }, { status: 404 })
    }

    // ✅ Maksimal edit 2 hari setelah tanggal transaksi
    const salesDate = new Date(existingSale.tanggal)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    salesDate.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - salesDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 2) {
      return NextResponse.json(
        { error: "Laporan hanya bisa diedit maksimal 2 hari setelah tanggal transaksi" },
        { status: 403 }
      )
    }

    // ✅ Auto-konversi pcs → karton + sisa pcs
    const pcsPerKarton = existingSale.produk.pcs_per_karton
    const penjualanKarton = Math.floor(Number(totalPcs) / pcsPerKarton)
    const penjualanPcs = Number(totalPcs) % pcsPerKarton

    const total =
      penjualanKarton * Number(hargaKarton) +
      penjualanPcs * Number(hargaPcs)

    const updated = await prisma.penjualan.update({
      where: { id: Number(id) },
      data: {
        penjualan_karton: penjualanKarton,
        penjualan_pcs: penjualanPcs,
        harga_karton: Number(hargaKarton),
        harga_pcs: Number(hargaPcs),
        nama_toko_transaksi: namaTokoTransaksi,
        total,
      },
      include: {
        produk: true,
        user: true,
      },
    })

    console.log("✅ Sales report updated:", updated.id)
    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("[PUT /api/sales/update] Error:", error)
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
