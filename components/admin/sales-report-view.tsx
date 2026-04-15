"use client"

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react"
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
  TrendingUp,
  Search,
} from "lucide-react"
import * as XLSX from "xlsx"

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SalesReport {
  id: string
  tanggal: string
  created_at: string
  spgId: string
  spgNama: string
  produk: string
  produkCategory: string
  category?: string
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: firstDay.toISOString().split("T")[0],
    end: lastDay.toISOString().split("T")[0],
  }
}

function formatInputDate(dateStr: string) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatTxDate(dateStr: string) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("id-ID")
}

// ─── Memoized Table Row ───────────────────────────────────────────────────────

interface TableRowProps {
  item: SalesReport
  index: number
  isSelected: boolean
  onSelect: (id: string) => void
  tableBorder: string
  tableHoverBg: string
  tableBg: string
  textPrimary: string
  textSecondary: string
}

const TableRow = memo(function TableRow({
  item,
  index,
  isSelected,
  onSelect,
  tableBorder,
  tableHoverBg,
  tableBg,
  textPrimary,
  textSecondary,
}: TableRowProps) {
  const isCurah = (item.produkCategory || item.category || "") === "Curah"
  const stockPack = (item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)

  return (
    <tr
      className={`border-b ${tableBorder} ${tableHoverBg} transition-colors ${
        index % 2 === 0 ? tableBg : ""
      } ${isSelected ? "bg-blue-500/10" : ""}`}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>
      <td className={`px-4 py-3 text-sm ${textSecondary} whitespace-nowrap`}>
        {formatInputDate(item.created_at)}
      </td>
      <td className={`px-4 py-3 text-sm ${textSecondary} whitespace-nowrap`}>
        {formatTxDate(item.tanggal)}
      </td>
      <td className={`px-4 py-3 text-sm ${textPrimary} font-medium whitespace-nowrap`}>
        {item.spgNama}
      </td>
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
          {item.produkCategory || item.category || "Pack/Karton"}
        </span>
      </td>
      <td className={`px-4 py-3 text-sm ${textSecondary}`}>{item.toko}</td>
      <td className={`px-4 py-3 text-sm text-right ${textPrimary}`}>
        {isCurah ? "-" : item.penjualanPcs || 0}
      </td>
      <td className={`px-4 py-3 text-sm text-right ${textPrimary}`}>
        {isCurah ? "-" : item.penjualanKarton || 0}
      </td>
      <td className={`px-4 py-3 text-sm text-right ${textSecondary} whitespace-nowrap`}>
        {isCurah ? (
          <span className="font-semibold text-emerald-400">
            Rp {(item.hargaPcs || 0).toLocaleString("id-ID")}
          </span>
        ) : (
          <span>Rp {(item.hargaPcs || 0).toLocaleString("id-ID")}</span>
        )}
      </td>
      <td className={`px-4 py-3 text-sm text-right ${textSecondary} whitespace-nowrap`}>
        {isCurah ? "-" : <span>Rp {(item.hargaKarton || 0).toLocaleString("id-ID")}</span>}
      </td>
      <td className={`px-4 py-3 text-sm text-right ${textPrimary}`}>
        {isCurah ? "-" : stockPack}
      </td>
      <td className={`px-4 py-3 text-sm text-right ${textPrimary}`}>
        {isCurah ? "-" : item.penjualanKarton || 0}
      </td>
      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-400 whitespace-nowrap">
        Rp {(item.total || 0).toLocaleString("id-ID")}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {isCurah ? (
          <span className="font-semibold text-emerald-400">
            {(item.penjualanGram || 0).toLocaleString()} gr
          </span>
        ) : (
          "-"
        )}
      </td>
    </tr>
  )
})

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesReportView({ theme }: SalesReportViewProps) {
  const { start: initStart, end: initEnd } = getCurrentMonthRange()

  // Data
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])

  // Draft filters (UI only, no fetch)
  const [selectedSpg, setSelectedSpg] = useState("semua")
  const [draftStartDate, setDraftStartDate] = useState(initStart)
  const [draftEndDate, setDraftEndDate] = useState(initEnd)
  const [filterPeriod, setFilterPeriod] = useState("current-month")

  // Applied filters (fetch triggers on these)
  const [appliedSpg, setAppliedSpg] = useState("semua")
  const [appliedStartDate, setAppliedStartDate] = useState(initStart)
  const [appliedEndDate, setAppliedEndDate] = useState(initEnd)

  // Client-side filters (instant, no fetch)
  const [filterToko, setFilterToko] = useState("semua")
  const [filterKategori, setFilterKategori] = useState("semua")

  // Delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const isInitialMount = useRef(true)

  const isDirty =
    selectedSpg !== appliedSpg ||
    draftStartDate !== appliedStartDate ||
    draftEndDate !== appliedEndDate

  // Theme classes
  const bgClass = theme === "dark" ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
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

  // Toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users/list")
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      setUsers([])
    }
  }

  // Fetch sales
  const fetchSalesData = useCallback(
    async (params: { spg: string; start: string; end: string }) => {
      try {
        setLoading(true)
        setError("")
        const query = new URLSearchParams()
        if (params.spg && params.spg !== "semua") query.append("spgId", params.spg)
        if (params.start) query.append("startDate", params.start)
        if (params.end) query.append("endDate", params.end)
        const url = `/api/sales/list${query.toString() ? `?${query.toString()}` : ""}`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Gagal mengambil data penjualan")
        const data = await res.json()
        setSalesData(Array.isArray(data) ? data : [])
        if (!Array.isArray(data)) setError("Format data tidak valid")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
        setSalesData([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Initial load
  useEffect(() => {
    fetchUsers()
    fetchSalesData({ spg: "semua", start: initStart, end: initEnd })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when applied filters change
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return }
    fetchSalesData({ spg: appliedSpg, start: appliedStartDate, end: appliedEndDate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSpg, appliedStartDate, appliedEndDate])

  // Unique toko list
  const tokoList = useMemo(() => {
    const s = new Set<string>()
    salesData.forEach((item) => { if (item.toko) s.add(item.toko) })
    return Array.from(s).sort()
  }, [salesData])

  // Client-side filtered data
  const filteredData = useMemo(() => {
    return salesData.filter((item) => {
      if (filterToko !== "semua" && item.toko !== filterToko) return false
      if (filterKategori === "Curah" && (item.produkCategory || item.category || "") !== "Curah") return false
      if (filterKategori === "Pack" && (item.produkCategory || item.category || "") === "Curah") return false
      return true
    })
  }, [salesData, filterToko, filterKategori])

  // Totals
  const totalRevenue = filteredData.reduce((s, i) => s + (i.total || 0), 0)
  const totalPcs = filteredData.reduce((s, i) => (i.produkCategory || i.category || "") === "Curah" ? s : s + (i.penjualanPcs || 0), 0)
  const totalKarton = filteredData.reduce((s, i) => (i.produkCategory || i.category || "") === "Curah" ? s : s + (i.penjualanKarton || 0), 0)
  const totalGram = filteredData.reduce((s, i) => (i.produkCategory || i.category || "") === "Curah" ? s + (i.penjualanGram || 0) : s, 0)

  // Handlers
  const handleApplyFilter = () => {
    setAppliedSpg(selectedSpg)
    setAppliedStartDate(draftStartDate)
    setAppliedEndDate(draftEndDate)
    setSelectedIds(new Set())
  }

  const handlePeriodChange = (period: string) => {
    setFilterPeriod(period)
    if (period === "current-month") {
      const { start, end } = getCurrentMonthRange()
      setDraftStartDate(start); setDraftEndDate(end)
      setAppliedSpg(selectedSpg); setAppliedStartDate(start); setAppliedEndDate(end)
    } else if (period === "all") {
      setDraftStartDate(""); setDraftEndDate("")
      setAppliedSpg(selectedSpg); setAppliedStartDate(""); setAppliedEndDate("")
    }
  }

  const handleSpgChange = (spgId: string) => {
    setSelectedSpg(spgId)
    setAppliedSpg(spgId)
    setAppliedStartDate(draftStartDate)
    setAppliedEndDate(draftEndDate)
  }

  const handleResetFilter = () => {
    const { start, end } = getCurrentMonthRange()
    setSelectedSpg("semua"); setFilterPeriod("current-month")
    setDraftStartDate(start); setDraftEndDate(end)
    setAppliedSpg("semua"); setAppliedStartDate(start); setAppliedEndDate(end)
    setFilterToko("semua"); setFilterKategori("semua")
    setSelectedIds(new Set())
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? new Set(filteredData.map((i) => i.id)) : new Set())
  }

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) { showToast("Pilih data yang ingin dihapus", "error"); return }
    if (!confirm(`Hapus ${selectedIds.size} data penjualan?`)) return
    setIsDeleting(true)
    try {
      const res = await fetch("/api/sales/delete-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (!res.ok) throw new Error("Gagal menghapus data")
      showToast(`${selectedIds.size} data berhasil dihapus`, "success")
      setSelectedIds(new Set())
      fetchSalesData({ spg: appliedSpg, start: appliedStartDate, end: appliedEndDate })
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus data", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportToExcel = () => {
    if (filteredData.length === 0) { showToast("Tidak ada data untuk diekspor", "error"); return }
    try {
      const exportData = filteredData.map((item, index) => {
        const stockPack = (item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)
        const isCurah = (item.produkCategory || item.category || "") === "Curah"
        return {
          NO: index + 1,
          "TANGGAL INPUT": item.created_at ? new Date(item.created_at).toLocaleString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "-",
          "TANGGAL TRANSAKSI": item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-",
          NAMA: item.spgNama, PRODUK: item.produk,
          PACK: isCurah ? "-" : item.penjualanPcs || 0,
          KARTON: isCurah ? "-" : item.penjualanKarton || 0,
          HARGA_PACK: item.hargaPcs || 0,
          HARGA_KARTON: isCurah ? "-" : item.hargaKarton || 0,
          STOCK_PACK: isCurah ? "-" : stockPack,
          STOCK_KARTON: isCurah ? "-" : item.penjualanKarton || 0,
          TOTAL_SELLOUT: item.total || 0,
          TOKO: item.toko || "-",
          GRAM: isCurah ? item.penjualanGram || 0 : "-",
        }
      })
      const ws = XLSX.utils.json_to_sheet(exportData)
      ws["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 12 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "LAPORAN PENJUALAN")
      const spgName = appliedSpg === "semua" ? "Semua_SPG" : users.find((u) => u.id === appliedSpg)?.nama || "SPG"
      const dateRange = appliedStartDate && appliedEndDate ? `${appliedStartDate}_to_${appliedEndDate}` : new Date().toISOString().split("T")[0]
      XLSX.writeFile(wb, `LAPORAN_PENJUALAN_${spgName}_${dateRange}.xlsx`)
      showToast("Data berhasil diekspor ke Excel!", "success")
    } catch { showToast("Gagal mengekspor data", "error") }
  }

  const handleExportToCSV = () => {
    if (filteredData.length === 0) { showToast("Tidak ada data untuk diekspor", "error"); return }
    try {
      const headers = ["NO", "TANGGAL INPUT", "TANGGAL TRANSAKSI", "NAMA", "PRODUK", "PACK", "KARTON", "HARGA_PACK", "HARGA_KARTON", "STOCK_PACK", "STOCK_KARTON", "TOTAL_SELLOUT", "TOKO", "GRAM"]
      const rows = filteredData.map((item, index) => {
        const stockPack = (item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)
        const isCurah = (item.produkCategory || item.category || "") === "Curah"
        return [
          index + 1,
          item.created_at ? new Date(item.created_at).toLocaleString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "-",
          item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-",
          item.spgNama, item.produk,
          isCurah ? "-" : item.penjualanPcs || 0,
          isCurah ? "-" : item.penjualanKarton || 0,
          item.hargaPcs || 0,
          isCurah ? "-" : item.hargaKarton || 0,
          isCurah ? "-" : stockPack,
          isCurah ? "-" : item.penjualanKarton || 0,
          item.total || 0, item.toko || "-",
          isCurah ? item.penjualanGram || 0 : "-",
        ]
      })
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => { const s = String(cell); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s }).join(",")),
      ].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const spgName = appliedSpg === "semua" ? "Semua_SPG" : users.find((u) => u.id === appliedSpg)?.nama || "SPG"
      const dateRange = appliedStartDate && appliedEndDate ? `${appliedStartDate}_to_${appliedEndDate}` : new Date().toISOString().split("T")[0]
      link.download = `LAPORAN_PENJUALAN_${spgName}_${dateRange}.csv`
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      showToast("Data berhasil diekspor ke CSV!", "success")
    } catch { showToast("Gagal mengekspor data", "error") }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toast */}
        <div className="fixed top-20 right-6 z-50 space-y-2">
          {toasts.map((toast) => (
            <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-5 duration-300 backdrop-blur-sm ${toast.type === "success" ? "bg-emerald-500/90 text-white border border-emerald-400/50" : "bg-red-500/90 text-white border border-red-400/50"}`}>
              {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          ))}
        </div>

        {/* Filter Card */}
        <Card className={`${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center gap-2`}>
              <Filter className="w-5 h-5 text-blue-400" />
              Filter Laporan Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">

              {/* Periode */}
              <div className="space-y-2">
                <Label className={textSecondary}>Periode</Label>
                <select value={filterPeriod} onChange={(e) => handlePeriodChange(e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm ${inputBg} ${inputText} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}>
                  <option value="current-month">Bulan Ini</option>
                  <option value="all">Semua Data</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* SPG */}
              <div className="space-y-2">
                <Label className={textSecondary}>SPG</Label>
                <select value={selectedSpg} onChange={(e) => handleSpgChange(e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm ${inputBg} ${inputText} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}>
                  <option value="semua">Semua SPG</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.nama}</option>)}
                </select>
              </div>

              {/* Toko */}
              <div className="space-y-2">
                <Label className={textSecondary}>Toko</Label>
                <select value={filterToko} onChange={(e) => setFilterToko(e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm ${inputBg} ${inputText} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}>
                  <option value="semua">Semua Toko</option>
                  {tokoList.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Kategori */}
              <div className="space-y-2">
                <Label className={textSecondary}>Kategori</Label>
                <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm ${inputBg} ${inputText} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}>
                  <option value="semua">Semua Kategori</option>
                  <option value="Curah">Curah</option>
                  <option value="Pack">Pack / Karton</option>
                </select>
              </div>

              {/* Tgl Mulai */}
              <div className="space-y-2">
                <Label className={textSecondary}>Tgl Mulai</Label>
                <Input type="date" value={draftStartDate}
                  onChange={(e) => { setDraftStartDate(e.target.value); if (filterPeriod !== "custom") setFilterPeriod("custom") }}
                  disabled={filterPeriod !== "custom"}
                  className={`${inputBg} ${inputText} focus:ring-blue-500 ${filterPeriod !== "custom" ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Tgl Akhir */}
              <div className="space-y-2">
                <Label className={textSecondary}>Tgl Akhir</Label>
                <Input type="date" value={draftEndDate}
                  onChange={(e) => { setDraftEndDate(e.target.value); if (filterPeriod !== "custom") setFilterPeriod("custom") }}
                  disabled={filterPeriod !== "custom"}
                  className={`${inputBg} ${inputText} focus:ring-blue-500 ${filterPeriod !== "custom" ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Reset + Cari */}
              <div className="space-y-2">
                <Label className={`${textSecondary} opacity-0`}>Aksi</Label>
                <div className="flex gap-2">
                  <Button onClick={handleResetFilter} variant="outline"
                    className={`flex-1 ${theme === "dark" ? "bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 hover:text-white" : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100"}`}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  {filterPeriod === "custom" && (
                    <Button onClick={handleApplyFilter} disabled={!isDirty || !draftStartDate || !draftEndDate}
                      className="flex-1 gap-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40">
                      <Search className="w-4 h-4" />
                      Cari
                    </Button>
                  )}
                </div>
              </div>

              {/* Export */}
              <div className="space-y-2">
                <Label className={`${textSecondary} opacity-0`}>Export</Label>
                <div className="flex gap-2">
                  <Button onClick={handleExportToExcel} disabled={filteredData.length === 0 || loading}
                    className="flex-1 gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                    XLS
                  </Button>
                  <Button onClick={handleExportToCSV} disabled={filteredData.length === 0 || loading}
                    className={`flex-1 gap-1 text-xs border ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-900"}`}>
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                </div>
              </div>

            </div>

            {/* Active filter badges */}
            {(appliedStartDate || appliedEndDate || filterToko !== "semua" || filterKategori !== "semua" || appliedSpg !== "semua") && (
              <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs ${textMuted}`}>
                <Filter className="w-3 h-3 flex-shrink-0" />
                {(appliedStartDate || appliedEndDate) && (
                  <span className={`px-2 py-0.5 rounded-full border ${theme === "dark" ? "border-slate-600 bg-slate-700/50" : "border-slate-300 bg-slate-100"} ${textSecondary}`}>
                    📅 {appliedStartDate ? new Date(appliedStartDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Awal"}
                    {" → "}
                    {appliedEndDate ? new Date(appliedEndDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Akhir"}
                  </span>
                )}
                {appliedSpg !== "semua" && (
                  <span className={`px-2 py-0.5 rounded-full border ${theme === "dark" ? "border-slate-600 bg-slate-700/50" : "border-slate-300 bg-slate-100"} ${textSecondary}`}>
                    👤 {users.find((u) => u.id === appliedSpg)?.nama}
                  </span>
                )}
                {filterToko !== "semua" && (
                  <span className={`px-2 py-0.5 rounded-full border ${theme === "dark" ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-blue-300 bg-blue-50 text-blue-600"}`}>
                    🏪 {filterToko}
                  </span>
                )}
                {filterKategori !== "semua" && (
                  <span className={`px-2 py-0.5 rounded-full border ${
                    filterKategori === "Curah"
                      ? theme === "dark" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-emerald-300 bg-emerald-50 text-emerald-600"
                      : theme === "dark" ? "border-purple-500/40 bg-purple-500/10 text-purple-400" : "border-purple-300 bg-purple-50 text-purple-600"
                  }`}>
                    {filterKategori === "Curah" ? "⚖️ Curah" : "📦 Pack / Karton"}
                  </span>
                )}
                <span className={textMuted}>
                  · {filteredData.length} data{filteredData.length !== salesData.length ? ` (dari ${salesData.length})` : ""}
                </span>
              </div>
            )}

            {/* Delete bar */}
            {selectedIds.size > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <span className={`text-sm ${textPrimary} font-medium`}>{selectedIds.size} data terpilih</span>
                <Button onClick={handleDeleteSelected} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                  {isDeleting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Menghapus...</>
                    : <><XCircle className="w-4 h-4 mr-2" />Hapus Terpilih</>}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: "Total Transaksi", value: filteredData.length.toLocaleString(), icon: ShoppingCart, gradient: "from-blue-500 to-cyan-500" },
            { label: "Total Karton", value: totalKarton.toLocaleString(), icon: Package, gradient: "from-purple-500 to-pink-500" },
            { label: "Total Pack", value: totalPcs.toLocaleString(), icon: TrendingUp, gradient: "from-orange-500 to-red-500" },
            { label: "Total Gram", value: totalGram.toLocaleString(), icon: Weight, gradient: "from-emerald-500 to-teal-500" },
            { label: "Total Revenue", value: `Rp ${totalRevenue.toLocaleString("id-ID")}`, icon: DollarSign, gradient: "from-indigo-500 to-purple-500" },
          ].map(({ label, value, icon: Icon, gradient }) => (
            <Card key={label} className={`relative overflow-hidden ${cardBg} border ${cardBorder} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}>
              <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${textMuted} mb-1 uppercase tracking-wide`}>{label}</p>
                    <h3 className={`text-2xl font-bold ${textPrimary}`}>{value}</h3>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-cyan-500 animate-spin"
                    style={{ animationDirection: "reverse", animationDuration: "3s" }} />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-white animate-bounce" />
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Memuat Data Penjualan
                </h3>
                <div className="flex items-center justify-center gap-1 mt-3">
                  {[0, 150, 300].map((delay) => (
                    <div key={delay} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms`, backgroundColor: delay === 0 ? "#3b82f6" : delay === 150 ? "#a855f7" : "#ec4899" }} />
                  ))}
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className={`w-16 h-16 ${textMuted} mx-auto mb-4`} />
                <p className={textMuted}>Tidak ada data penjualan</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg" style={{ willChange: "scroll-position" }}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className={`border-b ${tableBorder} ${tableHeaderBg}`}>
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox"
                          checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      {["Tanggal Input", "Tanggal Transaksi", "SPG", "Produk", "Kategori", "Toko",
                        "Pack", "Karton", "Harga Pack", "Harga Karton", "Stock Pack", "Stock Karton", "Total", "Gram",
                      ].map((col) => (
                        <th key={col} className={`px-4 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider whitespace-nowrap`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, index) => (
                      <TableRow
                        key={item.id}
                        item={item}
                        index={index}
                        isSelected={selectedIds.has(item.id)}
                        onSelect={handleSelectOne}
                        tableBorder={tableBorder}
                        tableHoverBg={tableHoverBg}
                        tableBg={tableBg}
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                      />
                    ))}
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
