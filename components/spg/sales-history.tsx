"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Edit2, X, Save, AlertCircle, TrendingUp, TrendingDown, Calendar, BarChart3, LineChart, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface SalesData {
  id: string
  tanggal: string
  produk: string
  produkId: number
  produkPcsPerKarton: number
  penjualanKarton: number
  penjualanPcs: number
  penjualanGram: number // untuk produk curah
  hargaKarton: number
  hargaPcs: number
  stockPack: number // stock pack tersisa
  stockKarton: number // stock karton tersisa
  namaTokoTransaksi: string
  total: number
  category: string // Pack/Karton atau Curah
  notes: string
}

interface SalesHistoryProps {
  theme: "dark" | "light"
}

type TimeFilter = "daily" | "weekly" | "monthly" | "yearly"
type ChartView = "line" | "bar"

export default function SalesHistory({ theme }: SalesHistoryProps) {
  const { user, isLoading } = useAuth()
  const isDark = theme === 'dark'

  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    totalPcs: "",
    hargaKarton: "",
    hargaPcs: "",
    stockPack: "",
    stockKarton: "",
    namaTokoTransaksi: "",
    notes: "",
  })
  const [editResult, setEditResult] = useState<{ karton: number; sisaPcs: number; total: number } | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Chart states
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("daily")
  const [chartView, setChartView] = useState<ChartView>("line")
  const [showChart, setShowChart] = useState(true)

  // ✅ Fetch data hanya setelah user siap
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

      const response = await fetch(`/api/sales/list?${params.toString()}`)
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

  // ✅ Process chart data based on time filter
  const getChartData = () => {
    if (salesData.length === 0) return []

    const groupedData: { [key: string]: number } = {}

    salesData.forEach(sale => {
      const date = new Date(sale.tanggal)
      let key = ""

      switch (timeFilter) {
        case "daily":
          key = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
          break
        case "weekly":
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = `W${Math.ceil((date.getDate()) / 7)} ${date.toLocaleDateString("id-ID", { month: "short" })}`
          break
        case "monthly":
          key = date.toLocaleDateString("id-ID", { month: "short", year: "numeric" })
          break
        case "yearly":
          key = date.getFullYear().toString()
          break
      }

      groupedData[key] = (groupedData[key] || 0) + sale.total
    })

    return Object.entries(groupedData).map(([label, value]) => ({ label, value }))
  }

  const chartData = getChartData()
  const maxValue = Math.max(...chartData.map(d => d.value), 1)

  // Calculate stats
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0)
  const avgRevenue = salesData.length > 0 ? totalRevenue / salesData.length : 0
  const highestSale = Math.max(...salesData.map(s => s.total), 0)
  const lowestSale = salesData.length > 0 ? Math.min(...salesData.map(s => s.total)) : 0

  // Calculate trend (compare last half vs first half)
  const midPoint = Math.floor(salesData.length / 2)
  const firstHalfTotal = salesData.slice(0, midPoint).reduce((sum, s) => sum + s.total, 0)
  const secondHalfTotal = salesData.slice(midPoint).reduce((sum, s) => sum + s.total, 0)
  const trend = secondHalfTotal > firstHalfTotal ? "up" : secondHalfTotal < firstHalfTotal ? "down" : "stable"

  // ✅ Batasi edit hanya H+2
  const canEdit = (tanggal: string): boolean => {
    const salesDate = new Date(tanggal)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    salesDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((today.getTime() - salesDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 2
  }

  // ✅ Mode edit
  const handleEdit = (row: SalesData) => {
    if (!canEdit(row.tanggal)) {
      setError("Laporan hanya bisa diedit maksimal 2 hari setelah tanggal transaksi")
      return
    }

    const totalPcs = (row.penjualanKarton * row.produkPcsPerKarton) + row.penjualanPcs
    setEditingId(row.id)
    setEditForm({
      totalPcs: String(totalPcs),
      hargaKarton: String(row.hargaKarton),
      hargaPcs: String(row.hargaPcs),
      stockPack: String(row.stockPack),
      stockKarton: String(row.stockKarton),
      namaTokoTransaksi: row.namaTokoTransaksi,
      notes: row.notes,
    })
    setError("")
  }

  // ✅ Auto hitung preview hasil edit
  useEffect(() => {
    if (editingId) {
      const row = salesData.find(r => r.id === editingId)
      if (!row) return
      const totalPcs = Number(editForm.totalPcs)
      const hargaKarton = Number(editForm.hargaKarton)
      const hargaPcs = Number(editForm.hargaPcs)
      const pcsPerKarton = row.produkPcsPerKarton

      if (totalPcs > 0 && hargaKarton > 0 && hargaPcs > 0 && pcsPerKarton > 0) {
        const karton = Math.floor(totalPcs / pcsPerKarton)
        const sisaPcs = totalPcs % pcsPerKarton
        const total = (karton * hargaKarton) + (sisaPcs * hargaPcs)
        setEditResult({ karton, sisaPcs, total })
      } else {
        setEditResult(null)
      }
    }
  }, [editForm, editingId, salesData])

  // ✅ Simpan hasil edit
  const handleSave = async () => {
    if (!editingId || !editResult) return

    try {
      setSaving(true)
      setError("")

      const response = await fetch(`/api/sales/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          totalPcs: Number(editForm.totalPcs),
          hargaKarton: Number(editForm.hargaKarton),
          hargaPcs: Number(editForm.hargaPcs),
          stockPack: Number(editForm.stockPack),
          stockKarton: Number(editForm.stockKarton),
          namaTokoTransaksi: editForm.namaTokoTransaksi,
          notes: editForm.notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal mengupdate laporan")
      }

      await fetchSalesHistory()
      setEditingId(null)
      setEditResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditResult(null)
    setError("")
  }

  // Theme classes
  const cardBg = isDark ? "bg-slate-800/50 backdrop-blur border-slate-700" : "bg-white/80 backdrop-blur border-slate-200"
  const textClass = isDark ? "text-slate-100" : "text-slate-900"
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600"
  const borderClass = isDark ? "border-slate-700" : "border-slate-200"
  const hoverBg = isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
  const inputBg = isDark ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-200"
  const statBg = isDark ? "bg-slate-700/50" : "bg-slate-50"

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <Card className={`border-0 shadow-lg ${cardBg}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
            <div className={`h-8 w-20 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
            <div className={`h-3 w-16 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
          </div>
          <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
        </div>
      </CardContent>
    </Card>
  )

  const SkeletonChart = () => (
    <Card className={`border-0 shadow-xl ${cardBg}`}>
      <CardHeader>
        <div className="space-y-2">
          <div className={`h-6 w-40 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
          <div className={`h-4 w-64 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end gap-2">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-t-lg ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`}
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const SkeletonTable = () => (
    <Card className={`border-0 shadow-xl ${cardBg}`}>
      <CardHeader>
        <div className="space-y-2">
          <div className={`h-6 w-48 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
          <div className={`h-4 w-72 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className={`h-12 flex-1 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // ✅ Tampilan kondisi user/loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        {/* Skeleton Chart */}
        <SkeletonChart />
        {/* Skeleton Table */}
        <SkeletonTable />
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`text-center py-20 ${textSecondary}`}>
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} flex items-center justify-center`}>
          <AlertCircle className="w-8 h-8" />
        </div>
        <p className={`text-lg font-semibold ${textClass} mb-2`}>Sesi Berakhir</p>
        <p className={textSecondary}>Silakan login kembali untuk melanjutkan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {salesData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${textSecondary}`}>Total Penjualan</p>
                  <p className={`text-2xl font-bold ${textClass}`}>
                    {salesData.length}
                  </p>
                  <p className={`text-xs ${textSecondary} mt-1`}>transaksi</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${textSecondary}`}>Total Revenue</p>
                  <p className={`text-2xl font-bold ${textClass}`}>
                    Rp {(totalRevenue / 1000000).toFixed(1)}M
                  </p>
                  <p className={`text-xs ${textSecondary} mt-1`}>30 hari terakhir</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${textSecondary}`}>Rata-rata</p>
                  <p className={`text-2xl font-bold ${textClass}`}>
                    Rp {(avgRevenue / 1000).toFixed(0)}K
                  </p>
                  <p className={`text-xs ${textSecondary} mt-1`}>per transaksi</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <LineChart className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${textSecondary}`}>Trend</p>
                  <p className={`text-2xl font-bold ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : textClass}`}>
                    {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
                  </p>
                  <p className={`text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : textSecondary} mt-1`}>
                    {trend === 'up' ? 'Naik' : trend === 'down' ? 'Turun' : 'Stabil'}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${trend === 'up' ? 'from-green-500 to-emerald-600' : trend === 'down' ? 'from-red-500 to-orange-600' : 'from-amber-500 to-yellow-600'} rounded-xl flex items-center justify-center shadow-lg`}>
                  {trend === 'up' ? <TrendingUp className="w-6 h-6 text-white" /> : <TrendingDown className="w-6 h-6 text-white" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Section */}
      {salesData.length > 0 && (
        <Card className={`border-0 shadow-xl ${cardBg}`}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className={`flex items-center gap-2 ${textClass}`}>
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Grafik Penjualan
                </CardTitle>
                <CardDescription className={textSecondary}>
                  Visualisasi performa penjualan Anda
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Toggle Chart View */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChart(!showChart)}
                  className={hoverBg}
                  title={showChart ? "Sembunyikan Grafik" : "Tampilkan Grafik"}
                >
                  {showChart ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>

                {/* Time Filter */}
                <div className={`flex gap-1 p-1 rounded-lg ${statBg}`}>
                  {[
                    { value: "daily", label: "Harian" },
                    { value: "weekly", label: "Mingguan" },
                    { value: "monthly", label: "Bulanan" },
                    { value: "yearly", label: "Tahunan" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setTimeFilter(filter.value as TimeFilter)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        timeFilter === filter.value
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : `${textSecondary} ${hoverBg}`
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          {showChart && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Chart */}
                <div className="h-64 flex items-end gap-2 px-4">
                  {chartData.map((data, index) => {
                    const height = (data.value / maxValue) * 100
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full group">
                          {/* Tooltip */}
                          <div className={`absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-slate-700' : 'bg-slate-800'} text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap z-10`}>
                            Rp {data.value.toLocaleString("id-ID")}
                          </div>
                          
                          {/* Bar */}
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              chartView === "bar"
                                ? "bg-gradient-to-t from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                                : "bg-gradient-to-t from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                            } shadow-lg cursor-pointer`}
                            style={{ height: `${height}%`, minHeight: "4px" }}
                          />
                        </div>
                        <span className={`text-xs ${textSecondary} truncate max-w-full`}>
                          {data.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className={`flex items-center justify-center gap-6 text-sm pt-4 border-t ${borderClass}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-600 to-purple-600" />
                    <span className={textSecondary}>Total Penjualan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className={textSecondary}>
                      {timeFilter === "daily" ? "Per Hari" : 
                       timeFilter === "weekly" ? "Per Minggu" : 
                       timeFilter === "monthly" ? "Per Bulan" : "Per Tahun"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Table Section */}
      <Card className={`border-0 shadow-xl ${cardBg}`}>
        <CardHeader>
          <CardTitle className={textClass}>Riwayat Transaksi</CardTitle>
          <CardDescription className={textSecondary}>
            📝 Semua riwayat penjualan Anda dalam 30 hari terakhir
            <br />
            <span className="text-blue-500 font-medium">✏️ Bisa edit transaksi maksimal 2 hari setelah tanggal transaksi</span>
            {salesData.length > 0 && (
              <span className="ml-2 text-sm font-medium text-blue-600">
                • {salesData.length} transaksi
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className={`mb-4 p-3 ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-100 border-red-300'} border rounded text-red-${isDark ? '400' : '700'} text-sm flex items-center gap-2`}>
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`p-4 rounded-lg ${statBg} animate-pulse`}>
                  <div className="flex gap-4 items-center">
                    <div className={`h-10 w-20 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className={`h-10 flex-1 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className={`h-10 w-16 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className={`h-10 w-16 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className={`h-10 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className={`h-10 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className={`h-10 w-32 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className={`h-10 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className={`h-10 w-10 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : salesData.length === 0 ? (
            <div className={`text-center py-8 ${textSecondary}`}>
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada data penjualan dalam 30 hari terakhir.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderClass} ${statBg} text-xs font-medium ${textSecondary}`}>
                    <th className="px-3 py-3 text-left">Tanggal</th>
                    <th className="px-3 py-3 text-left">Produk</th>
                    <th className="px-3 py-3 text-center">Kategori</th>
                    <th className="px-3 py-3 text-center">Karton Terjual</th>
                    <th className="px-3 py-3 text-center">Pack Terjual</th>
                    <th className="px-3 py-3 text-right">Harga/Karton</th>
                    <th className="px-3 py-3 text-right">Harga/Pack</th>
                    <th className="px-3 py-3 text-center">Stock Pack</th>
                    <th className="px-3 py-3 text-center">Stock Karton</th>
                    <th className="px-3 py-3 text-left">Toko</th>
                    <th className="px-3 py-3 text-left">Catatan</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {salesData.map((row) => (
                    <tr key={row.id} className={`border-b ${borderClass} ${hoverBg} transition-colors`}>
                      {editingId === row.id ? (
                        <td colSpan={13} className={`px-3 py-3 text-xs ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                          <div className="space-y-3 p-3 rounded-lg">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div>
                                <Label className={`text-xs ${textClass}`}>Total Pcs Terjual</Label>
                                <Input
                                  type="number"
                                  value={editForm.totalPcs}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, totalPcs: e.target.value })
                                  }
                                  className={`h-9 text-sm ${inputBg}`}
                                />
                              </div>
                              <div>
                                <Label className={`text-xs ${textClass}`}>Harga per Karton</Label>
                                <Input
                                  type="number"
                                  value={editForm.hargaKarton}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, hargaKarton: e.target.value })
                                  }
                                  className={`h-9 text-sm ${inputBg}`}
                                />
                              </div>
                              <div>
                                <Label className={`text-xs ${textClass}`}>Harga per Pack</Label>
                                <Input
                                  type="number"
                                  value={editForm.hargaPcs}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, hargaPcs: e.target.value })
                                  }
                                  className={`h-9 text-sm ${inputBg}`}
                                />
                              </div>
                              <div>
                                <Label className={`text-xs ${textClass}`}>Stock Pack</Label>
                                <Input
                                  type="number"
                                  value={editForm.stockPack}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, stockPack: e.target.value })
                                  }
                                  className={`h-9 text-sm ${inputBg}`}
                                />
                              </div>
                              <div>
                                <Label className={`text-xs ${textClass}`}>Stock Karton</Label>
                                <Input
                                  type="number"
                                  value={editForm.stockKarton}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, stockKarton: e.target.value })
                                  }
                                  className={`h-9 text-sm ${inputBg}`}
                                />
                              </div>
                              <div>
                                <Label className={`text-xs ${textClass}`}>Nama Toko</Label>
                                <Input
                                  value={editForm.namaTokoTransaksi}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      namaTokoTransaksi: e.target.value,
                                    })
                                  }
                                  className={`h-9 text-sm ${inputBg}`}
                                />
                              </div>
                              <div className="sm:col-span-2 lg:col-span-3">
                                <Label className={`text-xs ${textClass}`}>Catatan (Opsional)</Label>
                                <Input
                                  value={editForm.notes}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      notes: e.target.value,
                                    })
                                  }
                                  className={`h-9 text-sm ${inputBg}`}
                                  placeholder="Tambahkan catatan..."
                                />
                              </div>
                            </div>

                            {editResult && (
                              <div className={`text-xs ${isDark ? 'bg-slate-700' : 'bg-white'} p-3 rounded-lg flex justify-between items-center ${borderClass} border`}>
                                <span className={textClass}>
                                  <strong>Preview:</strong>{" "}
                                  {editResult.karton} karton + {editResult.sisaPcs} pcs
                                </span>
                                <strong className="text-green-500 text-base">
                                  Rp {editResult.total.toLocaleString("id-ID")}
                                </strong>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={saving || !editResult}
                                className="h-9 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                              >
                                {saving ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                ) : (
                                  <Save className="w-4 h-4 mr-1" />
                                )}
                                Simpan
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={saving}
                                className={`h-9 ${isDark ? 'border-slate-600 hover:bg-slate-700' : ''}`}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Batal
                              </Button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className={`px-3 py-3 text-xs font-medium ${textClass}`}>
                            {new Date(row.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className={`px-3 py-3 text-xs ${textClass}`}>{row.produk}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              row.category === "Curah" 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}>
                              {row.category}
                            </span>
                          </td>
                          <td className={`px-3 py-3 text-xs text-center ${textClass}`}>
                            {row.category === "Curah" ? (
                              <span className={textSecondary}>-</span>
                            ) : (
                              <span className="font-semibold">{row.penjualanKarton}</span>
                            )}
                          </td>
                          <td className={`px-3 py-3 text-xs text-center ${textClass}`}>
                            {row.category === "Curah" ? (
                              <span className="font-semibold text-green-600">{row.penjualanGram}g</span>
                            ) : (
                              <span className="font-semibold">{row.penjualanPcs}</span>
                            )}
                          </td>
                          <td className={`px-3 py-3 text-xs text-right ${textSecondary}`}>
                            {row.category === "Curah" ? (
                              <span className={textSecondary}>-</span>
                            ) : (
                              `Rp ${row.hargaKarton.toLocaleString("id-ID")}`
                            )}
                          </td>
                          <td className={`px-3 py-3 text-xs text-right ${textSecondary}`}>
                            {row.category === "Curah" ? (
                              <span className={textSecondary}>-</span>
                            ) : (
                              `Rp ${row.hargaPcs.toLocaleString("id-ID")}`
                            )}
                          </td>
                          <td className={`px-3 py-3 text-xs text-center`}>
                            {row.category === "Curah" ? (
                              <span className={textSecondary}>-</span>
                            ) : (
                              <span className={`font-medium ${row.stockPack < 10 ? 'text-red-500' : 'text-amber-600'}`}>
                                {row.stockPack}
                              </span>
                            )}
                          </td>
                          <td className={`px-3 py-3 text-xs text-center`}>
                            {row.category === "Curah" ? (
                              <span className={textSecondary}>-</span>
                            ) : (
                              <span className={`font-medium ${row.stockKarton < 5 ? 'text-red-500' : 'text-amber-600'}`}>
                                {row.stockKarton}
                              </span>
                            )}
                          </td>
                          <td className={`px-3 py-3 text-xs ${textClass} max-w-[150px] truncate`}>
                            {row.namaTokoTransaksi}
                          </td>
                          <td className={`px-3 py-3 text-xs ${textSecondary} max-w-[150px]`}>
                            {row.notes ? (
                              <span className="truncate block" title={row.notes}>
                                {row.notes}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-right font-semibold">
                            <span className="text-green-600">
                              Rp {row.total.toLocaleString("id-ID")}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {canEdit(row.tanggal) ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(row)}
                                className={`h-8 w-8 p-0 ${hoverBg}`}
                                title="Edit transaksi"
                              >
                                <Edit2 className="w-4 h-4 text-blue-500" />
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400" title="Tidak bisa edit (>2 hari)">🔒</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}