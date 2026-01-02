"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Package, Calculator, AlertCircle, CheckCircle2, ShoppingBag, DollarSign, Calendar, Weight, Box, Search, AlertTriangle, X } from "lucide-react"

interface Product {
  id: number
  nama: string
  sku: string
  category: string
  pcs_per_karton: number
  status: string
}

interface SalesReportFormProps {
  theme: "dark" | "light"
}

export default function SalesReportForm({ theme }: SalesReportFormProps) {
  const { user } = useAuth()
  const isDark = theme === 'dark'
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const [selectedCategory, setSelectedCategory] = useState("Pack/Karton")
  
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    produkId: "",
    jumlahKarton: "",
    jumlahPack: "",
    hargaPcs: "",
    hargaKarton: "",
    stockPack: "",
    stockKarton: "",
    totalGram: "",
    totalHargaCurah: "",
    namaTokoTransaksi: "",
    notes: "",
  })

  const [totalHarga, setTotalHarga] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [dateError, setDateError] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    let filtered = products.filter(p => p.category === selectedCategory)
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.nama.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
      )
    }
    
    setFilteredProducts(filtered)
  }, [selectedCategory, products, searchQuery])

  useEffect(() => {
    setFormData({
      tanggal: formData.tanggal,
      produkId: "",
      jumlahKarton: "",
      jumlahPack: "",
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
    setTotalHarga(0)
    setSearchQuery("")
  }, [selectedCategory])

  useEffect(() => {
    if (showSearchModal && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [showSearchModal])

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

  useEffect(() => {
    if (selectedCategory === "Pack/Karton") {
      const jumlahKarton = Number(formData.jumlahKarton) || 0
      const jumlahPack = Number(formData.jumlahPack) || 0
      const hargaKarton = Number(formData.hargaKarton) || 0
      const hargaPcs = Number(formData.hargaPcs) || 0

      const totalKarton = jumlahKarton * hargaKarton
      const totalPack = jumlahPack * hargaPcs
      const total = totalKarton + totalPack

      setTotalHarga(total)
    }
  }, [formData.jumlahKarton, formData.jumlahPack, formData.hargaKarton, formData.hargaPcs, selectedCategory])

  const handleProductSelect = (produkId: string) => {
    const product = filteredProducts.find((p) => p.id === Number(produkId))
    setSelectedProduct(product || null)
    setFormData({ ...formData, produkId })
    setShowSearchModal(false)
    setSearchQuery("")
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

  const handleSubmitClick = () => {
    setError("")

    if (dateError) {
      setError("Tanggal tidak valid")
      return
    }

    if (!formData.produkId || !formData.namaTokoTransaksi) {
      setError("Produk dan nama toko wajib diisi")
      return
    }

    if (selectedCategory === "Pack/Karton") {
      const jumlahKarton = Number(formData.jumlahKarton) || 0
      const jumlahPack = Number(formData.jumlahPack) || 0
      
      if (jumlahKarton === 0 && jumlahPack === 0) {
        setError("Minimal harus ada penjualan karton atau pack")
        return
      }
      
      if (jumlahKarton > 0 && !formData.hargaKarton) {
        setError("Harga per karton wajib diisi jika ada penjualan karton")
        return
      }
      
      if (jumlahPack > 0 && !formData.hargaPcs) {
        setError("Harga per pack wajib diisi jika ada penjualan pack")
        return
      }
      
      if (!formData.stockPack || !formData.stockKarton) {
        setError("Stok pack dan karton wajib diisi")
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

    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false)
    setShowSuccessModal(true)
    
    const oldFormData = { ...formData }
    const oldProduct = selectedProduct
    const oldTotalHarga = totalHarga
    
    setFormData({
      tanggal: new Date().toISOString().split("T")[0],
      produkId: "",
      jumlahKarton: "",
      jumlahPack: "",
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
    setTotalHarga(0)
    setSearchQuery("")
    
    try {
      setSubmitting(true)

      const requestBody: any = {
        spgId: user?.id,
        tanggal: oldFormData.tanggal,
        produkId: Number(oldFormData.produkId),
        namaTokoTransaksi: oldFormData.namaTokoTransaksi,
        notes: oldFormData.notes,
        category: selectedCategory,
      }

      if (selectedCategory === "Pack/Karton") {
        const jumlahKarton = Number(oldFormData.jumlahKarton) || 0
        const jumlahPack = Number(oldFormData.jumlahPack) || 0
        const pcsPerKarton = oldProduct?.pcs_per_karton || 0
        const totalPcs = (jumlahKarton * pcsPerKarton) + jumlahPack
        
        requestBody.totalPcs = totalPcs
        requestBody.jumlahKarton = jumlahKarton
        requestBody.jumlahPack = jumlahPack
        requestBody.hargaPcs = oldFormData.hargaPcs ? Number(oldFormData.hargaPcs) : null
        requestBody.hargaKarton = oldFormData.hargaKarton ? Number(oldFormData.hargaKarton) : null
        requestBody.stockPack = Number(oldFormData.stockPack)
        requestBody.stockKarton = Number(oldFormData.stockKarton)
      } else if (selectedCategory === "Curah") {
        requestBody.totalGram = Number(oldFormData.totalGram)
        requestBody.totalHargaCurah = Number(oldFormData.totalHargaCurah)
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

      setTimeout(() => {
        setShowSuccessModal(false)
      }, 2500)
    } catch (err) {
      console.error("❌ Gagal submit:", err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      setShowSuccessModal(false)
      setFormData(oldFormData)
      setSelectedProduct(oldProduct)
      setTotalHarga(oldTotalHarga)
    } finally {
      setSubmitting(false)
    }
  }

  const maxDate = new Date().toISOString().split("T")[0]
  const isCurah = selectedCategory === "Curah"

  const isCurahValid = isCurah && formData.totalGram && formData.totalHargaCurah && 
    Number(formData.totalGram) > 0 && Number(formData.totalHargaCurah) > 0

  const isPackKartonValid = !isCurah && selectedProduct && 
    (Number(formData.jumlahKarton) > 0 || Number(formData.jumlahPack) > 0) &&
    formData.stockPack && formData.stockKarton &&
    ((Number(formData.jumlahKarton) > 0 && formData.hargaKarton) || 
     (Number(formData.jumlahPack) > 0 && formData.hargaPcs))

  const cardBg = isDark ? "bg-slate-800/50 backdrop-blur border-slate-700" : "bg-white/80 backdrop-blur border-slate-200"
  const textClass = isDark ? "text-slate-100" : "text-slate-900"
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600"
  const inputBg = isDark ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-200"
  const modalBg = isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
  const overlayBg = isDark ? "bg-black/70" : "bg-black/50"

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 pb-6">
      {showSearchModal && (
        <div 
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center ${overlayBg} backdrop-blur-sm animate-in fade-in duration-200`}
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className={`${modalBg} rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 border-2 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[90vh] sm:max-h-[80vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}>
              <h3 className={`text-lg font-bold ${textClass}`}>Pilih Produk</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari nama atau SKU produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 h-11 px-3 py-2 text-sm border ${inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredProducts.length === 0 ? (
                <div className={`p-8 text-center ${textSecondary}`}>
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? "Produk tidak ditemukan" : `Tidak ada produk ${selectedCategory}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleProductSelect(String(prod.id))}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        formData.produkId === String(prod.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : `border-slate-200 dark:border-slate-700 ${isDark ? 'bg-slate-700/50' : 'bg-white'} hover:border-slate-300 dark:hover:border-slate-600`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${isCurah ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} flex items-center justify-center flex-shrink-0`}>
                          {isCurah ? (
                            <Weight className="w-5 h-5 text-green-600" />
                          ) : (
                            <Package className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${textClass} truncate`}>{prod.nama}</p>
                          <p className={`text-xs ${textSecondary}`}>SKU: {prod.sku}</p>
                          {!isCurah && (
                            <p className={`text-xs ${textSecondary} mt-1`}>
                              {prod.pcs_per_karton} pack/karton
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm animate-in fade-in duration-200 p-4`}>
          <div className={`${modalBg} rounded-2xl shadow-2xl max-w-md w-full border-2 animate-in zoom-in duration-300`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className={`text-xl font-bold ${textClass}`}>Konfirmasi Laporan</h3>
                <p className={`text-sm ${textSecondary}`}>Pastikan data sudah benar sebelum menyimpan</p>
              </div>

              <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className={textSecondary}>Produk:</span>
                    <span className={`font-semibold ${textClass} text-right`}>{selectedProduct?.nama}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className={textSecondary}>Toko:</span>
                    <span className={`font-semibold ${textClass} text-right truncate`}>{formData.namaTokoTransaksi}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className={textSecondary}>Total:</span>
                    <span className="font-bold text-green-500">
                      Rp {(isCurah ? Number(formData.totalHargaCurah) : totalHarga).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  variant="outline"
                  className={`flex-1 ${isDark ? 'bg-slate-700 hover:bg-slate-600 border-slate-600' : 'bg-white hover:bg-slate-50'}`}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  Ya, Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm animate-in fade-in duration-200 p-4`}>
          <div className={`${modalBg} rounded-2xl shadow-2xl max-w-md w-full border-2 animate-in zoom-in duration-300`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg animate-bounce">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className={`text-xl font-bold ${textClass}`}>Berhasil Disimpan! 🎉</h3>
                <p className={`text-sm ${textSecondary}`}>Laporan penjualan tersimpan ke sistem</p>
              </div>

              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${textClass}`}>Input Laporan Penjualan</h1>
            <p className={`text-xs sm:text-sm ${textSecondary}`}>Catat penjualan harian Anda</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-400">Ada kesalahan</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <Card className={`border-0 shadow-xl ${cardBg}`}>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <Label className={`text-sm font-medium ${textClass}`}>Kategori Produk</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory("Pack/Karton")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === "Pack/Karton"
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : `border-slate-200 dark:border-slate-700 ${isDark ? 'bg-slate-700/50' : 'bg-white'}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className={`w-5 h-5 ${selectedCategory === "Pack/Karton" ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div className={`font-semibold text-sm ${selectedCategory === "Pack/Karton" ? 'text-blue-600' : textClass}`}>Pack/Karton</div>
                    <div className={`text-xs ${textSecondary}`}>Per pack/karton</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("Curah")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === "Curah"
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : `border-slate-200 dark:border-slate-700 ${isDark ? 'bg-slate-700/50' : 'bg-white'}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <Weight className={`w-5 h-5 ${selectedCategory === "Curah" ? 'text-green-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div className={`font-semibold text-sm ${selectedCategory === "Curah" ? 'text-green-600' : textClass}`}>Curah</div>
                    <div className={`text-xs ${textSecondary}`}>Per gram</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal" className={`flex items-center gap-2 text-sm font-medium ${textClass}`}>
                <Calendar className="w-4 h-4 text-blue-600" />
                Tanggal Transaksi
              </Label>
              <Input
                id="tanggal"
                type="date"
                max={maxDate}
                value={formData.tanggal}
                onChange={(e) => handleDateChange(e.target.value)}
                className={inputBg}
              />
            </div>

            <div className="space-y-2">
              <Label className={`flex items-center gap-2 text-sm font-medium ${textClass}`}>
                {isCurah ? <Weight className="w-4 h-4 text-green-600" /> : <Package className="w-4 h-4 text-blue-600" />}
                Pilih Produk {isCurah ? "Curah" : "Pack/Karton"}
              </Label>
              
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className={`w-full h-10 px-3 rounded-md border ${inputBg} text-left flex items-center justify-between hover:border-blue-400 transition-colors`}
              >
                <span className={selectedProduct ? textClass : textSecondary}>
                  {selectedProduct ? selectedProduct.nama : "Pilih produk..."}
                </span>
                <Search className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {selectedProduct && !isCurah && (
            <div className={`p-4 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border-l-4 border-blue-500 rounded-lg`}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className={`text-sm ${textClass}`}>1 karton = <b>{selectedProduct.pcs_per_karton} pack</b></span>
              </div>
            </div>
          )}

          {!isCurah && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`flex items-center gap-2 ${textClass}`}>
                    <Box className="w-4 h-4 text-blue-600" />
                    Jumlah Karton
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 2"
                    value={formData.jumlahKarton}
                    onChange={(e) => setFormData({ ...formData, jumlahKarton: e.target.value })}
                    className={inputBg}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`flex items-center gap-2 ${textClass}`}>
                    <Package className="w-4 h-4 text-blue-600" />
                    Jumlah Pack
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 5"
                    value={formData.jumlahPack}
                    onChange={(e) => setFormData({ ...formData, jumlahPack: e.target.value })}
                    className={inputBg}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`flex items-center gap-2 ${textClass}`}>
                    <DollarSign className="w-4 h-4" />
                    Harga per Karton
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 180000"
                    value={formData.hargaKarton}
                    onChange={(e) => setFormData({ ...formData, hargaKarton: e.target.value })}
                    className={inputBg}
                  />
                  <p className={`text-xs ${textSecondary}`}>Wajib diisi jika jual karton</p>
                </div>

                <div className="space-y-2">
                  <Label className={`flex items-center gap-2 ${textClass}`}>
                    <DollarSign className="w-4 h-4" />
                    Harga per Pack
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 12000"
                    value={formData.hargaPcs}
                    onChange={(e) => setFormData({ ...formData, hargaPcs: e.target.value })}
                    className={inputBg}
                  />
                  <p className={`text-xs ${textSecondary}`}>Wajib diisi jika jual pack</p>
                </div>

                <div className="space-y-2">
                  <Label className={textClass}>Nama Toko *</Label>
                  <Input
                    placeholder="Contoh: Toko Sejahtera"
                    value={formData.namaTokoTransaksi}
                    onChange={(e) => setFormData({ ...formData, namaTokoTransaksi: e.target.value })}
                    className={inputBg}
                  />
                </div>

                <div className="space-y-2">
                  <div className="h-6"></div>
                </div>

                <div className="space-y-2">
                  <Label className={`flex items-center gap-2 ${textClass}`}>
                    <Box className="w-4 h-4 text-amber-600" />
                    Stock Pack *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Stok pack yang tersisa"
                    value={formData.stockPack}
                    onChange={(e) => setFormData({ ...formData, stockPack: e.target.value })}
                    className={inputBg}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`flex items-center gap-2 ${textClass}`}>
                    <Box className="w-4 h-4 text-amber-600" />
                    Stock Karton *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Stok karton yang tersisa"
                    value={formData.stockKarton}
                    onChange={(e) => setFormData({ ...formData, stockKarton: e.target.value })}
                    className={inputBg}
                  />
                </div>
              </div>

              {totalHarga > 0 && (
                <div className={`p-4 ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border-l-4 border-green-500 rounded-lg space-y-2`}>
                  <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-400">
                    <Calculator className="w-4 h-4" />
                    <span className="font-semibold">Ringkasan Penjualan:</span>
                  </div>
                  {Number(formData.jumlahKarton) > 0 && (
                    <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      Karton: {formData.jumlahKarton} × Rp {Number(formData.hargaKarton).toLocaleString("id-ID")} = 
                      Rp {(Number(formData.jumlahKarton) * Number(formData.hargaKarton)).toLocaleString("id-ID")}
                    </p>
                  )}
                  {Number(formData.jumlahPack) > 0 && (
                    <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      Pack: {formData.jumlahPack} × Rp {Number(formData.hargaPcs).toLocaleString("id-ID")} = 
                      Rp {(Number(formData.jumlahPack) * Number(formData.hargaPcs)).toLocaleString("id-ID")}
                    </p>
                  )}
                  <div className={`border-t ${isDark ? 'border-green-700' : 'border-green-200'} pt-2 mt-2`}>
                    <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-900'}`}>
                      Total: Rp {totalHarga.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {isCurah && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`flex items-center gap-2 ${textClass}`}>
                    <Weight className="w-4 h-4 text-green-600" />
                    Gram *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 500"
                    value={formData.totalGram}
                    onChange={(e) => setFormData({ ...formData, totalGram: e.target.value })}
                    className={inputBg}
                  />
                  <p className={`text-xs ${textSecondary}`}>Tulis jumlah gram yang terjual</p>
                </div>

                <div className="space-y-2">
                  <Label className={`flex items-center gap-2 ${textClass}`}>
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Harga *
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 50000"
                    value={formData.totalHargaCurah}
                    onChange={(e) => setFormData({ ...formData, totalHargaCurah: e.target.value })}
                    className={inputBg}
                  />
                  <p className={`text-xs ${textSecondary}`}>Tulis total uang yang diterima</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className={textClass}>Nama Toko *</Label>
                  <Input
                    placeholder="Contoh: Warung Bu Lastri"
                    value={formData.namaTokoTransaksi}
                    onChange={(e) => setFormData({ ...formData, namaTokoTransaksi: e.target.value })}
                    className={inputBg}
                  />
                </div>
              </div>

              {formData.totalGram && formData.totalHargaCurah && Number(formData.totalGram) > 0 && Number(formData.totalHargaCurah) > 0 && (
                <div className={`p-4 ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border-l-4 border-green-500 rounded-lg space-y-2`}>
                  <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">Ringkasan Penjualan:</span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    Terjual: <b>{Number(formData.totalGram).toLocaleString("id-ID")} gram</b>
                  </p>
                  <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-900'}`}>
                    Total: Rp {Number(formData.totalHargaCurah).toLocaleString("id-ID")}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label className={textClass}>Catatan (Opsional)</Label>
            <Input
              placeholder="Tambahkan catatan jika perlu..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={inputBg}
            />
          </div>

          <Button 
            onClick={handleSubmitClick} 
            disabled={submitting || (!isPackKartonValid && !isCurahValid)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-base transition-all hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Simpan Laporan Penjualan
            </span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}