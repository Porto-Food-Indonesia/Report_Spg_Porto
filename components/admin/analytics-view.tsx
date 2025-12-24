"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { useEffect, useState } from "react"
import { TrendingUp, Users, DollarSign, ShoppingCart, Award, ArrowUp, ArrowDown } from "lucide-react"

interface AnalyticsData {
  totalSalesBulanIni: number
  totalSPGAktif: number
  rataRataPenjualanPerSPG: number
  totalTransaksi: number
  topProducts: Array<{ name: string; nilai: number }>
  topSPG: Array<{ rank: number; nama: string; penjualan: number }>
  salesTrend: Array<{ bulan: string; penjualan: number }>
}

interface AnalyticsViewProps {
  theme?: 'dark' | 'light'
}

export default function AnalyticsView({ theme = 'dark' }: AnalyticsViewProps) {
  const isDark = theme === 'dark'
  
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const COLORS = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#06b6d4"  // cyan
  ]

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics/summary')
        if (!response.ok) {
          throw new Error('Gagal mengambil data analytics')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  // Theme-based classes
  const bgMain = isDark 
    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" 
    : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
  
  const cardBg = isDark 
    ? "bg-slate-800/50 border-slate-700/50" 
    : "bg-white border-slate-200"
  
  const textPrimary = isDark ? "text-white" : "text-slate-900"
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600"
  const textTertiary = isDark ? "text-slate-500" : "text-slate-500"
  
  const chartGridColor = isDark ? "#475569" : "#cbd5e1"
  const chartAxisColor = isDark ? "#94a3b8" : "#64748b"
  
  const tooltipBg = isDark ? '#0f172a' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#fff' : '#0f172a'

  if (loading) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center p-6 transition-colors duration-300`}>
        <div className="relative">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-cyan-500 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-white animate-bounce" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 blur-2xl opacity-50 animate-pulse" />
          </div>
          
          <div className="mt-8 text-center">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Memuat Analytics
            </h3>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center p-6 transition-colors duration-300`}>
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full animate-pulse" />
            <div className={`absolute inset-2 ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-full flex items-center justify-center transition-colors`}>
              <span className="text-4xl">⚠️</span>
            </div>
          </div>
          <h3 className={`text-xl font-bold ${textPrimary} mb-2 transition-colors`}>Oops! Terjadi Kesalahan</h3>
          <p className="text-sm text-red-400 font-medium bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
            {error}
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const statsCards = [
    {
      title: "Total Penjualan",
      value: `Rp ${data.totalSalesBulanIni.toLocaleString('id-ID')}`,
      subtitle: "Bulan ini",
      icon: DollarSign,
      gradient: "from-blue-500 to-cyan-500",
      trend: "+12.5%",
      isPositive: true
    },
    {
      title: "SPG Aktif",
      value: data.totalSPGAktif,
      subtitle: "Yang bertransaksi",
      icon: Users,
      gradient: "from-emerald-500 to-teal-500",
      trend: "+5.2%",
      isPositive: true
    },
    {
      title: "Rata-rata/SPG",
      value: `Rp ${data.rataRataPenjualanPerSPG.toLocaleString('id-ID')}`,
      subtitle: "Per bulan",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500",
      trend: "+8.1%",
      isPositive: true
    },
    {
      title: "Total Transaksi",
      value: data.totalTransaksi.toLocaleString('id-ID'),
      subtitle: "Bulan ini",
      icon: ShoppingCart,
      gradient: "from-orange-500 to-red-500",
      trend: "+15.3%",
      isPositive: true
    }
  ]

  return (
    <div className={`space-y-6 p-6 ${bgMain} min-h-screen transition-colors duration-300`}>
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={index}
              className={`relative overflow-hidden ${cardBg} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}
            >
              <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
              
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${textSecondary} mb-1 uppercase tracking-wide transition-colors`}>
                      {stat.title}
                    </p>
                    <h3 className={`text-2xl font-bold ${textPrimary} mb-1 transition-colors`}>
                      {stat.value}
                    </h3>
                    <p className={`text-xs ${textTertiary} transition-colors`}>{stat.subtitle}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className={`flex items-center gap-1 pt-2 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'} transition-colors`}>
                  {stat.isPositive ? (
                    <ArrowUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs font-semibold ${stat.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.trend}
                  </span>
                  <span className={`text-xs ${textSecondary} transition-colors`}>vs bulan lalu</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Penjualan */}
        <Card className={`${cardBg} backdrop-blur-sm shadow-xl overflow-hidden transition-colors duration-300`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className={`text-lg font-bold ${textPrimary} transition-colors`}>
                  Trend Penjualan
                </CardTitle>
                <CardDescription className={`text-sm ${textSecondary} mt-1 transition-colors`}>
                  Grafik penjualan 6 bulan terakhir
                </CardDescription>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.salesTrend}>
                <defs>
                  <linearGradient id="colorPenjualan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.3} />
                <XAxis 
                  dataKey="bulan" 
                  tick={{ fontSize: 11, fill: chartAxisColor }}
                  stroke={chartGridColor}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: chartAxisColor }}
                  stroke={chartGridColor}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    color: tooltipText,
                    fontSize: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                  }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}M`, 'Penjualan']}
                />
                <Area 
                  type="monotone" 
                  dataKey="penjualan" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#colorPenjualan)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Produk Paling Laris */}
        <Card className={`${cardBg} backdrop-blur-sm shadow-xl overflow-hidden transition-colors duration-300`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className={`text-lg font-bold ${textPrimary} transition-colors`}>
                  Produk Terlaris
                </CardTitle>
                <CardDescription className={`text-sm ${textSecondary} mt-1 transition-colors`}>
                  Top produk bulan ini
                </CardDescription>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <Award className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {data.topProducts.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.topProducts}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="nilai"
                    >
                      {data.topProducts.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                      contentStyle={{ 
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: '8px',
                        color: tooltipText,
                        fontSize: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {data.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className={`text-xs ${textSecondary} truncate transition-colors`}>{product.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className={`w-16 h-16 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} rounded-full flex items-center justify-center mb-3 transition-colors`}>
                  <Award className={`w-8 h-8 ${textTertiary} transition-colors`} />
                </div>
                <p className={`text-sm ${textSecondary} transition-colors`}>Belum ada data produk</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top SPG */}
      <Card className={`${cardBg} backdrop-blur-sm shadow-xl overflow-hidden transition-colors duration-300`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className={`text-lg font-bold ${textPrimary} flex items-center gap-2 transition-colors`}>
                <Award className="w-5 h-5 text-yellow-400" />
                Top Performers - SPG Terbaik
              </CardTitle>
              <CardDescription className={`text-sm ${textSecondary} mt-1 transition-colors`}>
                Performa SPG dengan penjualan tertinggi bulan ini
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {data.topSPG.length > 0 ? (
            <div className="space-y-3">
              {data.topSPG.map((spg, index) => {
                const gradients = [
                  "from-yellow-400 to-orange-500",
                  "from-slate-400 to-slate-500", 
                  "from-orange-400 to-orange-600",
                  "from-blue-400 to-blue-600"
                ]
                const isTopThree = spg.rank <= 3
                
                return (
                  <div 
                    key={spg.rank} 
                    className={`
                      relative flex items-center justify-between p-4 rounded-xl
                      transition-all duration-300 hover:scale-[1.02] group
                      ${isTopThree 
                        ? isDark ? 'bg-slate-700/50 border-2 border-blue-500/50' : 'bg-blue-50 border-2 border-blue-300/50'
                        : isDark ? 'bg-slate-700/30 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`
                        relative w-12 h-12 rounded-xl flex items-center justify-center 
                        font-bold text-white shadow-lg
                        ${isTopThree 
                          ? `bg-gradient-to-br ${gradients[index]}` 
                          : 'bg-gradient-to-br from-slate-600 to-slate-700'
                        }
                        group-hover:scale-110 transition-transform
                      `}>
                        {spg.rank <= 3 ? (
                          <span className="text-2xl">
                            {spg.rank === 1 ? '🥇' : spg.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="text-lg">{spg.rank}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-base font-semibold ${textPrimary} truncate transition-colors`}>
                          {spg.nama}
                        </h4>
                        <p className={`text-xs ${textSecondary} transition-colors`}>
                          {isTopThree ? '⭐ Top Performer' : 'Sales Person'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-400">
                        Rp {spg.penjualan.toLocaleString("id-ID")}
                      </p>
                      <p className={`text-xs ${textTertiary} transition-colors`}>Total Penjualan</p>
                    </div>
                    
                    {isTopThree && (
                      <div className={`
                        absolute inset-0 rounded-xl bg-gradient-to-br ${gradients[index]} 
                        opacity-0 group-hover:opacity-20 transition-opacity blur-xl
                      `} />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className={`w-16 h-16 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} rounded-full flex items-center justify-center mb-3 transition-colors`}>
                <Users className={`w-8 h-8 ${textTertiary} transition-colors`} />
              </div>
              <p className={`text-sm ${textSecondary} transition-colors`}>Belum ada data penjualan bulan ini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}