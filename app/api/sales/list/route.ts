import { NextResponse } from "next/server"
import { getAllSalesReports } from "@/lib/db-utils"

export async function GET(request: Request) {
  try {
    console.log("🚀 API /api/sales/list - START")
    
    const { searchParams } = new URL(request.url)
    const spgId = searchParams.get("spgId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    console.log("📊 Received params:", { spgId, startDate, endDate })

    // ⚡ Pastikan await dan catch error
    let allReports
    try {
      allReports = await getAllSalesReports()
      console.log(
        "✅ getAllSalesReports returned:",
        typeof allReports,
        Array.isArray(allReports)
      )
    } catch (dbError) {
      console.error("❌ Database error in getAllSalesReports:", dbError)
      return NextResponse.json([], { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    // ✅ Validasi adalah array
    if (!Array.isArray(allReports)) {
      console.error(
        "❌ getAllSalesReports tidak return array:",
        typeof allReports
      )
      return NextResponse.json([], { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    let reports = allReports
    console.log(
      `✅ Found ${reports.length} sales records from database`
    )

    // 🔍 Filter SPG
    if (spgId && spgId !== "semua") {
      console.log(`🔍 Filtering by SPG ID: "${spgId}"`)
      const beforeCount = reports.length
      
      reports = reports.filter((r) => {
        const reportSpgId = String(r.spg_id)
        const match = reportSpgId === spgId

        if (!match) {
          console.log(
            `  ❌ No match: "${reportSpgId}" !== "${spgId}"`
          )
        } else {
          console.log(
            `  ✅ Match found: "${reportSpgId}" === "${spgId}"`
          )
        }
        return match
      })
      
      console.log(
        `🔍 SPG Filter: ${beforeCount} → ${reports.length} records`
      )
    }

    // 📅 Filter tanggal transaksi
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      
      const beforeCount = reports.length
      reports = reports.filter((r) => {
        const date = new Date(r.tanggal)
        return date >= start && date <= end
      })

      console.log(
        `📅 Date Filter: ${beforeCount} → ${reports.length} records`
      )
    }

    // ✅ TRANSFORM DATA (FULL + FIELD CURAH & PACK/KARTON)
    const transformed = reports.map((r) => {
      const produkCategory = r.produk?.category || "Pack/Karton"
      const isCurah = produkCategory === "Curah"
      
      return {
        id: String(r.id),

        // 🟢 TANGGAL INPUT (UNTUK EXCEL)
        created_at: r.created_at
          ? r.created_at.toISOString()
          : null,

        // 🟢 TANGGAL TRANSAKSI
        tanggal: r.tanggal
          ? r.tanggal.toISOString()
          : null,

        spgId: String(r.spg_id),
        spgNama: r.user?.nama || "UNKNOWN",

        produk: r.produk?.nama || "UNKNOWN",
        produkCategory: produkCategory,
        produkPcsPerKarton: r.produk?.pcs_per_karton || 1,

        // 🟦 DATA PACK/KARTON (untuk produk non-curah)
        penjualanKarton: Number(r.penjualan_karton || 0),
        penjualanPcs: Number(r.penjualan_pcs || 0),
        hargaKarton: Number(r.harga_karton || 0),
        hargaPcs: Number(r.harga_pcs || 0), // Untuk pack ATAU per gram (curah)

        // 🟩 DATA CURAH (untuk produk curah, harga tetap di harga_pcs)
        penjualanGram: Number(r.penjualan_gram || 0),

        // 💰 TOTAL (untuk semua jenis produk)
        total: Number(r.total || 0),
        
        toko: r.nama_toko_transaksi || "UNKNOWN",
      }
    })

    console.log(
      `✅ Returning ${transformed.length} transformed records`
    )
    console.log(
      `📊 Sample data (first record):`,
      transformed[0] ? JSON.stringify(transformed[0], null, 2) : "No data"
    )

    return NextResponse.json(transformed, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
    
  } catch (error) {
    console.error("❌ API Error (OUTER CATCH):", error)
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    )
    
    return NextResponse.json([], {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  }
}