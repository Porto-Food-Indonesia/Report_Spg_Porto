"use client"

import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import SalesStats, { TimeFilter } from "./sales-history/sales-stats"
import SalesTable from "./sales-history/sales-table"

interface SalesData {
  id: string
  tanggal: string
  produk: string
  produkId: number
  produkPcsPerKarton: number
  penjualanKarton: number
  penjualanPcs: number
  penjualanGram: number
  hargaKarton: number
  hargaPcs: number
  stockPack: number
  stockKarton: number
  namaTokoTransaksi: string
  total: number
  category: string
  notes: string
  createdAt: string
}

interface SalesHistoryProps {
  theme: "dark" | "light"
}

export default function SalesHistory({ theme }: SalesHistoryProps) {
  const { user, isLoading } = useAuth()
  const isDark = theme === 'dark'

  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("daily")
  const [showChart, setShowChart] = useState(true)

  useEffect(() => {
    if (!user || !user.id || isLoading) return
    fetchSalesHistory()
  }, [user, isLoading])

  const fetchSalesHistory = async () => {
    try {
      setLoading(true)
      setError("")

      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const params = new URLSearchParams({
        startDate: thirtyDaysAgo.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        spgId: user!.id.toString(),
      })

      // ✅ FIX: Tambah cache: 'no-store' agar data selalu fresh
      const response = await fetch(`/api/sales/list?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (!response.ok) throw new Error("Gagal mengambil data penjualan")

      const data = await response.json()
      if (Array.isArray(data)) {
        const transformed = data.map((item: any) => ({
          id: item.id,
          tanggal: item.tanggal,
          produk: item.produk,
          produkId: item.produkId || 0,
          produkPcsPerKarton: item.produkPcsPerKarton || 1,
          penjualanKarton: item.penjualanKarton || 0,
          penjualanPcs: item.penjualanPcs || 0,
          penjualanGram: item.penjualanGram || 0,
          hargaKarton: item.hargaKarton || 0,
          hargaPcs: item.hargaPcs || 0,
          stockPack: item.stockPack || 0,
          stockKarton: item.stockKarton || 0,
          namaTokoTransaksi: item.toko || item.namaTokoTransaksi || "",
          total: item.total || 0,
          category: item.category || "Pack/Karton",
          notes: item.notes || "",
          createdAt: item.created_at || item.tanggal,  // ✅ FIX: snake_case
        }))
        setSalesData(transformed)
      } else {
        setSalesData([])
        setError("Format data tidak valid")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data")
      setSalesData([])
    } finally {
      setLoading(false)
    }
  }

  const cardBg = isDark ? "bg-slate-800/50 backdrop-blur border-slate-700" : "bg-white/80 backdrop-blur border-slate-200"
  const textClass = isDark ? "text-slate-100" : "text-slate-900"
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600"

  const SkeletonCard = () => (
    <div className={`border-0 shadow-lg ${cardBg} rounded-lg`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
            <div className={`h-8 w-20 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
            <div className={`h-3 w-16 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
          </div>
          <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
        </div>
      </div>
    </div>
  )

  const SkeletonChart = () => (
    <div className={`border-0 shadow-xl ${cardBg} rounded-lg`}>
      <div className="p-6">
        <div className="space-y-2 mb-6">
          <div className={`h-6 w-40 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
          <div className={`h-4 w-64 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
        </div>
        <div className="h-64 flex items-end gap-2">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-t-lg ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`}
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )

  const SkeletonTable = () => (
    <div className={`border-0 shadow-xl ${cardBg} rounded-lg`}>
      <div className="p-6">
        <div className="space-y-2 mb-6">
          <div className={`h-6 w-48 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
          <div className={`h-4 w-72 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className={`h-12 flex-1 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonChart />
        <SkeletonTable />
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`text-center py-20 px-4 ${textSecondary}`}>
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} flex items-center justify-center`}>
          <AlertCircle className="w-8 h-8" />
        </div>
        <p className={`text-lg font-semibold ${textClass} mb-2`}>Sesi Berakhir</p>
        <p className={textSecondary}>Silakan login kembali untuk melanjutkan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <SalesStats 
        salesData={salesData}
        theme={theme}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        showChart={showChart}
        setShowChart={setShowChart}
      />

      <SalesTable 
        salesData={salesData}
        loading={loading}
        error={error}
        theme={theme}
        onRefresh={fetchSalesHistory}
      />
    </div>
  )
}