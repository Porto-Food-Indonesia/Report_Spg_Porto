import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface DeleteMultipleRequest {
  ids: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body: DeleteMultipleRequest = await request.json()
    const { ids } = body

    console.log("🗑️ DELETE MULTIPLE - Received IDs:", ids)

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required and must not be empty" },
        { status: 400 }
      )
    }

    // Convert string IDs to numbers
    const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id))

    if (numericIds.length === 0) {
      return NextResponse.json(
        { error: "No valid IDs provided" },
        { status: 400 }
      )
    }

    console.log("🔢 Converted to numeric IDs:", numericIds)

    // Delete multiple records
    const result = await prisma.penjualan.deleteMany({
      where: {
        id: { in: numericIds }
      }
    })

    console.log(`✅ Deleted ${result.count} sales records`)

    return NextResponse.json(
      {
        success: true,
        message: `${result.count} data berhasil dihapus`,
        deletedCount: result.count
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("❌ Error deleting multiple sales:", error)
    return NextResponse.json(
      { 
        error: "Failed to delete sales data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}