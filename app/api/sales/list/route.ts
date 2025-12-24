import { NextResponse } from "next/server"
import { getAllSalesReports } from "@/lib/db-utils"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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

    // 🔥 AMBIL DATA STOK SPG UNTUK SETIAP PRODUK
    const stokData: Record<string, any> = {}
    
    if (spgId && spgId !== "semua") {
      try {
        const stokRecords = await prisma.stok_spg.findMany({
          where: {
            spg_id: Number(spgId)
          },
          include: {
            produk: true
          }
        })
        
        // Map stok by produk_id untuk akses cepat
        stokRecords.forEach(stok => {
          stokData[stok.produk_id] = {
            stokKarton: Number(stok.stok_karton || 0),
            stokPcs: Number(stok.stok_pcs || 0),
            stokGram: Number(stok.stok_gram || 0),
          }
        })
        
        console.log(`📦 Loaded stock data for ${Object.keys(stokData).length} products`)
      } catch (stokError) {
        console.error("❌ Error loading stock data:", stokError)
      }
    }

    // ✅ TRANSFORM DATA (FULL + FIELD CURAH & PACK/KARTON + STOK)
    const transformed = reports.map((r) => {
      const produkCategory = r.produk?.category || "Pack/Karton"
      const isCurah = produkCategory === "Curah"
      const produkId = r.produk_id
      
      // Ambil stok untuk produk ini
      const stok = stokData[produkId] || {
        stokKarton: 0,
        stokPcs: 0,
        stokGram: 0
      }
      
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
        produkId: String(produkId),
        produkCategory: produkCategory,
        produkPcsPerKarton: r.produk?.pcs_per_karton || 1,

        // 🟦 DATA PACK/KARTON (untuk produk non-curah)
        penjualanKarton: Number(r.penjualan_karton || 0),
        penjualanPcs: Number(r.penjualan_pcs || 0),
        hargaKarton: Number(r.harga_karton || 0),
        hargaPcs: Number(r.harga_pcs || 0), // Untuk pack ATAU per gram (curah)

        // 🟩 DATA CURAH (untuk produk curah, harga tetap di harga_pcs)
        penjualanGram: Number(r.penjualan_gram || 0),

        // 📦 DATA STOK SAAT INI (gunakan nama field yang sama dengan component)
        stockKarton: stok.stokKarton, // Component pakai 'stockKarton'
        stockPack: stok.stokPcs,      // Component pakai 'stockPack'
        stokGram: stok.stokGram,

        // 💰 TOTAL (untuk semua jenis produk)
        total: Number(r.total || 0),
        
        toko: r.nama_toko_transaksi || "UNKNOWN",
        notes: r.notes || "",
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
  } finally {
    await prisma.$disconnect()
  }
}