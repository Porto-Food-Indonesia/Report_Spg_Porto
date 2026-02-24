import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ⭐ DISABLE CACHE
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('=== GET /products/list ===')
    
    const products = await prisma.produk.findMany({
      orderBy: { id: "asc" },
    })
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error("[GET /products/list] Error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil produk" },
      { status: 500 }
    )
  }
}