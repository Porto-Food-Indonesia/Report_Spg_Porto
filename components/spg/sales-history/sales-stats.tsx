"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, TrendingDown, Calendar, LineChart, Eye, EyeOff } from "lucide-react"

interface SalesData {
  id: string
  tanggal: string
  total: number
  category: string
}

interface SalesStatsProps {
  salesData: SalesData[]
  theme: "dark" | "light"
  timeFilter: TimeFilter
  setTimeFilter: (filter: TimeFilter) => void
  showChart: boolean
  setShowChart: (show: boolean) => void
}

type TimeFilter = "daily" | "weekly" | "monthly" | "yearly"

export default function SalesStats({ 
  salesData, 
  theme, 
  timeFilter, 
  setTimeFilter,
  showChart,
  setShowChart
}: SalesStatsProps) {
  const isDark = theme === 'dark'

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

  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0)
  const avgRevenue = salesData.length > 0 ? totalRevenue / salesData.length : 0

  const midPoint = Math.floor(salesData.length / 2)
  const firstHalfTotal = salesData.slice(0, midPoint).reduce((sum, s) => sum + s.total, 0)
  const secondHalfTotal = salesData.slice(midPoint).reduce((sum, s) => sum + s.total, 0)
  const trend = secondHalfTotal > firstHalfTotal ? "up" : secondHalfTotal < firstHalfTotal ? "down" : "stable"

  const cardBg = isDark ? "bg-slate-800/50 backdrop-blur border-slate-700" : "bg-white/80 backdrop-blur border-slate-200"
  const textClass = isDark ? "text-slate-100" : "text-slate-900"
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600"
  const borderClass = isDark ? "border-slate-700" : "border-slate-200"
  const hoverBg = isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
  const statBg = isDark ? "bg-slate-700/50" : "bg-slate-50"

  if (salesData.length === 0) return null

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${textSecondary}`}>Total Pack Terjual</p>
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
                <p className={`text-xs ${textSecondary}`}>Total Penjualan</p>
                <p className={`text-2xl font-bold ${textClass}`}>
                  Rp {(totalRevenue / 1000000).toFixed(1)}Jt
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

      {/* Chart Section */}
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChart(!showChart)}
                className={hoverBg}
                title={showChart ? "Sembunyikan Grafik" : "Tampilkan Grafik"}
              >
                {showChart ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

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
              <div className="h-64 flex items-end gap-2 px-4 overflow-x-auto">
                {chartData.map((data, index) => {
                  const height = (data.value / maxValue) * 100
                  return (
                    <div key={index} className="flex-1 min-w-[40px] flex flex-col items-center gap-2">
                      <div className="relative w-full group">
                        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-slate-700' : 'bg-slate-800'} text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap z-10`}>
                          Rp {data.value.toLocaleString("id-ID")}
                        </div>
                        
                        <div
                          className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg cursor-pointer"
                          style={{ height: `${height}%`, minHeight: "4px" }}
                        />
                      </div>
                      <span className={`text-xs ${textSecondary} truncate max-w-full text-center`}>
                        {data.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className={`flex items-center justify-center gap-6 text-sm pt-4 border-t ${borderClass} flex-wrap`}>
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
    </>
  )
}

export type { TimeFilter }