import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * GET /api/stores
 * Mengambil daftar unik nama toko dari semua transaksi penjualan
 * Query params:
 * - spgId (optional): Filter toko berdasarkan SPG tertentu
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const spgId = searchParams.get("spgId")

    console.log("🏪 API /api/stores - START")
    console.log("📊 Params:", { spgId })

    // Build query filter
    const whereClause: any = {
      nama_toko_transaksi: {
        not: null,
      },
    }

    // Filter by SPG if provided
    if (spgId && spgId !== "semua") {
      whereClause.spg_id = Number(spgId)
      console.log(`🔍 Filtering stores by SPG ID: ${spgId}`)
    }

    // Ambil semua transaksi dengan nama toko yang tidak null
    const penjualan = await prisma.penjualan.findMany({
      where: whereClause,
      select: {
        nama_toko_transaksi: true,
      },
      distinct: ['nama_toko_transaksi'],
      orderBy: {
        nama_toko_transaksi: 'asc',
      },
    })

    // Extract dan filter nama toko yang valid
    const stores = penjualan
      .map(p => p.nama_toko_transaksi)
      .filter((name): name is string => {
        return name !== null && name !== undefined && name.trim() !== ""
      })
      .filter((name, index, self) => self.indexOf(name) === index) // Deduplicate
      .sort() // Sort alphabetically

    console.log(`✅ Found ${stores.length} unique stores`)
    console.log("🏪 Stores:", stores)

    return NextResponse.json(stores, {
      status: 200,
      headers: { 
        "Content-Type": "application/json"
      }
    })

  } catch (error) {
    console.error("❌ API Error /api/stores:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack")
    
    return NextResponse.json(
      { 
        error: "Gagal mengambil daftar toko",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
