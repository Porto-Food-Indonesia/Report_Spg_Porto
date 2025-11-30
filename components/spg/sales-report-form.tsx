"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Package, Calculator, AlertCircle, CheckCircle2, TrendingUp, ShoppingBag, DollarSign, Calendar } from "lucide-react"

interface Product {
  id: number
  nama: string
  sku: string
  category: string
  pcs_per_karton: number
  status: string
}

export default function SalesReportForm() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    produkId: "",
    totalPcs: "",
    hargaPcs: "",
    hargaKarton: "",
    namaTokoTransaksi: "",
    notes: "",
  })

  const [convertResult, setConvertResult] = useState<{
    karton: number
    sisaPcs: number
    total: number
  } | null>(null)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [dateError, setDateError] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products/active")
      const data = await response.json()

      if (Array.isArray(data)) {
        setProducts(data)
      } else {
        setProducts([])
      }
    } catch (err) {
      console.error("❌ Gagal ambil produk:", err)
      setError("Gagal mengambil data produk")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-convert
  useEffect(() => {
    if (selectedProduct && formData.totalPcs && formData.hargaPcs && formData.hargaKarton) {
      const totalPcs = Number(formData.totalPcs)
      const hargaPcs = Number(formData.hargaPcs)
      const hargaKarton = Number(formData.hargaKarton)
      const pcsPerKarton = selectedProduct.pcs_per_karton

      if (totalPcs > 0 && hargaPcs > 0 && hargaKarton > 0 && pcsPerKarton > 0) {
        const karton = Math.floor(totalPcs / pcsPerKarton)
        const sisaPcs = totalPcs % pcsPerKarton
        const total = (karton * hargaKarton) + (sisaPcs * hargaPcs)

        setConvertResult({ karton, sisaPcs, total })
      } else {
        setConvertResult(null)
      }
    } else {
      setConvertResult(null)
    }
  }, [formData.totalPcs, formData.hargaPcs, formData.hargaKarton, selectedProduct])

  const handleProductChange = (produkId: string) => {
    const product = products.find((p) => p.id === Number(produkId))
    setSelectedProduct(product || null)
    setFormData({ ...formData, produkId })
  }

  const handleDateChange = (newDate: string) => {
    const selectedDate = new Date(newDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate > today) {
      setDateError("❌ Tidak bisa input tanggal masa depan!")
      return
    }

    setDateError("")
    setFormData({ ...formData, tanggal: newDate })
  }

  const handleSubmit = async () => {
    setError("")
    setSuccess("")

    if (dateError) {
      setError("Tanggal tidak valid")
      return
    }

    if (!formData.produkId || !formData.totalPcs || !formData.hargaPcs || !formData.hargaKarton || !formData.namaTokoTransaksi) {
      setError("Semua field wajib diisi")
      return
    }

    if (!convertResult) {
      setError("Data konversi tidak valid")
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch("/api/sales/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spgId: user?.id,
          tanggal: formData.tanggal,
          produkId: Number(formData.produkId),
          totalPcs: Number(formData.totalPcs),
          hargaPcs: Number(formData.hargaPcs),
          hargaKarton: Number(formData.hargaKarton),
          namaTokoTransaksi: formData.namaTokoTransaksi,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal menyimpan laporan")
      }

      setSuccess(`✅ Laporan berhasil disimpan! Total: Rp ${convertResult.total.toLocaleString('id-ID')}`)
      
      setFormData({
        tanggal: new Date().toISOString().split("T")[0],
        produkId: "",
        totalPcs: "",
        hargaPcs: "",
        hargaKarton: "",
        namaTokoTransaksi: "",
        notes: "",
      })
      setSelectedProduct(null)
      setConvertResult(null)
    } catch (err) {
      console.error("❌ Gagal submit:", err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  const maxDate = new Date().toISOString().split("T")[0]

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      {/* Hero Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Input Laporan Penjualan</h1>
            <p className="text-xs sm:text-sm text-slate-600">Catat penjualan harian Anda dengan mudah</p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Oops! Ada kesalahan</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900">Berhasil!</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Date & Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div className="space-y-2">
              <Label htmlFor="tanggal" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600" />
                Tanggal Transaksi
              </Label>
              <Input
                id="tanggal"
                type="date"
                max={maxDate}
                value={formData.tanggal}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`h-11 ${dateError ? "border-red-500 focus:ring-red-500" : "border-slate-300 focus:ring-blue-500"}`}
              />
              {dateError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 animate-in slide-in-from-left duration-200">
                  <AlertCircle className="w-3 h-3" />
                  {dateError}
                </div>
              )}
            </div>

            {/* Produk */}
            <div className="space-y-2">
              <Label htmlFor="produk" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Package className="w-4 h-4 text-blue-600" />
                Pilih Produk <span className="text-red-500">*</span>
              </Label>
              {loading ? (
                <div className="h-11 flex items-center px-4 bg-slate-50 border border-slate-300 rounded-md">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="text-sm text-slate-500">Loading produk...</span>
                </div>
              ) : (
                <Select value={formData.produkId} onValueChange={handleProductChange}>
                  <SelectTrigger className="h-11 border-slate-300 focus:ring-blue-500">
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((prod) => (
                      <SelectItem key={prod.id} value={String(prod.id)}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prod.nama}</span>
                          <span className="text-xs text-slate-500">• {prod.pcs_per_karton} pcs/karton</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Info Produk Terpilih */}
          {selectedProduct && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg animate-in slide-in-from-left duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">{selectedProduct.nama}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    1 karton = <span className="font-bold">{selectedProduct.pcs_per_karton} pcs</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity & Price Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Pcs */}
            <div className="space-y-2">
              <Label htmlFor="totalPcs" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Total Pcs Terjual <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalPcs"
                type="number"
                min="1"
                placeholder="Contoh: 20"
                value={formData.totalPcs}
                onChange={(e) => setFormData({ ...formData, totalPcs: e.target.value })}
                disabled={!selectedProduct}
                className="h-11 border-slate-300 focus:ring-green-500 disabled:bg-slate-100"
              />
            </div>

            {/* Nama Toko */}
            <div className="space-y-2">
              <Label htmlFor="namaTokoTransaksi" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ShoppingBag className="w-4 h-4 text-purple-600" />
                Nama Toko <span className="text-red-500">*</span>
              </Label>
              <Input
                id="namaTokoTransaksi"
                placeholder="Masukkan nama toko"
                value={formData.namaTokoTransaksi}
                onChange={(e) => setFormData({ ...formData, namaTokoTransaksi: e.target.value })}
                className="h-11 border-slate-300 focus:ring-purple-500"
              />
            </div>

            {/* Harga Karton */}
            <div className="space-y-2">
              <Label htmlFor="hargaKarton" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Harga per Karton <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                <Input
                  id="hargaKarton"
                  type="number"
                  min="0"
                  placeholder="200000"
                  value={formData.hargaKarton}
                  onChange={(e) => setFormData({ ...formData, hargaKarton: e.target.value })}
                  disabled={!selectedProduct}
                  className="h-11 pl-10 border-slate-300 focus:ring-emerald-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Harga Pcs */}
            <div className="space-y-2">
              <Label htmlFor="hargaPcs" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <DollarSign className="w-4 h-4 text-amber-600" />
                Harga per Pcs <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                <Input
                  id="hargaPcs"
                  type="number"
                  min="0"
                  placeholder="15000"
                  value={formData.hargaPcs}
                  onChange={(e) => setFormData({ ...formData, hargaPcs: e.target.value })}
                  disabled={!selectedProduct}
                  className="h-11 pl-10 border-slate-300 focus:ring-amber-500 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Preview Konversi */}
          {convertResult && (
            <div className="p-5 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-300 rounded-xl shadow-lg animate-in zoom-in duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-emerald-900 text-base sm:text-lg">Hasil Konversi Otomatis</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-white/80 backdrop-blur p-4 rounded-xl shadow-md border border-emerald-200">
                  <p className="text-xs text-slate-600 mb-2">Karton</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{convertResult.karton}</p>
                  <p className="text-xs text-slate-500 mt-2">@ Rp {Number(formData.hargaKarton).toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-white/80 backdrop-blur p-4 rounded-xl shadow-md border border-blue-200">
                  <p className="text-xs text-slate-600 mb-2">Sisa Pcs</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">{convertResult.sisaPcs}</p>
                  <p className="text-xs text-slate-500 mt-2">@ Rp {Number(formData.hargaPcs).toLocaleString('id-ID')}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-4 rounded-xl shadow-md sm:col-span-1 col-span-1">
                  <p className="text-xs text-emerald-100 mb-2">Total Harga</p>
                  <p className="text-xl sm:text-2xl font-bold text-white break-words">
                    Rp {convertResult.total.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/60 backdrop-blur rounded-lg border border-emerald-200">
                <p className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold">Perhitungan:</span> ({convertResult.karton} karton × Rp {Number(formData.hargaKarton).toLocaleString('id-ID')}) + ({convertResult.sisaPcs} pcs × Rp {Number(formData.hargaPcs).toLocaleString('id-ID')}) = <span className="font-bold text-emerald-700">Rp {convertResult.total.toLocaleString('id-ID')}</span>
                </p>
              </div>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
              Catatan (Opsional)
            </Label>
            <Input
              id="notes"
              placeholder="Tambahkan catatan jika diperlukan..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="h-11 border-slate-300 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={submitting || !convertResult || !!dateError} 
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Laporan...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Simpan Laporan Penjualan</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}