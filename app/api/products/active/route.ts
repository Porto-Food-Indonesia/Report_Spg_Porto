import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  console.log("✅ /api/products/active route dipanggil!")

  try {
    const products = await prisma.produk.findMany({
      where: { status: "Aktif" },
      orderBy: { id: "asc" },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error("[GET /products/active] Error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil produk aktif" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
