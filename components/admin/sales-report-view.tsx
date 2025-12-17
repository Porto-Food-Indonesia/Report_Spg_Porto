"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileSpreadsheet, Weight, CheckCircle2, XCircle } from "lucide-react"
import * as XLSX from 'xlsx'

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
  type: 'success' | 'error'
}

export default function SalesReportView() {
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])
  
  // Filter states
  const [selectedSpg, setSelectedSpg] = useState("semua")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Toast function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3000)
  }

  // Fetch data saat komponen dimuat
  useEffect(() => {
    fetchSalesData()
    fetchUsers()
  }, [])

  // Fetch ulang saat filter berubah
  useEffect(() => {
    if (!loading) {
      fetchSalesData()
    }
  }, [selectedSpg, startDate, endDate])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/list")
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.warn("⚠️ Users response bukan array:", data)
        setUsers([])
      }
    } catch (err) {
      console.error("❌ Gagal fetch users:", err)
      setUsers([])
    }
  }

  const fetchSalesData = async () => {
    try {
      setLoading(true)
      setError("")

      // Build query params
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
        console.error("⚠️ Response bukan array:", data)
        setSalesData([])
        setError("Format data tidak valid")
      }
    } catch (err) {
      console.error("❌ Error fetching sales:", err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      setSalesData([])
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilter = () => {
    setSelectedSpg("semua")
    setStartDate("")
    setEndDate("")
  }

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
          "NO": index + 1,
          "TANGGAL INPUT": item.created_at 
            ? new Date(item.created_at).toLocaleString("id-ID", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })
            : "-",
          "TANGGAL TRANSAKSI": new Date(item.tanggal).toLocaleDateString("id-ID"),
          "NAMA": item.spgNama,
          "PRODUK": item.produk,
          "PACK": isCurah ? "-" : (item.penjualanPcs || 0),
          "KARTON": isCurah ? "-" : (item.penjualanKarton || 0),
          "HARGA_PACK": isCurah ? (item.hargaPcs || 0) : (item.hargaPcs || 0),
          "HARGA_KARTON": isCurah ? "-" : (item.hargaKarton || 0),
          "STOCK_PACK": isCurah ? "-" : stockPack,
          "STOCK_KARTON": isCurah ? "-" : (item.penjualanKarton || 0),
          "TOTAL_SELLOUT": item.total || 0,
          "TOKO": item.toko || "-",
          "GRAM": isCurah ? (item.penjualanGram || 0) : "-",
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(exportData)

      worksheet['!cols'] = [
        { wch: 5 },   // NO
        { wch: 20 },  // TANGGAL INPUT
        { wch: 18 },  // TANGGAL TRANSAKSI
        { wch: 20 },  // NAMA
        { wch: 25 },  // PRODUK
        { wch: 10 },  // PACK
        { wch: 10 },  // KARTON
        { wch: 15 },  // HARGA_PACK
        { wch: 15 },  // HARGA_KARTON
        { wch: 15 },  // STOCK_PACK
        { wch: 15 },  // STOCK_KARTON
        { wch: 18 },  // TOTAL_SELLOUT
        { wch: 30 },  // TOKO
        { wch: 12 },  // GRAM
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'LAPORAN PENJUALAN')

      const spgName = selectedSpg === "semua" ? "Semua_SPG" : users.find(u => u.id === selectedSpg)?.nama || "SPG"
      const dateRange = startDate && endDate 
        ? `${startDate}_to_${endDate}`
        : new Date().toISOString().split('T')[0]
      const filename = `LAPORAN_PENJUALAN_${spgName}_${dateRange}.xlsx`

      XLSX.writeFile(workbook, filename)
      
      showToast("Data berhasil diekspor ke Excel!", "success")
    } catch (err) {
      console.error('Export error:', err)
      showToast('Gagal mengekspor data', 'error')
    }
  }

  const handleExportToCSV = () => {
    if (salesData.length === 0) {
      showToast("Tidak ada data untuk diekspor", "error")
      return
    }

    try {
      const headers = ["NO", "TANGGAL INPUT", "TANGGAL TRANSAKSI", "NAMA", "PRODUK", "PACK", "KARTON", "HARGA_PACK", "HARGA_KARTON", "STOCK_PACK", "STOCK_KARTON", "TOTAL_SELLOUT", "TOKO", "GRAM"]
      
      const rows = salesData.map((item, index) => {
        const stockPack = (item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)
        const isCurah = item.produkCategory === "Curah"
        
        return [
          index + 1,
          item.created_at 
            ? new Date(item.created_at).toLocaleString('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })
            : "-",
          new Date(item.tanggal).toLocaleDateString('id-ID'),
          item.spgNama,
          item.produk,
          isCurah ? "-" : (item.penjualanPcs || 0),
          isCurah ? "-" : (item.penjualanKarton || 0),
          isCurah ? (item.hargaPcs || 0) : (item.hargaPcs || 0),
          isCurah ? "-" : (item.hargaKarton || 0),
          isCurah ? "-" : stockPack,
          isCurah ? "-" : (item.penjualanKarton || 0),
          item.total || 0,
          item.toko || "-",
          isCurah ? (item.penjualanGram || 0) : "-"
        ]
      })

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => {
          const cellStr = String(cell)
          if (cellStr.includes(',') || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const spgName = selectedSpg === "semua" ? "Semua_SPG" : users.find(u => u.id === selectedSpg)?.nama || "SPG"
      const dateRange = startDate && endDate 
        ? `${startDate}_to_${endDate}`
        : new Date().toISOString().split('T')[0]
      
      link.download = `LAPORAN_PENJUALAN_${spgName}_${dateRange}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast("Data berhasil diekspor ke CSV!", "success")
    } catch (err) {
      console.error('Export CSV error:', err)
      showToast('Gagal mengekspor data', 'error')
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-5 duration-300 ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spg-select">SPG</Label>
              <select
                id="spg-select"
                value={selectedSpg}
                onChange={(e) => setSelectedSpg(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="semua">Semua SPG</option>
                {Array.isArray(users) && users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button onClick={handleResetFilter} variant="outline" className="w-full">
                Reset Filter
              </Button>
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <Button 
                onClick={handleExportToExcel} 
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                disabled={salesData.length === 0 || loading}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button 
                onClick={handleExportToCSV} 
                variant="outline"
                className="flex-1 gap-2"
                disabled={salesData.length === 0 || loading}
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Array.isArray(salesData) ? salesData.length : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Karton Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalKarton.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Pack Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPcs.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Weight className="w-4 h-4" />
              Total Gram (Curah)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalGram.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 mb-4 bg-red-100 border border-red-300 rounded text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-slate-500">
              Loading data...
            </div>
          ) : !Array.isArray(salesData) || salesData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Tidak ada data penjualan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Tanggal Input</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tanggal Transaksi</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">SPG</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Produk</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Kategori</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Toko</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Pack</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Karton</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Harga Pack</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Harga Karton</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Stock Pack</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Stock Karton</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Gram</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((item) => {
                    const isCurah = item.produkCategory === "Curah"
                    const stockPack = (item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)
                    return (
                      <tr key={item.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm">
                          {item.created_at 
                            ? new Date(item.created_at).toLocaleString("id-ID", {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })
                            : "-"
                          }
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(item.tanggal).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-sm">{item.spgNama}</td>
                        <td className="px-4 py-3 text-sm">{item.produk}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            isCurah 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isCurah && <Weight className="w-3 h-3" />}
                            {item.produkCategory || "Pack/Karton"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.toko}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isCurah ? "-" : (item.penjualanPcs || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isCurah ? "-" : (item.penjualanKarton || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isCurah ? (
                            <span className="font-semibold text-green-700">
                              Rp {(item.hargaPcs || 0).toLocaleString("id-ID")}
                              <div className="text-xs text-slate-500">(Total Curah)</div>
                            </span>
                          ) : (
                            <span>Rp {(item.hargaPcs || 0).toLocaleString("id-ID")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isCurah ? "-" : (
                            <span>Rp {(item.hargaKarton || 0).toLocaleString("id-ID")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isCurah ? "-" : stockPack}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isCurah ? "-" : (item.penjualanKarton || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                          Rp {(item.total || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {isCurah ? (
                            <span className="font-semibold text-green-700">
                              {(item.penjualanGram || 0).toLocaleString()} gr
                            </span>
                          ) : "-"}
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
  )
}