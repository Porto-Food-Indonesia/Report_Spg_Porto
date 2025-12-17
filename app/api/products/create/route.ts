import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// === CREATE PRODUK ===
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('=== POST /products/create ===', body)
    
    const { nama, sku, category, pack_per_karton, status } = body

    if (!nama || !sku || !category) {
      return NextResponse.json(
        { error: "Nama produk, SKU, dan kategori harus diisi" },
        { status: 400 }
      )
    }

    // ✅ Validasi pack_per_karton hanya untuk produk Pack/Karton
    if (category === "Pack/Karton") {
      if (!pack_per_karton || pack_per_karton < 1) {
        return NextResponse.json(
          { error: "Untuk produk Pack/Karton, jumlah pack per karton minimal 1" },
          { status: 400 }
        )
      }
    }

    const product = await prisma.produk.create({
      data: {
        nama,
        sku,
        category,
        pcs_per_karton: category === "Pack/Karton" ? Number(pack_per_karton) : 1,
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
    
    const { id, nama, sku, category, pack_per_karton, status } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID produk diperlukan" },
        { status: 400 }
      )
    }

    // ✅ Validasi pack_per_karton hanya untuk produk Pack/Karton
    if (category === "Pack/Karton" && pack_per_karton && pack_per_karton < 1) {
      return NextResponse.json(
        { error: "Jumlah pack per karton minimal 1" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (nama) updateData.nama = nama
    if (sku) updateData.sku = sku
    if (category) updateData.category = category
    if (status) updateData.status = status
    
    // ✅ Update pack_per_karton sesuai kategori
    if (category === "Pack/Karton" && pack_per_karton) {
      updateData.pcs_per_karton = Number(pack_per_karton)
    } else if (category === "Curah") {
      updateData.pcs_per_karton = 1  // Set default untuk curah
    }

    const product = await prisma.produk.update({
      where: { id: Number(id) },
      data: updateData,
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