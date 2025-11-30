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
      console.log("✅ getAllSalesReports returned:", typeof allReports, Array.isArray(allReports))
    } catch (dbError) {
      console.error("❌ Database error in getAllSalesReports:", dbError)
      return NextResponse.json([], { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // ✅ Validasi adalah array
    if (!Array.isArray(allReports)) {
      console.error("❌ getAllSalesReports tidak return array:", typeof allReports)
      return NextResponse.json([], { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let reports = allReports
    console.log(`✅ Found ${reports.length} sales records from database`)

    // Filter SPG
    if (spgId && spgId !== "semua") {
      console.log(`🔍 Filtering by SPG ID: "${spgId}"`)
      const beforeCount = reports.length
      
      reports = reports.filter((r) => {
        const reportSpgId = String(r.spg_id)
        const match = reportSpgId === spgId
        return match
      })
      
      console.log(`🔍 SPG Filter: ${beforeCount} → ${reports.length} records`)
    }

    // ✅ FIXED: Filter tanggal dengan format YYYY-MM-DD (tanpa waktu)
    if (startDate && endDate) {
      console.log(`📅 Date filter input: ${startDate} to ${endDate}`)
      
      const beforeCount = reports.length
      
      reports = reports.filter((r) => {
        // Ambil tanggal dari database (bisa Date object atau string)
        const recordDate = r.tanggal instanceof Date ? r.tanggal : new Date(r.tanggal)
        
        // Format ke YYYY-MM-DD untuk comparison (hapus waktu)
        const recordDateStr = recordDate.toISOString().split('T')[0]
        
        // Comparison menggunakan string (lebih reliable)
        const isInRange = recordDateStr >= startDate && recordDateStr <= endDate
        
        if (beforeCount <= 10) { // Log detail jika record sedikit
          console.log(`  📅 Record: ${recordDateStr} | Range: ${startDate} - ${endDate} | Match: ${isInRange}`)
        }
        
        return isInRange
      })
      
      console.log(`📅 Date Filter: ${beforeCount} → ${reports.length} records`)
    }

    // ✅ Transform data dengan field BARU
    const transformed = reports.map((r) => ({
      id: String(r.id),
      tanggal: r.tanggal instanceof Date ? r.tanggal.toISOString() : new Date(r.tanggal).toISOString(),
      spgId: String(r.spg_id),
      spgNama: r.user?.nama || "Unknown",
      produk: r.produk?.nama || "Unknown",
      produkId: r.produk_id || 0,
      produkPcsPerKarton: r.produk?.pcs_per_karton || 1,
      penjualanKarton: Number(r.penjualan_karton || 0),
      penjualanPcs: Number(r.penjualan_pcs || 0),
      hargaKarton: Number(r.harga_karton || 0),
      hargaPcs: Number(r.harga_pcs || 0),
      total: Number(r.total || 0),
      toko: r.nama_toko_transaksi || "Unknown",
    }))

    console.log(`✅ Returning ${transformed.length} transformed records`)

    return NextResponse.json(transformed, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error("❌ API Error (OUTER CATCH):", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack")
    
    return NextResponse.json([], {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}