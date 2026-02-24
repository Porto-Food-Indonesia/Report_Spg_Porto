// app/api/analytics/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ⭐ DISABLE CACHE - Agar data analytics selalu fresh
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Bulan lalu
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Total Penjualan Bulan Ini
    const salesThisMonth = await prisma.penjualan.aggregate({
      where: {
        tanggal: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    })

    // Total Penjualan Bulan Lalu
    const salesLastMonth = await prisma.penjualan.aggregate({
      where: {
        tanggal: {
          gte: new Date(lastMonthYear, lastMonth, 1),
          lt: new Date(lastMonthYear, lastMonth + 1, 1),
        },
      },
      _sum: {
        total: true,
      },
    })

    // Total SPG
    const totalSPG = await prisma.users.count({
      where: {
        role: 'spg',
      },
    })

    // SPG yang pernah melakukan penjualan bulan ini
    const activeSPG = await prisma.penjualan.groupBy({
      by: ['spg_id'],
      where: {
        tanggal: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    })

    // Hitung rata-rata penjualan per SPG
    const thisMonthTotal = Number(salesThisMonth._sum.total || 0)
    const avgSalesPerSPG = activeSPG.length > 0 ? Math.round(thisMonthTotal / activeSPG.length) : 0

    // Trend Penjualan 6 Bulan Terakhir
    const salesTrend = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1)
      const nextMonthDate = new Date(currentYear, currentMonth - i + 1, 1)
      
      const monthlySales = await prisma.penjualan.aggregate({
        where: {
          tanggal: {
            gte: monthDate,
            lt: nextMonthDate,
          },
        },
        _sum: {
          total: true,
        },
      })

      salesTrend.push({
        bulan: monthNames[monthDate.getMonth()],
        penjualan: Math.round(Number(monthlySales._sum.total || 0) / 1000000), // Dalam jutaan
      })
    }

    // Top 4 Produk Paling Laris
    const topProductsData = await prisma.penjualan.groupBy({
      by: ['produk_id'],
      where: {
        tanggal: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 4,
    })

    const topProducts = await Promise.all(
      topProductsData.map(async (item) => {
        const product = await prisma.produk.findUnique({
          where: { id: item.produk_id },
          select: { nama: true },
        })
        return {
          name: product?.nama || 'Unknown',
          nilai: Math.round(Number(item._sum.total || 0)),
        }
      })
    )

    // Top 4 SPG - Penjualan Terbanyak
    const topSPGData = await prisma.penjualan.groupBy({
      by: ['spg_id'],
      where: {
        tanggal: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 4,
    })

    const topSPG = await Promise.all(
      topSPGData.map(async (item, index) => {
        const spg = await prisma.users.findUnique({
          where: { id: item.spg_id },
          select: { nama: true },
        })
        return {
          rank: index + 1,
          nama: spg?.nama || 'Unknown',
          penjualan: Math.round(Number(item._sum.total || 0)),
        }
      })
    )

    const analytics = {
      totalSalesBulanIni: Math.round(thisMonthTotal),
      totalSPGAktif: activeSPG.length,
      rataRataPenjualanPerSPG: avgSalesPerSPG,
      totalTransaksi: salesThisMonth._count,
      topProducts,
      topSPG,
      salesTrend,
    }

    // ⭐ Return dengan cache headers
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}