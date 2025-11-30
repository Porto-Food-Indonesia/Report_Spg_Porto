"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileSpreadsheet } from "lucide-react"
import * as XLSX from 'xlsx'

interface SalesReport {
  id: string
  tanggal: string
  spgId: string
  spgNama: string
  produk: string
  produkPcsPerKarton: number  // ✅ TAMBAH
  penjualanKarton: number     // ✅ UBAH
  penjualanPcs: number        // ✅ UBAH
  hargaKarton: number         // ✅ UBAH
  hargaPcs: number            // ✅ UBAH
  total: number
  toko: string
}

interface User {
  id: string
  nama: string
  role: string
}

export default function SalesReportView() {
  const [salesData, setSalesData] = useState<SalesReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Filter states
  const [selectedSpg, setSelectedSpg] = useState("semua")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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
      alert("Tidak ada data untuk diekspor")
      return
    }

    try {
      // ✅ Siapkan data untuk export dengan field baru
      const exportData = salesData.map((item, index) => ({
        'No': index + 1,
        'Tanggal': new Date(item.tanggal).toLocaleDateString('id-ID'),
        'SPG': item.spgNama,
        'Produk': item.produk,
        'Toko': item.toko,
        'Karton Terjual': item.penjualanKarton || 0,
        'Pcs Terjual': item.penjualanPcs || 0,
        'Total Pcs': (item.penjualanKarton * item.produkPcsPerKarton) + item.penjualanPcs,
        'Harga/Karton': item.hargaKarton || 0,
        'Harga/Pcs': item.hargaPcs || 0,
        'Total': item.total || 0
      }))

      // Buat worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },   // No
        { wch: 12 },  // Tanggal
        { wch: 20 },  // SPG
        { wch: 25 },  // Produk
        { wch: 25 },  // Toko
        { wch: 12 },  // Karton
        { wch: 12 },  // Pcs
        { wch: 12 },  // Total Pcs
        { wch: 15 },  // Harga Karton
        { wch: 15 },  // Harga Pcs
        { wch: 15 },  // Total
      ]

      // Buat workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Penjualan')

      // Generate filename dengan filter info
      const spgName = selectedSpg === "semua" ? "Semua_SPG" : users.find(u => u.id === selectedSpg)?.nama || "SPG"
      const dateRange = startDate && endDate 
        ? `${startDate}_to_${endDate}`
        : new Date().toISOString().split('T')[0]
      const filename = `Laporan_Penjualan_${spgName}_${dateRange}.xlsx`

      // Download file
      XLSX.writeFile(workbook, filename)
      
      alert("Data berhasil diekspor ke Excel!")
    } catch (err) {
      console.error('Export error:', err)
      alert('Gagal mengekspor data: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleExportToCSV = () => {
    if (salesData.length === 0) {
      alert("Tidak ada data untuk diekspor")
      return
    }

    try {
      // ✅ Create CSV headers dengan field baru
      const headers = ["No", "Tanggal", "SPG", "Produk", "Toko", "Karton", "Pcs", "Total Pcs", "Harga Karton", "Harga Pcs", "Total"]
      
      // ✅ Create CSV rows dengan field baru
      const rows = salesData.map((item, index) => [
        index + 1,
        new Date(item.tanggal).toLocaleDateString('id-ID'),
        item.spgNama,
        item.produk,
        item.toko,
        item.penjualanKarton || 0,
        item.penjualanPcs || 0,
        (item.penjualanKarton * item.produkPcsPerKarton) + item.penjualanPcs,
        item.hargaKarton || 0,
        item.hargaPcs || 0,
        item.total || 0
      ])

      // Combine headers and rows
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

      // Create and download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const spgName = selectedSpg === "semua" ? "Semua_SPG" : users.find(u => u.id === selectedSpg)?.nama || "SPG"
      const dateRange = startDate && endDate 
        ? `${startDate}_to_${endDate}`
        : new Date().toISOString().split('T')[0]
      
      link.download = `Laporan_Penjualan_${spgName}_${dateRange}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      alert("Data berhasil diekspor ke CSV!")
    } catch (err) {
      console.error('Export CSV error:', err)
      alert('Gagal mengekspor data: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // ✅ Hitung total dengan safe checking
  const totalRevenue = Array.isArray(salesData) 
    ? salesData.reduce((sum, item) => sum + (item.total || 0), 0)
    : 0

  const totalPcs = Array.isArray(salesData)
    ? salesData.reduce((sum, item) => sum + ((item.penjualanKarton || 0) * (item.produkPcsPerKarton || 1)) + (item.penjualanPcs || 0), 0)
    : 0

  const totalKarton = Array.isArray(salesData)
    ? salesData.reduce((sum, item) => sum + (item.penjualanKarton || 0), 0)
    : 0

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm">Total Pcs Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPcs.toLocaleString()}</p>
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
                    <th className="px-4 py-3 text-left text-sm font-medium">Tanggal</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">SPG</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Produk</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Toko</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Karton</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Pcs</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Harga Karton</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Harga Pcs</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(item.tanggal).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-sm">{item.spgNama}</td>
                      <td className="px-4 py-3 text-sm">{item.produk}</td>
                      <td className="px-4 py-3 text-sm">{item.toko}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.penjualanKarton || 0}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.penjualanPcs || 0}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        Rp {(item.hargaKarton || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        Rp {(item.hargaPcs || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                        Rp {(item.total || 0).toLocaleString("id-ID")}
                      </td>
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