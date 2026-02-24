// File: /app/api/toko/route.ts
// API untuk Master Toko (Admin Only)

import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Ambil semua toko
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // "Aktif", "Non-Aktif", atau "semua"

    let where = {}
    if (status && status !== "semua") {
      where = { status }
    }

    const tokoList = await prisma.toko.findMany({
      where,
      orderBy: {
        nama: "asc",
      },
    })

    console.log(`✅ Found ${tokoList.length} stores`)

    return NextResponse.json(
      {
        success: true,
        data: tokoList,
        count: tokoList.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error fetching toko:", error)
    return NextResponse.json(
      {
        error: "Gagal mengambil data toko",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Tambah toko baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, alamat, kontak } = body

    console.log("➕ CREATE TOKO - Request:", { nama, alamat, kontak })

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama toko wajib diisi" },
        { status: 400 }
      )
    }

    const trimmedNama = nama.trim()

    // Cek duplikasi
    const existing = await prisma.toko.findFirst({
      where: {
        nama: trimmedNama,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Nama toko sudah ada, gunakan nama lain" },
        { status: 400 }
      )
    }

    // Buat toko baru
    const newToko = await prisma.toko.create({
      data: {
        nama: trimmedNama,
        alamat: alamat?.trim() || null,
        kontak: kontak?.trim() || null,
        status: "Aktif",
      },
    })

    console.log(`✅ Created new toko: ${newToko.nama}`)

    return NextResponse.json(
      {
        success: true,
        message: "Toko berhasil ditambahkan",
        data: newToko,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Error creating toko:", error)
    return NextResponse.json(
      {
        error: "Gagal menambahkan toko",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Update toko
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nama, alamat, kontak, status } = body

    console.log("🔄 UPDATE TOKO - Request:", { id, nama, alamat, kontak, status })

    if (!id) {
      return NextResponse.json(
        { error: "ID toko wajib diisi" },
        { status: 400 }
      )
    }

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama toko wajib diisi" },
        { status: 400 }
      )
    }

    const trimmedNama = nama.trim()

    // Cek duplikasi (kecuali untuk toko yang sedang diedit)
    const existing = await prisma.toko.findFirst({
      where: {
        nama: trimmedNama,
        NOT: {
          id: Number(id),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Nama toko sudah digunakan oleh toko lain" },
        { status: 400 }
      )
    }

    // Update toko
    const updatedToko = await prisma.toko.update({
      where: { id: Number(id) },
      data: {
        nama: trimmedNama,
        alamat: alamat?.trim() || null,
        kontak: kontak?.trim() || null,
        status: status || "Aktif",
      },
    })

    console.log(`✅ Updated toko: ${updatedToko.nama}`)

    return NextResponse.json(
      {
        success: true,
        message: "Toko berhasil diperbarui",
        data: updatedToko,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Error updating toko:", error)
    return NextResponse.json(
      {
        error: "Gagal memperbarui toko",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Hapus toko (soft delete dengan status)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    console.log("🗑️ DELETE TOKO - ID:", id)

    if (!id) {
      return NextResponse.json(
        { error: "ID toko wajib diisi" },
        { status: 400 }
      )
    }

    // Cek apakah toko digunakan di penjualan
    const usageCount = await prisma.penjualan.count({
      where: {
        nama_toko_transaksi: {
          equals: (await prisma.toko.findUnique({ where: { id: Number(id) } }))?.nama,
        },
      },
    })

    if (usageCount > 0) {
      // Soft delete - ubah status jadi Non-Aktif
      const updatedToko = await prisma.toko.update({
        where: { id: Number(id) },
        data: { status: "Non-Aktif" },
      })

      console.log(`⚠️ Toko "${updatedToko.nama}" dinonaktifkan (digunakan di ${usageCount} transaksi)`)

      return NextResponse.json(
        {
          success: true,
          message: `Toko dinonaktifkan (masih digunakan di ${usageCount} transaksi)`,
          data: updatedToko,
        },
        { status: 200 }
      )
    } else {
      // Hard delete - hapus permanent
      const deletedToko = await prisma.toko.delete({
        where: { id: Number(id) },
      })

      console.log(`✅ Toko "${deletedToko.nama}" dihapus permanen`)

      return NextResponse.json(
        {
          success: true,
          message: "Toko berhasil dihapus",
          data: deletedToko,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("❌ Error deleting toko:", error)
    return NextResponse.json(
      {
        error: "Gagal menghapus toko",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}