"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Package, Calculator, AlertCircle, CheckCircle2, TrendingUp, ShoppingBag, DollarSign, Calendar, Weight, Box } from "lucide-react"

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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Kategori produk
  const [selectedCategory, setSelectedCategory] = useState("Pack/Karton")
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    produkId: "",
    // Pack/Karton
    totalPcs: "",
    hargaPcs: "",
    hargaKarton: "",
    stockPack: "",
    stockKarton: "",
    // Curah (Simplified - no per gram calculation)
    totalGram: "",
    totalHargaCurah: "",
    // Common
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

  // Filter produk berdasarkan kategori
  useEffect(() => {
    const filtered = products.filter(p => p.category === selectedCategory)
    setFilteredProducts(filtered)
    
    // Reset form ketika ganti kategori
    setFormData({
      tanggal: formData.tanggal,
      produkId: "",
      totalPcs: "",
      hargaPcs: "",
      hargaKarton: "",
      stockPack: "",
      stockKarton: "",
      totalGram: "",
      totalHargaCurah: "",
      namaTokoTransaksi: formData.namaTokoTransaksi,
      notes: formData.notes,
    })
    setSelectedProduct(null)
    setConvertResult(null)
  }, [selectedCategory, products])

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

  // Auto-convert untuk Pack/Karton
  useEffect(() => {
    if (selectedCategory === "Pack/Karton" && selectedProduct && formData.totalPcs && formData.hargaPcs) {
      const totalPcs = Number(formData.totalPcs)
      const hargaPcs = Number(formData.hargaPcs)
      const hargaKarton = formData.hargaKarton ? Number(formData.hargaKarton) : 0
      const pcsPerKarton = selectedProduct.pcs_per_karton

      if (totalPcs > 0 && hargaPcs > 0 && pcsPerKarton > 0) {
        const karton = Math.floor(totalPcs / pcsPerKarton)
        const sisaPcs = totalPcs % pcsPerKarton
        
        // Hitung total: jika ada harga karton, pakai itu. Jika tidak, hitung semua sebagai pack
        let total = 0
        if (hargaKarton > 0) {
          total = (karton * hargaKarton) + (sisaPcs * hargaPcs)
        } else {
          total = totalPcs * hargaPcs
        }

        setConvertResult({ karton, sisaPcs, total })
      } else {
        setConvertResult(null)
      }
    } else {
      setConvertResult(null)
    }
  }, [formData.totalPcs, formData.hargaPcs, formData.hargaKarton, selectedProduct, selectedCategory])

  const handleProductChange = (produkId: string) => {
    const product = filteredProducts.find((p) => p.id === Number(produkId))
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

    if (!formData.produkId || !formData.namaTokoTransaksi) {
      setError("Produk dan nama toko wajib diisi")
      return
    }

    // Validasi berdasarkan kategori
    if (selectedCategory === "Pack/Karton") {
      if (!formData.totalPcs || !formData.hargaPcs || !formData.stockPack || !formData.stockKarton) {
        setError("Total pack, harga per pack, dan stok wajib diisi")
        return
      }
      if (!convertResult) {
        setError("Data konversi tidak valid")
        return
      }
    } else if (selectedCategory === "Curah") {
      if (!formData.totalGram || !formData.totalHargaCurah) {
        setError("Total gram dan total harga wajib diisi")
        return
      }
      const totalGram = Number(formData.totalGram)
      const totalHarga = Number(formData.totalHargaCurah)
      if (totalGram <= 0 || totalHarga <= 0) {
        setError("Total gram dan total harga harus lebih dari 0")
        return
      }
    }

    try {
      setSubmitting(true)

      const requestBody: any = {
        spgId: user?.id,
        tanggal: formData.tanggal,
        produkId: Number(formData.produkId),
        namaTokoTransaksi: formData.namaTokoTransaksi,
        notes: formData.notes,
        category: selectedCategory,
      }

      if (selectedCategory === "Pack/Karton") {
        requestBody.totalPcs = Number(formData.totalPcs)
        requestBody.hargaPcs = Number(formData.hargaPcs)
        requestBody.hargaKarton = formData.hargaKarton ? Number(formData.hargaKarton) : null
        requestBody.stockPack = Number(formData.stockPack)
        requestBody.stockKarton = Number(formData.stockKarton)
      } else if (selectedCategory === "Curah") {
        requestBody.totalGram = Number(formData.totalGram)
        requestBody.totalHargaCurah = Number(formData.totalHargaCurah)
      }

      const response = await fetch("/api/sales/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal menyimpan laporan")
      }

      const totalAmount = selectedCategory === "Pack/Karton" 
        ? convertResult?.total 
        : Number(formData.totalHargaCurah)

      setSuccess(`✅ Laporan berhasil disimpan! Total: Rp ${totalAmount?.toLocaleString('id-ID')}`)
      
      // Reset form
      setFormData({
        tanggal: new Date().toISOString().split("T")[0],
        produkId: "",
        totalPcs: "",
        hargaPcs: "",
        hargaKarton: "",
        stockPack: "",
        stockKarton: "",
        totalGram: "",
        totalHargaCurah: "",
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
  const isCurah = selectedCategory === "Curah"

  // Check if curah form is valid (for button enable/disable)
  const isCurahValid = isCurah && formData.totalGram && formData.totalHargaCurah && 
    Number(formData.totalGram) > 0 && Number(formData.totalHargaCurah) > 0

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
          {/* Kategori Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Kategori Produk</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory("Pack/Karton")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === "Pack/Karton"
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className={`w-5 h-5 ${
                    selectedCategory === "Pack/Karton" ? 'text-blue-600' : 'text-slate-400'
                  }`} />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Pack/Karton</div>
                    <div className="text-xs text-slate-500">Dijual per pack/karton</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("Curah")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === "Curah"
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Weight className={`w-5 h-5 ${
                    selectedCategory === "Curah" ? 'text-green-600' : 'text-slate-400'
                  }`} />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Curah</div>
                    <div className="text-xs text-slate-500">Dijual per gram</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Date & Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                {isCurah ? <Weight className="w-4 h-4 text-green-600" /> : <Package className="w-4 h-4 text-blue-600" />}
                Pilih Produk {isCurah ? "Curah" : "Pack/Karton"}
              </Label>
              <Select value={formData.produkId} onValueChange={handleProductChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Pilih produk..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">Tidak ada produk {selectedCategory}</div>
                  ) : (
                    filteredProducts.map((prod) => (
                      <SelectItem key={prod.id} value={String(prod.id)}>
                        {prod.nama} {!isCurah && `• ${prod.pcs_per_karton} pack/karton`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProduct && !isCurah && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm">1 karton = <b>{selectedProduct.pcs_per_karton} pack</b></span>
              </div>
            </div>
          )}

          {/* Form Pack/Karton */}
          {!isCurah && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Total Pack Terjual *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 20"
                    value={formData.totalPcs}
                    onChange={(e) => setFormData({ ...formData, totalPcs: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nama Toko *</Label>
                  <Input
                    placeholder="Contoh: Toko Sejahtera"
                    value={formData.namaTokoTransaksi}
                    onChange={(e) => setFormData({ ...formData, namaTokoTransaksi: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Harga per Karton (Opsional)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Kosongkan jika tidak jual karton"
                    value={formData.hargaKarton}
                    onChange={(e) => setFormData({ ...formData, hargaKarton: e.target.value })}
                    className="bg-white"
                  />
                  <p className="text-xs text-slate-500">Isi hanya jika ada penjualan per karton</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Harga per Pack *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 12000"
                    value={formData.hargaPcs}
                    onChange={(e) => setFormData({ ...formData, hargaPcs: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-amber-600" />
                    Stock Pack *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Stok pack yang tersisa"
                    value={formData.stockPack}
                    onChange={(e) => setFormData({ ...formData, stockPack: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-amber-600" />
                    Stock Karton *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Stok karton yang tersisa"
                    value={formData.stockKarton}
                    onChange={(e) => setFormData({ ...formData, stockKarton: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>

              {convertResult && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <Calculator className="w-4 h-4" />
                    <span className="font-semibold">Hasil Konversi:</span>
                  </div>
                  {formData.hargaKarton && Number(formData.hargaKarton) > 0 ? (
                    <>
                      <p className="text-sm text-green-700">
                        {convertResult.karton} karton + {convertResult.sisaPcs} pack
                      </p>
                      <p className="text-xs text-green-600">
                        ({convertResult.karton} × Rp {Number(formData.hargaKarton).toLocaleString("id-ID")} + {convertResult.sisaPcs} × Rp {Number(formData.hargaPcs).toLocaleString("id-ID")})
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-green-700">
                      {convertResult.sisaPcs} pack (semua dihitung per pack)
                    </p>
                  )}
                  <p className="text-lg font-bold text-green-900">
                    Total: Rp {convertResult.total.toLocaleString("id-ID")}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Form Curah - SIMPLIFIED */}
          {isCurah && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-green-600" />
                    Gram *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 500"
                    value={formData.totalGram}
                    onChange={(e) => setFormData({ ...formData, totalGram: e.target.value })}
                    className="bg-white"
                  />
                  <p className="text-xs text-slate-500">Tulis jumlah gram yang terjual</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Harga *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 50000"
                    value={formData.totalHargaCurah}
                    onChange={(e) => setFormData({ ...formData, totalHargaCurah: e.target.value })}
                    className="bg-white"
                  />
                  <p className="text-xs text-slate-500">Tulis total uang yang diterima</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Nama Toko *</Label>
                  <Input
                    placeholder="Contoh: Warung Bu Lastri"
                    value={formData.namaTokoTransaksi}
                    onChange={(e) => setFormData({ ...formData, namaTokoTransaksi: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Display simple summary for Curah */}
              {formData.totalGram && formData.totalHargaCurah && Number(formData.totalGram) > 0 && Number(formData.totalHargaCurah) > 0 && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Ringkasan Penjualan:</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Terjual: <b>{Number(formData.totalGram).toLocaleString("id-ID")} gram</b>
                  </p>
                  <p className="text-lg font-bold text-green-900">
                    Total: Rp {Number(formData.totalHargaCurah).toLocaleString("id-ID")}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Catatan (Opsional)</Label>
            <Input
              placeholder="Tambahkan catatan jika perlu..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-white"
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || (!convertResult && !isCurahValid)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 text-base"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Simpan Laporan Penjualan
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}