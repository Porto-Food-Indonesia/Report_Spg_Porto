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
} from "recharts"
import { useEffect, useState } from "react"

interface AnalyticsData {
  totalSalesBulanIni: number
  totalSPGAktif: number
  rataRataPenjualanPerSPG: number
  totalTransaksi: number
  topProducts: Array<{ name: string; nilai: number }>
  topSPG: Array<{ rank: number; nama: string; penjualan: number }>
  salesTrend: Array<{ bulan: string; penjualan: number }>
}

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm md:text-base text-slate-600">Memuat data analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-sm md:text-base text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
              Total Penjualan Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
              Rp {data.totalSalesBulanIni.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] sm:text-xs text-green-600 mt-1">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
              Total SPG Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
              {data.totalSPGAktif}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Yang melakukan transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
              Rata-rata Penjualan/SPG
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
              Rp {data.rataRataPenjualanPerSPG.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Per bulan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
              Total Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
              {data.totalTransaksi.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] sm:text-xs text-blue-600 mt-1">Bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Trend Penjualan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base md:text-lg">
              Trend Penjualan 6 Bulan
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Grafik penjualan bulanan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
              <LineChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="bulan" 
                  tick={{ fontSize: 'clamp(10px, 2vw, 12px)' }}
                />
                <YAxis 
                  tick={{ fontSize: 'clamp(10px, 2vw, 12px)' }}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 'clamp(11px, 2vw, 14px)' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: 'clamp(11px, 2vw, 14px)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="penjualan" 
                  stroke="#3b82f6" 
                  name="Penjualan (Jutaan)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Produk Paling Laris */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base md:text-lg">
              Produk Paling Laris
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Top 4 produk bulan ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                <PieChart>
                  <Pie
                    data={data.topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name }) => name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="nilai"
                    style={{ fontSize: 'clamp(10px, 2vw, 12px)' }}
                  >
                    {data.topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                    contentStyle={{ fontSize: 'clamp(11px, 2vw, 14px)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-xs sm:text-sm text-slate-500 py-4">
                Belum ada data produk
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top SPG */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base md:text-lg">
            Top SPG - Penjualan Terbanyak
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Performa SPG terbaik bulan ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            {data.topSPG.length > 0 ? (
              data.topSPG.map((spg) => (
                <div 
                  key={spg.rank} 
                  className="flex items-center justify-between p-2 md:p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                      {spg.rank}
                    </div>
                    <span className="text-xs sm:text-sm md:text-base font-medium text-slate-900">
                      {spg.nama}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-blue-600">
                    Rp {spg.penjualan.toLocaleString("id-ID")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs sm:text-sm text-slate-500 py-4">
                Belum ada data penjualan bulan ini
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}