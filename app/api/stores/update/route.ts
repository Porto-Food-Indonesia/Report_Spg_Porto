
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// === UPDATE NAMA TOKO (dan semua riwayat penjualan) ===
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { oldName, newName, spgId } = body

    console.log("🔄 UPDATE STORE NAME - Request:", { oldName, newName, spgId })

    // Validasi input
    if (!oldName || !newName) {
      return NextResponse.json(
        { error: "Nama toko lama dan baru wajib diisi" },
        { status: 400 }
      )
    }

    if (!spgId) {
      return NextResponse.json(
        { error: "SPG ID wajib diisi" },
        { status: 400 }
      )
    }

    // Trim whitespace
    const trimmedOldName = oldName.trim()
    const trimmedNewName = newName.trim()

    if (trimmedOldName === trimmedNewName) {
      return NextResponse.json(
        { error: "Nama toko baru sama dengan yang lama" },
        { status: 400 }
      )
    }

    // Update semua record penjualan dengan nama toko lama milik SPG ini
    const result = await prisma.penjualan.updateMany({
      where: {
        nama_toko_transaksi: trimmedOldName,
        spg_id: Number(spgId),
      },
      data: {
        nama_toko_transaksi: trimmedNewName,
      },
    })

    console.log(`✅ Updated ${result.count} sales records from "${trimmedOldName}" to "${trimmedNewName}"`)

    return NextResponse.json(
      {
        success: true,
        message: `Berhasil update ${result.count} data penjualan`,
        updatedCount: result.count,
        oldName: trimmedOldName,
        newName: trimmedNewName,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error updating store name:", error)
    return NextResponse.json(
      {
        error: "Gagal update nama toko",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// === DELETE TOKO (dan semua riwayat penjualan) ===
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeName = searchParams.get("storeName")
    const spgId = searchParams.get("spgId")

    console.log("🗑️ DELETE STORE - Request:", { storeName, spgId })

    // Validasi input
    if (!storeName || !spgId) {
      return NextResponse.json(
        { error: "Nama toko dan SPG ID wajib diisi" },
        { status: 400 }
      )
    }

    const trimmedStoreName = storeName.trim()

    // Hitung berapa banyak record yang akan dihapus
    const count = await prisma.penjualan.count({
      where: {
        nama_toko_transaksi: trimmedStoreName,
        spg_id: Number(spgId),
      },
    })

    // Hapus semua record penjualan dengan nama toko ini milik SPG ini
    const result = await prisma.penjualan.deleteMany({
      where: {
        nama_toko_transaksi: trimmedStoreName,
        spg_id: Number(spgId),
      },
    })

    console.log(`✅ Deleted ${result.count} sales records for store "${trimmedStoreName}"`)

    return NextResponse.json(
      {
        success: true,
        message: `Berhasil hapus ${result.count} data penjualan untuk toko "${trimmedStoreName}"`,
        deletedCount: result.count,
        storeName: trimmedStoreName,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error deleting store:", error)
    return NextResponse.json(
      {
        error: "Gagal hapus toko",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
