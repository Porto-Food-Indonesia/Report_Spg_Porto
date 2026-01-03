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
  timeFilter?: TimeFilter
  setTimeFilter?: (filter: TimeFilter) => void
  showChart?: boolean
  setShowChart?: (show: boolean) => void
}

type TimeFilter = "daily" | "weekly" | "monthly" | "yearly"

export default function SalesStats({ 
  salesData, 
  theme, 
  timeFilter = "daily", 
  setTimeFilter = () => {},
  showChart = true,
  setShowChart = () => {}
}: SalesStatsProps) {
  const isDark = theme === 'dark'

  console.log('📊 SalesStats Debug:', {
    dataLength: salesData.length,
    showChart,
    timeFilter,
    sampleData: salesData.slice(0, 2)
  })

  const getChartData = () => {
    if (salesData.length === 0) {
      console.log('⚠️ No sales data available')
      return []
    }

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

    const result = Object.entries(groupedData).map(([label, value]) => ({ label, value }))
    console.log('📈 Chart Data:', result)
    return result
  }

  const chartData = getChartData()
  const maxValue = Math.max(...chartData.map(d => d.value), 1)

  console.log('📊 Max Value:', maxValue, 'Chart Items:', chartData.length)

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
      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${textSecondary} mb-1`}>Total Transaksi</p>
                <p className={`text-xl sm:text-2xl font-bold ${textClass} truncate`}>
                  {salesData.length}
                </p>
                <p className={`text-xs ${textSecondary} mt-1`}>transaksi</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ml-2">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${textSecondary} mb-1`}>Total Penjualan</p>
                <p className={`text-xl sm:text-2xl font-bold ${textClass} truncate`}>
                  Rp {(totalRevenue / 1000000).toFixed(1)}Jt
                </p>
                <p className={`text-xs ${textSecondary} mt-1`}>30 hari terakhir</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ml-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${textSecondary} mb-1`}>Rata-rata</p>
                <p className={`text-xl sm:text-2xl font-bold ${textClass} truncate`}>
                  Rp {(avgRevenue / 1000).toFixed(0)}K
                </p>
                <p className={`text-xs ${textSecondary} mt-1`}>per transaksi</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ml-2">
                <LineChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${cardBg} hover:scale-105 transition-transform duration-300`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${textSecondary} mb-1`}>Trend</p>
                <p className={`text-xl sm:text-2xl font-bold ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : textClass}`}>
                  {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
                </p>
                <p className={`text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : textSecondary} mt-1`}>
                  {trend === 'up' ? 'Naik' : trend === 'down' ? 'Turun' : 'Stabil'}
                </p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${trend === 'up' ? 'from-green-500 to-emerald-600' : trend === 'down' ? 'from-red-500 to-orange-600' : 'from-amber-500 to-yellow-600'} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ml-2`}>
                {trend === 'up' ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section - Responsive */}
      <Card className={`border-0 shadow-xl ${cardBg}`}>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className={`flex items-center gap-2 ${textClass} text-base sm:text-lg`}>
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                <span className="truncate">Grafik Penjualan</span>
              </CardTitle>
              <CardDescription className={`${textSecondary} text-xs sm:text-sm mt-1`}>
                Visualisasi performa penjualan Anda
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              {/* Toggle Chart Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChart(!showChart)}
                className={`${hoverBg} h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0`}
                title={showChart ? "Sembunyikan Grafik" : "Tampilkan Grafik"}
              >
                {showChart ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              {/* Time Filter Buttons - Scrollable on Mobile */}
              <div className={`flex gap-1 p-1 rounded-lg ${statBg} overflow-x-auto`}>
                {[
                  { value: "daily", label: "Harian", shortLabel: "H" },
                  { value: "weekly", label: "Mingguan", shortLabel: "M" },
                  { value: "monthly", label: "Bulanan", shortLabel: "B" },
                  { value: "yearly", label: "Tahunan", shortLabel: "T" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setTimeFilter(filter.value as TimeFilter)}
                    className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0 ${
                      timeFilter === filter.value
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : `${textSecondary} ${hoverBg}`
                    }`}
                  >
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className="sm:hidden">{filter.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        {showChart && (
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4">
              {/* Line Chart - Crypto Style */}
              <div className="h-48 sm:h-64 relative">
                {chartData.length === 0 ? (
                  <div className={`w-full h-full flex items-center justify-center ${textSecondary}`}>
                    <p className="text-sm">Tidak ada data untuk periode ini</p>
                  </div>
                ) : (
                  <div className="w-full h-full relative overflow-x-auto">
                    {/* Grid Background */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-full border-t ${borderClass} ${i === 0 ? 'border-transparent' : ''}`} />
                      ))}
                    </div>

                    {/* SVG Line Chart */}
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      {/* Gradient Definition */}
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>

                      {/* Create Path */}
                      {(() => {
                        const points = chartData.map((data, index) => {
                          const x = (index / (chartData.length - 1)) * 100
                          const y = 100 - (data.value / maxValue) * 90 // 90% height for padding
                          return { x, y, value: data.value }
                        })

                        // Line path
                        const linePath = points
                          .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
                          .join(' ')

                        // Area path (filled gradient area)
                        const areaPath = `${linePath} L 100,100 L 0,100 Z`

                        return (
                          <>
                            {/* Filled Area */}
                            <path
                              d={areaPath}
                              fill="url(#areaGradient)"
                              vectorEffect="non-scaling-stroke"
                            />
                            
                            {/* Line */}
                            <path
                              d={linePath}
                              fill="none"
                              stroke="url(#lineGradient)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                              className="drop-shadow-lg"
                            />

                            {/* Data Points */}
                            {points.map((point, index) => (
                              <g key={index}>
                                {/* Hover Area */}
                                <circle
                                  cx={`${point.x}%`}
                                  cy={`${point.y}%`}
                                  r="12"
                                  fill="transparent"
                                  className="cursor-pointer hover-trigger"
                                  onMouseEnter={(e) => {
                                    const tooltip = e.currentTarget.nextElementSibling
                                    if (tooltip) tooltip.classList.remove('opacity-0')
                                  }}
                                  onMouseLeave={(e) => {
                                    const tooltip = e.currentTarget.nextElementSibling
                                    if (tooltip) tooltip.classList.add('opacity-0')
                                  }}
                                />
                                
                                {/* Tooltip */}
                                <g className="opacity-0 transition-opacity duration-200 pointer-events-none">
                                  <circle
                                    cx={`${point.x}%`}
                                    cy={`${point.y}%`}
                                    r="4"
                                    fill="white"
                                    stroke="url(#lineGradient)"
                                    strokeWidth="2"
                                  />
                                  <circle
                                    cx={`${point.x}%`}
                                    cy={`${point.y}%`}
                                    r="8"
                                    fill="url(#lineGradient)"
                                    opacity="0.2"
                                  />
                                </g>

                                {/* Point Dot (Always Visible) */}
                                <circle
                                  cx={`${point.x}%`}
                                  cy={`${point.y}%`}
                                  r="2.5"
                                  fill="white"
                                  stroke="url(#lineGradient)"
                                  strokeWidth="2"
                                  className="drop-shadow-md"
                                />
                              </g>
                            ))}
                          </>
                        )
                      })()}
                    </svg>

                    {/* Tooltips (HTML) */}
                    <div className="absolute inset-0 flex justify-between items-end pointer-events-none px-4">
                      {chartData.map((data, index) => (
                        <div 
                          key={index} 
                          className="flex flex-col items-center gap-1 peer-hover:opacity-100"
                          style={{ width: `${100 / chartData.length}%` }}
                        >
                          {/* Value Tooltip */}
                          <div className={`opacity-0 hover:opacity-100 transition-opacity ${isDark ? 'bg-slate-700' : 'bg-slate-800'} text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap mb-2`}>
                            Rp {(data.value / 1000).toFixed(0)}K
                          </div>
                          
                          {/* Label */}
                          <span className={`text-[10px] sm:text-xs ${textSecondary} truncate max-w-full text-center`}>
                            {data.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Legend - Responsive Layout */}
              <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm pt-4 border-t ${borderClass}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0" />
                  <span className={textSecondary}>Total Penjualan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span className={textSecondary}>
                    {timeFilter === "daily" ? "Per Hari" : 
                     timeFilter === "weekly" ? "Per Minggu" : 
                     timeFilter === "monthly" ? "Per Bulan" : "Per Tahun"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${textSecondary} text-xs`}>
                    Max: <strong className="text-green-500">Rp {(maxValue / 1000).toFixed(0)}K</strong>
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