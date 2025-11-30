import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('=== GET /products/list ===')
    
    const products = await prisma.produk.findMany({
      orderBy: { id: "asc" },
    })
    
    return NextResponse.json(products)
  } catch (error) {
    console.error("[GET /products/list] Error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil produk" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}