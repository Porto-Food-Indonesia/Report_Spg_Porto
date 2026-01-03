"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Download,
  FileSpreadsheet,
  Weight,
  CheckCircle2,
  XCircle,
  Filter,
  RotateCcw,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp
} from "lucide-react"
import * as XLSX from "xlsx"

interface SalesReport {
  id: string
  tanggal: string
  created_at: string
  spgId: string
  spgNama: string
  produk: string
  produkCategory: string
  produkPcsPerKarton: number
  penjualanKarton: number
  penjualanPcs: number
  penjualanGram: number
  hargaKarton: number
  hargaPcs: number
  total: number
  toko: string
}

interface User {
  id: string
  nama: string
  role: string
}

interface Toast {
  id: number
  message: string
  type: "success" | "error"
}

interface SalesReportViewProps {
  theme: "dark" | "light"
}

export default function SalesReportView({ theme }: SalesReportViewProps) {
  // State Management
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])

  // Filter States
  const [selectedSpg, setSelectedSpg] = useState("semua")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filterPeriod, setFilterPeriod] = useState("current-month")

  // Delete States
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast Notification
  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }

  // Set Date Range Based On Period
  useEffect(() => {
    if (filterPeriod === "current-month") {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setStartDate(firstDay.toISOString().split("T")[0])
      setEndDate(lastDay.toISOString().split("T")[0])
    } else if (filterPeriod === "all") {
      setStartDate("")
      setEndDate("")
    }
    // if "custom", do nothing (user will set dates)
  }, [filterPeriod])

  // Initial Data Fetch
  useEffect(() => {
    fetchSalesData()
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch Data on Filter Change (when not loading initial)
  useEffect(() => {
    if (!loading) {
      fetchSalesData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpg, startDate, endDate])

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/list")
      const data = await response.json()
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        setUsers([])
      }
    } catch (err) {
      console.error("❌ Gagal fetch users:", err)
      setUsers([])
    }
  }

  // Fetch Sales Data
  const fetchSalesData = async () => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      if (selectedSpg && selectedSpg !== "semua") {
        params.append("spgId", selectedSpg)
      }
      if (startDate) {
        params.append("startDate", startDate)
      }
      if (endDate) {
        params.append("endDate", endDate)
      }

      const url = `/api/sales/list${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Gagal mengambil data penjualan")
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setSalesData(data)
      } else {
        setSalesData([])
        setError("Format data tidak valid")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      setSalesData([])
    } finally {
      setLoading(false)
    }
  }

  // Reset Filter
  const handleResetFilter = () => {
    setSelectedSpg("semua")
    setFilterPeriod("current-month")
    setSelectedIds([])
  }

  // Select All Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(salesData.map((item) => item.id))
    } else {
      setSelectedIds([])
    }
  }

  // Select Individual Checkbox
  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // Delete Selected Items
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      showToast("Pilih data yang ingin dihapus", "error")
      return
    }

    if (!confirm(`Hapus ${selectedIds.length} data penjualan?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch("/api/sales/delete-multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: selectedIds })
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus data")
      }

      showToast(`${selectedIds.length} data berhasil dihapus`, "success")
      setSelectedIds([])
      await fetchSalesData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus data", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  // Export to Excel
  const handleExportToExcel = () => {
    if (salesData.length === 0) {
      showToast("Tidak ada data untuk diekspor", "error")
      return
    }

    try {
      const exportData = salesData.map((item, index) => {
        const stockPack = (item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)
        const isCurah = item.produkCategory === "Curah"

        return {
          NO: index + 1,
          "TANGGAL INPUT": item.created_at
            ? new Date(item.created_at).toLocaleString("id-ID", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
              })
            : "-",
          "TANGGAL TRANSAKSI": item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-",
          NAMA: item.spgNama,
          PRODUK: item.produk,
          PACK: isCurah ? "-" : item.penjualanPcs || 0,
          KARTON: isCurah ? "-" : item.penjualanKarton || 0,
          HARGA_PACK: item.hargaPcs || 0,
          HARGA_KARTON: isCurah ? "-" : item.hargaKarton || 0,
          STOCK_PACK: isCurah ? "-" : stockPack,
          STOCK_KARTON: isCurah ? "-" : item.penjualanKarton || 0,
          TOTAL_SELLOUT: item.total || 0,
          TOKO: item.toko || "-",
          GRAM: isCurah ? item.penjualanGram || 0 : "-"
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 18 },
        { wch: 20 },
        { wch: 25 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 30 },
        { wch: 12 }
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "LAPORAN PENJUALAN")

      const spgName =
        selectedSpg === "semua" ? "Semua_SPG" : users.find((u) => u.id === selectedSpg)?.nama || "SPG"
      const dateRange =
        startDate && endDate ? `${startDate}_to_${endDate}` : new Date().toISOString().split("T")[0]
      const filename = `LAPORAN_PENJUALAN_${spgName}_${dateRange}.xlsx`

      XLSX.writeFile(workbook, filename)
      showToast("Data berhasil diekspor ke Excel!", "success")
    } catch (err) {
      console.error(err)
      showToast("Gagal mengekspor data", "error")
    }
  }

  // Export to CSV
  const handleExportToCSV = () => {
    if (salesData.length === 0) {
      showToast("Tidak ada data untuk diekspor", "error")
      return
    }

    try {
      const headers = [
        "NO",
        "TANGGAL INPUT",
        "TANGGAL TRANSAKSI",
        "NAMA",
        "PRODUK",
        "PACK",
        "KARTON",
        "HARGA_PACK",
        "HARGA_KARTON",
        "STOCK_PACK",
        "STOCK_KARTON",
        "TOTAL_SELLOUT",
        "TOKO",
        "GRAM"
      ]

      const rows = salesData.map((item, index) => {
        const stockPack = (item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)
        const isCurah = item.produkCategory === "Curah"

        return [
          index + 1,
          item.created_at
            ? new Date(item.created_at).toLocaleString("id-ID", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
              })
            : "-",
          item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-",
          item.spgNama,
          item.produk,
          isCurah ? "-" : item.penjualanPcs || 0,
          isCurah ? "-" : item.penjualanKarton || 0,
          item.hargaPcs || 0,
          isCurah ? "-" : item.hargaKarton || 0,
          isCurah ? "-" : stockPack,
          isCurah ? "-" : item.penjualanKarton || 0,
          item.total || 0,
          item.toko || "-",
          isCurah ? item.penjualanGram || 0 : "-"
        ]
      })

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell)
              if (cellStr.includes(",") || cellStr.includes('"')) {
                return `"${cellStr.replace(/"/g, '""')}"`
              }
              return cellStr
            })
            .join(",")
        )
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      const spgName =
        selectedSpg === "semua" ? "Semua_SPG" : users.find((u) => u.id === selectedSpg)?.nama || "SPG"
      const dateRange =
        startDate && endDate ? `${startDate}_to_${endDate}` : new Date().toISOString().split("T")[0]

      link.download = `LAPORAN_PENJUALAN_${spgName}_${dateRange}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast("Data berhasil diekspor ke CSV!", "success")
    } catch (err) {
      console.error(err)
      showToast("Gagal mengekspor data", "error")
    }
  }

  // Calculate Totals
  const totalRevenue = Array.isArray(salesData)
    ? salesData.reduce((sum, item) => sum + (item.total || 0), 0)
    : 0

  const totalPcs = Array.isArray(salesData)
    ? salesData.reduce((sum, item) => {
        if (item.produkCategory === "Curah") return sum
        return sum + (item.penjualanPcs || 0)
      }, 0)
    : 0

  const totalKarton = Array.isArray(salesData)
    ? salesData.reduce((sum, item) => {
        if (item.produkCategory === "Curah") return sum
        return sum + (item.penjualanKarton || 0)
      }, 0)
    : 0

  const totalGram = Array.isArray(salesData)
    ? salesData.reduce((sum, item) => {
        if (item.produkCategory === "Curah") {
          return sum + (item.penjualanGram || 0)
        }
        return sum
      }, 0)
    : 0

  // Theme Classes
  const bgClass =
    theme === "dark"
      ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
  const cardBg = theme === "dark" ? "bg-slate-800/50" : "bg-white/80"
  const cardBorder = theme === "dark" ? "border-slate-700/50" : "border-slate-200"
  const textPrimary = theme === "dark" ? "text-white" : "text-slate-900"
  const textSecondary = theme === "dark" ? "text-slate-300" : "text-slate-600"
  const textMuted = theme === "dark" ? "text-slate-400" : "text-slate-500"
  const inputBg = theme === "dark" ? "bg-slate-700/50 border-slate-600" : "bg-white border-slate-300"
  const inputText = theme === "dark" ? "text-white" : "text-slate-900"
  const tableBg = theme === "dark" ? "bg-slate-800/30" : "bg-slate-50/50"
  const tableHoverBg = theme === "dark" ? "hover:bg-slate-700/30" : "hover:bg-slate-100/70"
  const tableBorder = theme === "dark" ? "border-slate-700/50" : "border-slate-200/70"
  const tableHeaderBg = theme === "dark" ? "bg-slate-700/50" : "bg-slate-100/80"

  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Notifications */}
        <div className="fixed top-20 right-6 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-5 duration-300 backdrop-blur-sm ${
                toast.type === "success"
                  ? "bg-emerald-500/90 text-white border border-emerald-400/50"
                  : "bg-red-500/90 text-white border border-red-400/50"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          ))}
        </div>

        {/* Filter Section */}
        <Card className={`${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center gap-2`}>
              <Filter className="w-5 h-5 text-blue-400" />
              Filter Laporan Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Periode Filter */}
              <div className="space-y-2">
                <Label className={textSecondary}>Periode</Label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm ${inputBg} ${inputText} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                >
                  <option value="current-month">Bulan Ini</option>
                  <option value="all">Semua Data</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* SPG Filter */}
              <div className="space-y-2">
                <Label className={textSecondary}>SPG</Label>
                <select
                  value={selectedSpg}
                  onChange={(e) => setSelectedSpg(e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm ${inputBg} ${inputText} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                >
                  <option value="semua">Semua SPG</option>
                  {Array.isArray(users) &&
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nama}
                      </option>
                    ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label className={textSecondary}>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setFilterPeriod("custom")
                  }}
                  disabled={filterPeriod !== "custom"}
                  className={`${inputBg} ${inputText} focus:ring-blue-500 ${
                    filterPeriod !== "custom" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className={textSecondary}>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setFilterPeriod("custom")
                  }}
                  disabled={filterPeriod !== "custom"}
                  className={`${inputBg} ${inputText} focus:ring-blue-500 ${
                    filterPeriod !== "custom" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Reset Button */}
              <div className="space-y-2">
                <Label className={`${textSecondary} opacity-0`}>Reset</Label>
                <Button
                  onClick={handleResetFilter}
                  variant="outline"
                  className={`w-full ${
                    theme === "dark"
                      ? "bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 hover:text-white"
                      : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Export Buttons */}
              <div className="space-y-2">
                <Label className={`${textSecondary} opacity-0`}>Export</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExportToExcel}
                    className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg text-white"
                    disabled={salesData.length === 0 || loading}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </Button>
                  <Button
                    onClick={handleExportToCSV}
                    className={`flex-1 gap-2 ${
                      theme === "dark"
                        ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                        : "bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-900"
                    } border`}
                    disabled={salesData.length === 0 || loading}
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* Delete Selected Bar */}
            {selectedIds.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <span className={`text-sm ${textPrimary} font-medium`}>{selectedIds.length} data terpilih</span>
                <Button onClick={handleDeleteSelected} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Hapus Terpilih
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Total Transaksi */}
          <Card
            className={`relative overflow-hidden ${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textMuted} mb-1 uppercase tracking-wide`}>Total Transaksi</p>
                  <h3 className={`text-2xl font-bold ${textPrimary}`}>{Array.isArray(salesData) ? salesData.length : 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Karton */}
          <Card
            className={`relative overflow-hidden ${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textMuted} mb-1 uppercase tracking-wide`}>Total Karton</p>
                  <h3 className={`text-2xl font-bold ${textPrimary}`}>{totalKarton.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Pack */}
          <Card
            className={`relative overflow-hidden ${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textMuted} mb-1 uppercase tracking-wide`}>Total Pack</p>
                  <h3 className={`text-2xl font-bold ${textPrimary}`}>{totalPcs.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Gram */}
          <Card
            className={`relative overflow-hidden ${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textMuted} mb-1 uppercase tracking-wide`}>Total Gram</p>
                  <h3 className={`text-2xl font-bold ${textPrimary}`}>{totalGram.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Weight className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card
            className={`relative overflow-hidden ${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textMuted} mb-1 uppercase tracking-wide`}>Total Revenue</p>
                  <h3 className={`text-2xl font-bold ${textPrimary}`}>Rp {totalRevenue.toLocaleString("id-ID")}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className={`${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardHeader>
            <CardTitle className={textPrimary}>Data Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 mb-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">{error}</div>
            )}

            {loading ? (
              <div className="text-center py-16">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin" />
                  <div
                    className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-cyan-500 animate-spin-slow"
                    style={{ animationDirection: "reverse" }}
                  />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-white animate-bounce" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 blur-2xl opacity-50 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Memuat Data Penjualan
                  </h3>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
            ) : !Array.isArray(salesData) || salesData.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className={`w-16 h-16 ${textMuted} mx-auto mb-4`} />
                <p className={textMuted}>Tidak ada data penjualan</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${tableBorder} ${tableHeaderBg}`}>
                      <th className={`px-4 py-3 text-left`}>
                        <input
                          type="checkbox"
                          checked={salesData.length > 0 && selectedIds.length === salesData.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Tanggal Input</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Tanggal Transaksi</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>SPG</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Produk</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Kategori</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Toko</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Pack</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Karton</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Harga Pack</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Harga Karton</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Stock Pack</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Stock Karton</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Total</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Gram</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((item, index) => {
                      const isCurah = item.produkCategory === "Curah"
                      const stockPack = (item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)
                      const isSelected = selectedIds.includes(item.id)

                      return (
                        <tr
                          key={item.id}
                          className={`border-b ${tableBorder} ${tableHoverBg} transition-colors ${index % 2 === 0 ? tableBg : ""} ${isSelected ? "bg-blue-500/10" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectOne(item.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString("id-ID", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false
                                })
                              : "-"}
                          </td>
                          <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                            {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-"}
                          </td>
                          <td className={`px-4 py-3 text-sm ${textPrimary} font-medium`}>{item.spgNama}</td>
                          <td className={`px-4 py-3 text-sm ${textSecondary}`}>{item.produk}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isCurah
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {isCurah && <Weight className="w-3 h-3" />}
                              {item.produkCategory || "Pack/Karton"}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${textSecondary}`}>{item.toko}</td>
                          <td className={`px-4 py-3 text-sm text-right ${textPrimary}`}>{isCurah ? "-" : item.penjualanPcs || 0}</td>
                          <td className={`px-4 py-3 text-sm text-right ${textPrimary}`}>{isCurah ? "-" : item.penjualanKarton || 0}</td>
                          <td className={`px-4 py-3 text-sm text-right ${textSecondary}`}>
                            {isCurah ? <span className="font-semibold text-emerald-400">Rp {(item.hargaPcs || 0).toLocaleString("id-ID")}</span> : <span>Rp {(item.hargaPcs || 0).toLocaleString("id-ID")}</span>}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${textSecondary}`}>{isCurah ? "-" : <span>Rp {(item.hargaKarton || 0).toLocaleString("id-ID")}</span>}</td>
                          <td className={`px-4 py-3 text-sm text-right ${textPrimary}`}>{isCurah ? "-" : stockPack}</td>
                          <td className={`px-4 py-3 text-sm text-right ${textPrimary}`}>{isCurah ? "-" : item.penjualanKarton || 0}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-blue-400">Rp {(item.total || 0).toLocaleString("id-ID")}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {isCurah ? <span className="font-semibold text-emerald-400">{(item.penjualanGram || 0).toLocaleString()} gr</span> : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}