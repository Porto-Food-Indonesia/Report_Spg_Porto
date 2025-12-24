"use client"

import { useState, useEffect } from "react"
import { AlertCircle, TrendingUp, TrendingDown, Loader2, Target, Trophy, Flame, Zap, Award } from "lucide-react"
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

interface PerformanceAlertProps {
  theme?: "dark" | "light"
}

export default function PerformanceAlert({ theme = "dark" }: PerformanceAlertProps) {
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

      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const currentMonthParams = new URLSearchParams({
        spgId: user!.id.toString(),
        startDate: currentMonthStart.toISOString().split('T')[0],
        endDate: currentMonthEnd.toISOString().split('T')[0],
      })

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

      if (!Array.isArray(currentData) || !Array.isArray(lastData)) {
        throw new Error("Format data tidak valid")
      }

      const currentTotal = currentData.reduce((sum, item) => sum + (item.total || 0), 0)
      const lastTotal = lastData.reduce((sum, item) => sum + (item.total || 0), 0)

      const percentageChange = lastTotal > 0 
        ? ((currentTotal - lastTotal) / lastTotal) * 100 
        : 0

      const target = lastTotal
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

  const cardBg = theme === "dark" 
    ? "bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm" 
    : "bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-xl"
  const textPrimary = theme === "dark" ? "text-slate-100" : "text-slate-900"
  const textSecondary = theme === "dark" ? "text-slate-400" : "text-slate-600"
  const bgAccent = theme === "dark" 
    ? "bg-gradient-to-br from-slate-700/50 to-slate-800/50" 
    : "bg-gradient-to-br from-slate-50 to-white"

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Card className={`${cardBg} border overflow-hidden`}>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <Loader2 className={`w-12 h-12 animate-spin ${textSecondary}`} />
                <div className={`absolute inset-0 w-12 h-12 rounded-full ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-500/10"} animate-ping`} />
              </div>
              <span className={`text-lg font-medium ${textSecondary}`}>Memuat data performa...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Alert className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 shadow-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900 font-bold">Error</AlertTitle>
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
  const isNewSPG = performance.target === 0
  const progressPercentage = Math.min((performance.currentMonth.total / performance.target) * 100, 100)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Alert Section */}
      {isNewSPG && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Selamat Datang, SPG Baru! 🎉</h3>
              <p className="text-blue-100 leading-relaxed">
                Mulai perjalanan kesuksesan Anda! Catat setiap penjualan untuk membangun track record yang luar biasa.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isNewSPG && isDecreasing && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Waktunya Bangkit! 💪</h3>
              <p className="text-orange-100 leading-relaxed">
                Penjualan menurun {Math.abs(performance.percentageChange).toFixed(1)}% dari bulan lalu. Ini kesempatan untuk strategi baru dan kembali naik!
              </p>
            </div>
          </div>
        </div>
      )}

      {!isNewSPG && isIncreasing && !targetReached && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 p-6 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Sedang On Fire! 🔥</h3>
              <p className="text-green-100 leading-relaxed">
                Luar biasa! Penjualan naik {performance.percentageChange.toFixed(1)}% dari bulan lalu. Momentum ini harus dipertahankan!
              </p>
            </div>
          </div>
        </div>
      )}

      {!isNewSPG && targetReached && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-6 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Target Tercapai! 🏆</h3>
              <p className="text-pink-100 leading-relaxed">
                Prestasi luar biasa! Anda melampaui performa bulan lalu sebesar {performance.percentageChange.toFixed(1)}%. Keep crushing it!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Performance Card */}
      <Card className={`${cardBg} border overflow-hidden shadow-2xl`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-500/10"}`}>
              <Award className={`h-6 w-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <div>
              <CardTitle className={`text-2xl ${textPrimary}`}>Dashboard Performa</CardTitle>
              <CardDescription className={textSecondary}>Analisis penjualan real-time Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Month Card */}
            <div className={`${bgAccent} rounded-2xl p-6 border ${theme === "dark" ? "border-slate-700/50" : "border-slate-200"} relative overflow-hidden group hover:scale-105 transition-transform duration-300`}>
              <div className={`absolute inset-0 ${theme === "dark" ? "bg-gradient-to-br from-blue-500/5 to-transparent" : "bg-gradient-to-br from-blue-500/5 to-transparent"} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>Bulan Ini</span>
                  <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-500/10"}`}>
                    <TrendingUp className={`h-4 w-4 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                  </div>
                </div>
                <div className={`text-3xl md:text-4xl font-bold ${textPrimary} mb-2 tracking-tight`}>
                  Rp {(performance.currentMonth.total / 1000000).toFixed(1)}jt
                </div>
                <div className={`flex items-center gap-2 ${textSecondary} text-sm`}>
                  <div className={`px-3 py-1 rounded-full ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
                    {performance.currentMonth.count} transaksi
                  </div>
                </div>
              </div>
            </div>

            {/* Target Card */}
            <div className={`${bgAccent} rounded-2xl p-6 border ${theme === "dark" ? "border-slate-700/50" : "border-slate-200"} relative overflow-hidden group hover:scale-105 transition-transform duration-300`}>
              <div className={`absolute inset-0 ${targetReached ? "bg-gradient-to-br from-green-500/5 to-transparent" : "bg-gradient-to-br from-purple-500/5 to-transparent"} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>
                    {isNewSPG ? "Target" : "Target (Bulan Lalu)"}
                  </span>
                  <div className={`p-2 rounded-lg ${targetReached ? (theme === "dark" ? "bg-green-500/20" : "bg-green-500/10") : (theme === "dark" ? "bg-purple-500/20" : "bg-purple-500/10")}`}>
                    <Target className={`h-4 w-4 ${targetReached ? (theme === "dark" ? "text-green-400" : "text-green-600") : (theme === "dark" ? "text-purple-400" : "text-purple-600")}`} />
                  </div>
                </div>
                <div className={`text-3xl md:text-4xl font-bold ${textPrimary} mb-2 tracking-tight`}>
                  {isNewSPG ? (
                    <span className={textSecondary}>-</span>
                  ) : (
                    `Rp ${(performance.target / 1000000).toFixed(1)}jt`
                  )}
                </div>
                {isNewSPG ? (
                  <div className={`${textSecondary} text-sm`}>Belum ada data</div>
                ) : targetReached ? (
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full ${theme === "dark" ? "bg-green-500/20" : "bg-green-500/10"} text-green-600 text-sm font-semibold`}>
                      ✓ Target Tercapai
                    </div>
                  </div>
                ) : (
                  <div className={`${textSecondary} text-sm`}>
                    Kurang Rp {(Math.abs(performance.remaining) / 1000000).toFixed(1)}jt
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Section */}
          {!isNewSPG && (
            <div className={`${bgAccent} rounded-2xl p-6 border ${theme === "dark" ? "border-slate-700/50" : "border-slate-200"}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${textSecondary} uppercase tracking-wider mb-3`}>
                    Perbandingan Bulan Lalu
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${textPrimary} mb-2`}>
                    Rp {(performance.lastMonth.total / 1000000).toFixed(1)}jt
                  </div>
                  <div className={`${textSecondary} text-sm`}>
                    {performance.lastMonth.count} transaksi
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex flex-col items-center md:items-end gap-2`}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                      isIncreasing 
                        ? (theme === "dark" ? "bg-green-500/20" : "bg-green-500/10")
                        : isDecreasing 
                        ? (theme === "dark" ? "bg-red-500/20" : "bg-red-500/10")
                        : (theme === "dark" ? "bg-slate-700" : "bg-slate-100")
                    }`}>
                      {isIncreasing ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : isDecreasing ? (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      ) : null}
                      <span className={`text-2xl font-bold ${
                        isIncreasing ? "text-green-600" : isDecreasing ? "text-red-600" : textSecondary
                      }`}>
                        {performance.percentageChange > 0 ? '+' : ''}
                        {performance.percentageChange.toFixed(1)}%
                      </span>
                    </div>
                    <span className={`text-xs ${textSecondary} font-medium`}>vs bulan lalu</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {!isNewSPG && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-semibold ${textSecondary} uppercase tracking-wider`}>
                  Progress Target
                </span>
                <span className={`text-2xl font-bold ${textPrimary}`}>
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-4 rounded-full overflow-hidden ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"} shadow-inner`}>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                    targetReached 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              {targetReached && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Trophy className="h-5 w-5 text-yellow-500 animate-bounce" />
                  <span className={`font-semibold ${textPrimary}`}>
                    Melampaui target {(progressPercentage - 100).toFixed(1)}%!
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}