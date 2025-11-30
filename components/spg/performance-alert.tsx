"use client"

import { useState, useEffect } from "react"
import { AlertCircle, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

interface PerformanceData {
  currentMonth: {
    total: number
    count: number
  }
  lastMonth: {
    total: number
    count: number
  }
  percentageChange: number
  target: number
  remaining: number
}

export default function PerformanceAlert() {
  const { user } = useAuth()
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user?.id) {
      fetchPerformanceData()
    }
  }, [user])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      setError("")

      // Hitung tanggal bulan ini dan bulan lalu
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      // Fetch data bulan ini
      const currentMonthParams = new URLSearchParams({
        spgId: user!.id.toString(),
        startDate: currentMonthStart.toISOString().split('T')[0],
        endDate: currentMonthEnd.toISOString().split('T')[0],
      })

      // Fetch data bulan lalu
      const lastMonthParams = new URLSearchParams({
        spgId: user!.id.toString(),
        startDate: lastMonthStart.toISOString().split('T')[0],
        endDate: lastMonthEnd.toISOString().split('T')[0],
      })

      const [currentResponse, lastResponse] = await Promise.all([
        fetch(`/api/sales/list?${currentMonthParams.toString()}`),
        fetch(`/api/sales/list?${lastMonthParams.toString()}`)
      ])

      if (!currentResponse.ok || !lastResponse.ok) {
        throw new Error("Gagal mengambil data performa")
      }

      const currentData = await currentResponse.json()
      const lastData = await lastResponse.json()

      // Validasi data adalah array
      if (!Array.isArray(currentData) || !Array.isArray(lastData)) {
        throw new Error("Format data tidak valid")
      }

      // Hitung total penjualan
      const currentTotal = currentData.reduce((sum, item) => sum + (item.total || 0), 0)
      const lastTotal = lastData.reduce((sum, item) => sum + (item.total || 0), 0)

      // Hitung persentase perubahan
      const percentageChange = lastTotal > 0 
        ? ((currentTotal - lastTotal) / lastTotal) * 100 
        : 0

      // ✅ TARGET OTOMATIS: Total penjualan bulan lalu
      const target = lastTotal // Target = total bulan lalu
      const remaining = target - currentTotal

      setPerformance({
        currentMonth: {
          total: currentTotal,
          count: currentData.length,
        },
        lastMonth: {
          total: lastTotal,
          count: lastData.length,
        },
        percentageChange,
        target,
        remaining,
      })

    } catch (err) {
      console.error("❌ Error fetching performance:", err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-500">Memuat data performa...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Error</AlertTitle>
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!performance) {
    return null
  }

  const isDecreasing = performance.percentageChange < 0
  const isIncreasing = performance.percentageChange > 0
  const targetReached = performance.remaining <= 0
  const isNewSPG = performance.target === 0 // SPG baru / tidak ada data bulan lalu

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Alert untuk SPG baru */}
      {isNewSPG && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">SPG Baru</AlertTitle>
          <AlertDescription className="text-blue-800">
            Selamat datang! Belum ada data penjualan bulan lalu untuk perbandingan. 
            Mulai catat penjualan Anda untuk melihat performa bulan depan.
          </AlertDescription>
        </Alert>
      )}

      {/* Alert berdasarkan performa */}
      {!isNewSPG && isDecreasing && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <TrendingDown className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">Penjualan Menurun</AlertTitle>
          <AlertDescription className="text-yellow-800">
            Penjualan Anda bulan ini menurun {Math.abs(performance.percentageChange).toFixed(1)}% dibanding bulan lalu. 
            Cobalah tingkatkan aktivitas penjualan Anda untuk mencapai target!
          </AlertDescription>
        </Alert>
      )}

      {!isNewSPG && isIncreasing && (
        <Alert className="border-green-200 bg-green-50">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Penjualan Meningkat! 🎉</AlertTitle>
          <AlertDescription className="text-green-800">
            Hebat! Penjualan Anda bulan ini meningkat {performance.percentageChange.toFixed(1)}% dibanding bulan lalu. 
            Pertahankan performa Anda!
          </AlertDescription>
        </Alert>
      )}

      {!isNewSPG && targetReached && (
        <Alert className="border-blue-200 bg-blue-50">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Target Tercapai! 🎯</AlertTitle>
          <AlertDescription className="text-blue-800">
            Selamat! Anda telah melampaui performa bulan lalu. Terus tingkatkan penjualan Anda!
          </AlertDescription>
        </Alert>
      )}

      {/* Card Performa */}
      <Card>
        <CardHeader>
          <CardTitle>Performa Penjualan</CardTitle>
          <CardDescription>Ringkasan performa penjualan Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Grid dengan ukuran font responsif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <p className="text-xs sm:text-sm text-slate-600">Total Penjualan Bulan Ini</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">
                Rp {performance.currentMonth.total.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Dari {performance.currentMonth.count} transaksi
              </p>
            </div>
            
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <p className="text-xs sm:text-sm text-slate-600">
                {isNewSPG ? "Target Bulan Ini" : "Target (Bulan Lalu)"}
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 break-words">
                {isNewSPG ? (
                  <span className="text-slate-400">-</span>
                ) : (
                  `Rp ${performance.target.toLocaleString("id-ID")}`
                )}
              </p>
              {isNewSPG ? (
                <p className="text-xs text-slate-500 mt-1">
                  Belum ada data
                </p>
              ) : targetReached ? (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✅ Target tercapai!
                </p>
              ) : (
                <p className="text-xs text-red-600 mt-1 break-words">
                  Kurang Rp {Math.abs(performance.remaining).toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </div>

          {/* Perbandingan dengan bulan lalu */}
          {!isNewSPG && (
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-slate-600">Penjualan Bulan Lalu</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 break-words">
                    Rp {performance.lastMonth.total.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {performance.lastMonth.count} transaksi
                  </p>
                </div>
                <div className="sm:text-right">
                  <div className={`flex items-center gap-1 ${
                    isIncreasing ? 'text-green-600' : isDecreasing ? 'text-red-600' : 'text-slate-600'
                  }`}>
                    {isIncreasing ? (
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : isDecreasing ? (
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : null}
                    <span className="text-base sm:text-lg font-bold">
                      {performance.percentageChange > 0 ? '+' : ''}
                      {performance.percentageChange.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">vs bulan lalu</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {!isNewSPG && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-600">Progress Target</span>
                <span className="font-medium text-slate-900">
                  {((performance.currentMonth.total / performance.target) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 sm:h-2.5">
                <div
                  className={`h-2 sm:h-2.5 rounded-full transition-all ${
                    targetReached ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{
                    width: `${Math.min((performance.currentMonth.total / performance.target) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}