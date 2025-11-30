import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// === CREATE PRODUK ===
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('=== POST /products/create ===', body)
    
    const { nama, sku, category, pcs_per_karton, status } = body

    if (!nama || !sku || !category) {
      return NextResponse.json(
        { error: "Nama produk, SKU, dan kategori harus diisi" },
        { status: 400 }
      )
    }

    // ✅ Validasi pcs_per_karton
    if (!pcs_per_karton || pcs_per_karton < 1) {
      return NextResponse.json(
        { error: "Jumlah pcs per karton minimal 1" },
        { status: 400 }
      )
    }

    const product = await prisma.produk.create({
      data: {
        nama,
        sku,
        category,
        pcs_per_karton: Number(pcs_per_karton),  // ✅ TAMBAH
        status: status || "Aktif",
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("[POST /products/create] Error:", error)
    return NextResponse.json(
      { 
        error: "Gagal membuat produk",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// === UPDATE PRODUK ===
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    console.log('=== PUT /products/create ===', body)
    
    const { id, nama, sku, category, pcs_per_karton, status } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID produk diperlukan" },
        { status: 400 }
      )
    }

    const product = await prisma.produk.update({
      where: { id: Number(id) },
      data: {
        ...(nama && { nama }),
        ...(sku && { sku }),
        ...(category && { category }),
        ...(pcs_per_karton && { pcs_per_karton: Number(pcs_per_karton) }),  // ✅ TAMBAH
        ...(status && { status }),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("[PUT /products/create] Error:", error)
    return NextResponse.json(
      { 
        error: "Gagal update produk",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// === NONAKTIFKAN PRODUK (DELETE LOGIC) ===
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID produk diperlukan" },
        { status: 400 }
      )
    }

    // Update status jadi Nonaktif, bukan delete
    await prisma.produk.update({
      where: { id: Number(id) },
      data: { status: "Nonaktif" },
    })

    return NextResponse.json({ success: true, message: "Produk dinonaktifkan" })
  } catch (error) {
    console.error("[DELETE /products/create] Error:", error)
    return NextResponse.json(
      { 
        error: "Gagal menonaktifkan produk",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}