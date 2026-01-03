"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Edit2, X, Save, AlertCircle, BarChart3, CheckCircle2 } from "lucide-react"

interface SalesData {
  id: string
  tanggal: string
  produk: string
  produkId: number
  produkPcsPerKarton: number
  penjualanKarton: number
  penjualanPcs: number
  penjualanGram: number
  hargaKarton: number
  hargaPcs: number
  stockPack: number
  stockKarton: number
  namaTokoTransaksi: string
  total: number
  category: string
  notes: string
}

interface SalesTableProps {
  salesData: SalesData[]
  loading: boolean
  error: string
  theme: "dark" | "light"
  onRefresh: () => void
}

export default function SalesTable({ salesData, loading, error, theme, onRefresh }: SalesTableProps) {
  const isDark = theme === 'dark'
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    penjualanKarton: "",
    penjualanPcs: "",
    hargaKarton: "",
    hargaPcs: "",
    stockPack: "",
    stockKarton: "",
    namaTokoTransaksi: "",
    notes: "",
  })
  const [editResult, setEditResult] = useState<{ karton: number; sisaPcs: number; total: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [notifMessage, setNotifMessage] = useState("")
  
  // 🔍 Filter states
  const [filterToko, setFilterToko] = useState<string>("semua")
  const [filterProduk, setFilterProduk] = useState<string>("semua")

  const cardBg = isDark ? "bg-slate-800/50 backdrop-blur border-slate-700" : "bg-white/80 backdrop-blur border-slate-200"
  const textClass = isDark ? "text-slate-100" : "text-slate-900"
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600"
  const borderClass = isDark ? "border-slate-700" : "border-slate-200"
  const hoverBg = isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"
  const inputBg = isDark ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-200"
  const statBg = isDark ? "bg-slate-700/50" : "bg-slate-50"
  const modalBg = isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
  const overlayBg = isDark ? "bg-black/70" : "bg-black/50"

  const canEdit = (tanggal: string): boolean => {
    const salesDate = new Date(tanggal)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    salesDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((today.getTime() - salesDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 2
  }

  const handleEdit = (row: SalesData) => {
    if (!canEdit(row.tanggal)) {
      setLocalError("Laporan hanya bisa diedit maksimal 2 hari setelah tanggal transaksi")
      return
    }
    setEditingId(row.id)
    setEditForm({
      penjualanKarton: "",
      penjualanPcs: "",
      hargaKarton: "",
      hargaPcs: "",
      stockPack: "",
      stockKarton: "",
      namaTokoTransaksi: "",
      notes: "",
    })
    setEditResult(null)
    setLocalError("")
  }

  useEffect(() => {
    if (editingId) {
      const row = salesData.find(r => r.id === editingId)
      if (!row) return
      
      const karton = editForm.penjualanKarton !== "" ? Number(editForm.penjualanKarton) : row.penjualanKarton
      const pack = editForm.penjualanPcs !== "" ? Number(editForm.penjualanPcs) : row.penjualanPcs
      const hargaKarton = editForm.hargaKarton !== "" ? Number(editForm.hargaKarton) : row.hargaKarton
      const hargaPcs = editForm.hargaPcs !== "" ? Number(editForm.hargaPcs) : row.hargaPcs

      // Preview menggunakan nilai input atau nilai asli
      const total = (karton * hargaKarton) + (pack * hargaPcs)
      setEditResult({ karton, sisaPcs: pack, total })
    }
  }, [editForm, editingId, salesData])

  const handleSave = async () => {
    if (!editingId) return
    try {
      setSaving(true)
      setLocalError("")
      const row = salesData.find(r => r.id === editingId)
      if (!row) return

      const payload: any = { id: editingId }
      
      // ✅ Kirim penjualanKarton dan penjualanPcs secara terpisah (tidak auto-convert)
      if (editForm.penjualanKarton !== '') {
        const val = Number(editForm.penjualanKarton)
        console.log('🔍 penjualanKarton:', editForm.penjualanKarton, '→', val)
        if (!isNaN(val) && val >= 0) payload.penjualanKarton = val
      }
      
      if (editForm.penjualanPcs !== '') {
        const val = Number(editForm.penjualanPcs)
        console.log('🔍 penjualanPcs:', editForm.penjualanPcs, '→', val)
        if (!isNaN(val) && val >= 0) payload.penjualanPcs = val
      }
      
      if (editForm.hargaKarton !== '') {
        const val = Number(editForm.hargaKarton)
        console.log('🔍 hargaKarton:', editForm.hargaKarton, '→', val)
        if (!isNaN(val) && val >= 0) payload.hargaKarton = val
      }
      
      if (editForm.hargaPcs !== '') {
        const val = Number(editForm.hargaPcs)
        console.log('🔍 hargaPcs:', editForm.hargaPcs, '→', val)
        if (!isNaN(val) && val >= 0) payload.hargaPcs = val
      }
      if (editForm.stockPack !== '') {
        const val = Number(editForm.stockPack)
        console.log('🔍 stockPack:', editForm.stockPack, '→', val, 'isValid:', !isNaN(val) && val >= 0)
        if (!isNaN(val) && val >= 0) payload.stockPack = val
      }
      if (editForm.stockKarton !== '') {
        const val = Number(editForm.stockKarton)
        console.log('🔍 stockKarton:', editForm.stockKarton, '→', val, 'isValid:', !isNaN(val) && val >= 0)
        if (!isNaN(val) && val >= 0) payload.stockKarton = val
      }
      if (editForm.namaTokoTransaksi && editForm.namaTokoTransaksi.trim() !== '') {
        console.log('🔍 namaTokoTransaksi:', editForm.namaTokoTransaksi)
        payload.namaTokoTransaksi = editForm.namaTokoTransaksi.trim()
      }
      if (editForm.notes && editForm.notes.trim() !== '') {
        console.log('🔍 notes:', editForm.notes)
        payload.notes = editForm.notes.trim()
      }

      console.log('📦 Final payload keys:', Object.keys(payload))
      console.log('📤 Sending payload:', payload)

      if (Object.keys(payload).length === 1) {
        console.log('❌ Validation failed: No changes detected')
        setLocalError("Tidak ada perubahan yang dilakukan")
        setSaving(false)
        return
      }

      const response = await fetch(`/api/sales/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Gagal mengupdate laporan")

      setNotifMessage(result.message || "Data penjualan berhasil diupdate")
      setShowSuccessModal(true)
      setTimeout(() => setShowSuccessModal(false), 2500)
      await onRefresh()
      setEditingId(null)
      setEditResult(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan perubahan"
      setNotifMessage(errorMsg)
      setShowErrorModal(true)
      setLocalError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditResult(null)
    setLocalError("")
  }

  const displayError = error || localError

  // 🔍 Get unique toko dan produk dari salesData
  const uniqueToko = Array.from(new Set(salesData.map(s => s.namaTokoTransaksi))).sort()
  const uniqueProduk = Array.from(new Set(salesData.map(s => s.produk))).sort()

  // 🔍 Filter data berdasarkan toko dan produk
  const filteredData = salesData.filter(row => {
    const matchToko = filterToko === "semua" || row.namaTokoTransaksi === filterToko
    const matchProduk = filterProduk === "semua" || row.produk === filterProduk
    return matchToko && matchProduk
  })

  // 📊 Ambil stock terakhir dari data yang sudah difilter
  const latestStock = filteredData.length > 0 ? filteredData[0] : null

  return (
    <>
      {showSuccessModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm p-4`}>
          <div className={`${modalBg} rounded-2xl shadow-2xl max-w-md w-full border-2`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className={`text-xl font-bold ${textClass}`}>Berhasil! 🎉</h3>
                <p className={`text-sm ${textSecondary}`}>{notifMessage}</p>
              </div>
              <Button onClick={() => setShowSuccessModal(false)} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">Tutup</Button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm p-4`}>
          <div className={`${modalBg} rounded-2xl shadow-2xl max-w-md w-full border-2`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className={`text-xl font-bold ${textClass}`}>Gagal Update ❌</h3>
                <p className={`text-sm ${textSecondary}`}>{notifMessage}</p>
              </div>
              <Button onClick={() => setShowErrorModal(false)} className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white">Tutup</Button>
            </div>
          </div>
        </div>
      )}

      <Card className={`border-0 shadow-xl ${cardBg}`}>
        <CardHeader>
          <CardTitle className={textClass}>Riwayat Transaksi</CardTitle>
          <CardDescription className={textSecondary}>
            📝 Semua riwayat penjualan Anda dalam 30 hari terakhir<br />
            <span className="text-blue-500 font-medium">✏️ Bisa edit transaksi maksimal 2 hari setelah tanggal transaksi</span>
            {salesData.length > 0 && <span className="ml-2 text-sm font-medium text-blue-600">• {filteredData.length} dari {salesData.length} transaksi</span>}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* 🔍 FILTER SECTION */}
          <div className={`p-3 sm:p-4 rounded-lg ${statBg} border ${borderClass} space-y-3`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <h3 className={`text-xs sm:text-sm font-semibold ${textClass}`}>Filter Transaksi</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Filter Toko */}
              <div>
                <Label className={`text-xs ${textClass} mb-1.5 block`}>🏪 Nama Toko</Label>
                <select
                  value={filterToko}
                  onChange={(e) => setFilterToko(e.target.value)}
                  className={`w-full h-9 px-3 text-xs sm:text-sm rounded-md border ${inputBg} ${textClass}`}
                >
                  <option value="semua">Semua Toko ({uniqueToko.length})</option>
                  {uniqueToko.map(toko => (
                    <option key={toko} value={toko}>{toko}</option>
                  ))}
                </select>
              </div>

              {/* Filter Produk */}
              <div>
                <Label className={`text-xs ${textClass} mb-1.5 block`}>📦 Nama Produk</Label>
                <select
                  value={filterProduk}
                  onChange={(e) => setFilterProduk(e.target.value)}
                  className={`w-full h-9 px-3 text-xs sm:text-sm rounded-md border ${inputBg} ${textClass}`}
                >
                  <option value="semua">Semua Produk ({uniqueProduk.length})</option>
                  {uniqueProduk.map(produk => (
                    <option key={produk} value={produk}>{produk}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stock Info - Tampil jika ada filter aktif */}
            {(filterToko !== "semua" || filterProduk !== "semua") && latestStock && latestStock.category !== "Curah" && (
              <div className={`mt-3 p-3 rounded-lg border ${borderClass} ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                  <span className={`text-xs font-semibold ${textClass}`}>📊 Stock Terakhir:</span>
                  <span className="text-xs text-slate-400">{new Date(latestStock.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center sm:text-left">
                    <span className={`${textSecondary} block mb-1`}>Stock Pack:</span>
                    <p className={`font-bold text-xl sm:text-2xl ${latestStock.stockPack < 10 ? 'text-red-500' : 'text-green-600'}`}>{latestStock.stockPack}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className={`${textSecondary} block mb-1`}>Stock Karton:</span>
                    <p className={`font-bold text-xl sm:text-2xl ${latestStock.stockKarton < 5 ? 'text-red-500' : 'text-green-600'}`}>{latestStock.stockKarton}</p>
                  </div>
                </div>
                {filterToko !== "semua" && filterProduk !== "semua" && (
                  <p className="text-xs text-blue-500 mt-2 text-center sm:text-left">💡 {filterProduk} di {filterToko}</p>
                )}
              </div>
            )}

            {/* Reset Filter Button */}
            {(filterToko !== "semua" || filterProduk !== "semua") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setFilterToko("semua"); setFilterProduk("semua") }}
                className={`w-full h-9 text-xs ${isDark ? 'border-slate-600 hover:bg-slate-700' : ''}`}
              >
                🔄 Reset Filter
              </Button>
            )}
          </div>

          {/* TABLE SECTION */}
          <div>
          {displayError && (
            <div className={`mb-4 p-3 ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-100 border-red-300'} border rounded text-sm flex items-center gap-2`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{displayError}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`p-4 rounded-lg ${statBg} animate-pulse`}><div className="h-20" /></div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className={`text-center py-8 px-4 ${textSecondary}`}>
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {salesData.length === 0 
                  ? "Tidak ada data penjualan dalam 30 hari terakhir."
                  : "Tidak ada transaksi yang sesuai dengan filter."}
              </p>
            </div>
          ) : (
            <>
              <div className="block lg:hidden space-y-3">
                {filteredData.map((row) => (
                  <div key={row.id} className={`${cardBg} rounded-lg p-4 border ${borderClass}`}>
                    {editingId === row.id ? (
                      <div className={`space-y-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} p-3 rounded-lg -m-4`}>
                        <div className="space-y-3">
                          <div><Label className={`text-xs ${textClass}`}>Penjualan Karton <span className="text-slate-400">(opsional)</span></Label>
                            <Input type="number" value={editForm.penjualanKarton} onChange={(e) => setEditForm({ ...editForm, penjualanKarton: e.target.value })} placeholder={`Sekarang: ${row.penjualanKarton}`} className={`h-9 text-sm ${inputBg}`} /></div>
                          <div><Label className={`text-xs ${textClass}`}>Penjualan Pack <span className="text-slate-400">(opsional)</span></Label>
                            <Input type="number" value={editForm.penjualanPcs} onChange={(e) => setEditForm({ ...editForm, penjualanPcs: e.target.value })} placeholder={`Sekarang: ${row.penjualanPcs}`} className={`h-9 text-sm ${inputBg}`} /></div>
                          <div><Label className={`text-xs ${textClass}`}>Harga/Karton <span className="text-slate-400">(opsional)</span></Label>
                            <Input type="number" value={editForm.hargaKarton} onChange={(e) => setEditForm({ ...editForm, hargaKarton: e.target.value })} placeholder={`Sekarang: ${row.hargaKarton}`} className={`h-9 text-sm ${inputBg}`} /></div>
                          <div><Label className={`text-xs ${textClass}`}>Harga/Pack <span className="text-slate-400">(opsional)</span></Label>
                            <Input type="number" value={editForm.hargaPcs} onChange={(e) => setEditForm({ ...editForm, hargaPcs: e.target.value })} placeholder={`Sekarang: ${row.hargaPcs}`} className={`h-9 text-sm ${inputBg}`} /></div>
                          <div><Label className={`text-xs ${textClass}`}>Stock Pack <span className="text-slate-400">(opsional)</span></Label>
                            <Input type="number" value={editForm.stockPack} onChange={(e) => setEditForm({ ...editForm, stockPack: e.target.value })} placeholder={`Sekarang: ${row.stockPack}`} className={`h-9 text-sm ${inputBg}`} /></div>
                          <div><Label className={`text-xs ${textClass}`}>Stock Karton <span className="text-slate-400">(opsional)</span></Label>
                            <Input type="number" value={editForm.stockKarton} onChange={(e) => setEditForm({ ...editForm, stockKarton: e.target.value })} placeholder={`Sekarang: ${row.stockKarton}`} className={`h-9 text-sm ${inputBg}`} /></div>
                          <div><Label className={`text-xs ${textClass}`}>Nama Toko <span className="text-slate-400">(opsional)</span></Label>
                            <Input value={editForm.namaTokoTransaksi} onChange={(e) => setEditForm({ ...editForm, namaTokoTransaksi: e.target.value })} placeholder={`Sekarang: ${row.namaTokoTransaksi}`} className={`h-9 text-sm ${inputBg}`} /></div>
                          <div><Label className={`text-xs ${textClass}`}>Catatan <span className="text-slate-400">(opsional)</span></Label>
                            <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Tambahkan catatan..." className={`h-9 text-sm ${inputBg}`} /></div>
                        </div>
                        {editResult && (
                          <div className={`text-xs ${isDark ? 'bg-slate-700' : 'bg-white'} p-3 rounded-lg ${borderClass} border`}>
                            <div className="space-y-2">
                              <span className={`${textSecondary} block`}>Preview Hasil Edit:</span>
                              <div className="flex justify-between">
                                <span className={textClass}><strong>{editResult.karton}</strong> karton + <strong>{editResult.sisaPcs}</strong> pack</span>
                                <strong className="text-green-500">Rp {editResult.total.toLocaleString("id-ID")}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 h-9 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Simpan</Button>
                          <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className={`flex-1 h-9 ${isDark ? 'border-slate-600 hover:bg-slate-700' : ''}`}>
                            <X className="w-4 h-4 mr-1" />Batal</Button>
                        </div>
                        <p className={`text-xs ${textSecondary} italic text-center`}>💡 Isi hanya field yang ingin diubah, sisanya kosongkan</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${textClass}`}>{new Date(row.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.category === "Curah" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>{row.category}</span>
                            </div>
                            <h4 className={`font-semibold ${textClass} mb-1`}>{row.produk}</h4>
                            <p className={`text-xs ${textSecondary}`}>{row.namaTokoTransaksi}</p>
                          </div>
                          {canEdit(row.tanggal) ? <Button size="sm" variant="ghost" onClick={() => handleEdit(row)} className={`h-8 w-8 p-0 ${hoverBg} flex-shrink-0`}><Edit2 className="w-4 h-4 text-blue-500" /></Button> : <span className="text-xs text-slate-400 flex-shrink-0">🔒</span>}
                        </div>
                        <div className={`grid grid-cols-2 gap-2 text-xs pt-2 border-t ${borderClass}`}>
                          {row.category !== "Curah" && (<>
                            <div><span className={textSecondary}>Karton:</span><p className={`font-semibold ${textClass}`}>{row.penjualanKarton}</p></div>
                            <div><span className={textSecondary}>Pack:</span><p className={`font-semibold ${textClass}`}>{row.penjualanPcs}</p></div>
                            <div><span className={textSecondary}>Harga/Karton:</span><p className={textSecondary}>Rp {row.hargaKarton.toLocaleString("id-ID")}</p></div>
                            <div><span className={textSecondary}>Harga/Pack:</span><p className={textSecondary}>Rp {row.hargaPcs.toLocaleString("id-ID")}</p></div>
                            <div><span className={textSecondary}>Stock Pack:</span><p className={`font-medium ${row.stockPack < 10 ? 'text-red-500' : 'text-amber-600'}`}>{row.stockPack}</p></div>
                            <div><span className={textSecondary}>Stock Karton:</span><p className={`font-medium ${row.stockKarton < 5 ? 'text-red-500' : 'text-amber-600'}`}>{row.stockKarton}</p></div>
                          </>)}
                          {row.category === "Curah" && <div className="col-span-2"><span className={textSecondary}>Penjualan:</span><p className="font-semibold text-green-600">{row.penjualanGram}g</p></div>}
                        </div>
                        {row.notes && <div className={`text-xs pt-2 border-t ${borderClass} mt-2`}><span className={textSecondary}>Catatan:</span><p className={`${textClass} mt-1`}>{row.notes}</p></div>}
                        <div className={`flex justify-between items-center pt-2 border-t ${borderClass} mt-2`}>
                          <span className={`text-xs ${textSecondary}`}>Total:</span>
                          <span className="text-lg font-bold text-green-600">Rp {row.total.toLocaleString("id-ID")}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${borderClass} ${statBg} text-xs font-medium ${textSecondary}`}>
                      <th className="px-3 py-3 text-left">Tanggal</th>
                      <th className="px-3 py-3 text-left">Produk</th>
                      <th className="px-3 py-3 text-center">Kategori</th>
                      <th className="px-3 py-3 text-center">Karton</th>
                      <th className="px-3 py-3 text-center">Pack</th>
                      <th className="px-3 py-3 text-right">Harga/Karton</th>
                      <th className="px-3 py-3 text-right">Harga/Pack</th>
                      <th className="px-3 py-3 text-center">Stock Pack</th>
                      <th className="px-3 py-3 text-center">Stock Karton</th>
                      <th className="px-3 py-3 text-left">Toko</th>
                      <th className="px-3 py-3 text-left">Catatan</th>
                      <th className="px-3 py-3 text-right">Total</th>
                      <th className="px-3 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row) => (
                      <tr key={row.id} className={`border-b ${borderClass} ${hoverBg} transition-colors`}>
                        {editingId === row.id ? (
                          <td colSpan={13} className={`px-3 py-3 text-xs ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                            <div className="space-y-3 p-3 rounded-lg">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div><Label className={`text-xs ${textClass}`}>Penjualan Karton <span className="text-slate-400">(opsional)</span></Label>
                                  <Input type="number" value={editForm.penjualanKarton} onChange={(e) => setEditForm({ ...editForm, penjualanKarton: e.target.value })} placeholder={`Sekarang: ${row.penjualanKarton}`} className={`h-9 text-sm ${inputBg}`} /></div>
                                <div><Label className={`text-xs ${textClass}`}>Penjualan Pack <span className="text-slate-400">(opsional)</span></Label>
                                  <Input type="number" value={editForm.penjualanPcs} onChange={(e) => setEditForm({ ...editForm, penjualanPcs: e.target.value })} placeholder={`Sekarang: ${row.penjualanPcs}`} className={`h-9 text-sm ${inputBg}`} /></div>
                                <div><Label className={`text-xs ${textClass}`}>Harga/Karton <span className="text-slate-400">(opsional)</span></Label>
                                  <Input type="number" value={editForm.hargaKarton} onChange={(e) => setEditForm({ ...editForm, hargaKarton: e.target.value })} placeholder={`Sekarang: ${row.hargaKarton}`} className={`h-9 text-sm ${inputBg}`} /></div>
                                <div><Label className={`text-xs ${textClass}`}>Harga/Pack <span className="text-slate-400">(opsional)</span></Label>
                                  <Input type="number" value={editForm.hargaPcs} onChange={(e) => setEditForm({ ...editForm, hargaPcs: e.target.value })} placeholder={`Sekarang: ${row.hargaPcs}`} className={`h-9 text-sm ${inputBg}`} /></div>
                                <div><Label className={`text-xs ${textClass}`}>Stock Pack <span className="text-slate-400">(opsional)</span></Label>
                                  <Input type="number" value={editForm.stockPack} onChange={(e) => setEditForm({ ...editForm, stockPack: e.target.value })} placeholder={`Sekarang: ${row.stockPack}`} className={`h-9 text-sm ${inputBg}`} /></div>
                                <div><Label className={`text-xs ${textClass}`}>Stock Karton <span className="text-slate-400">(opsional)</span></Label>
                                  <Input type="number" value={editForm.stockKarton} onChange={(e) => setEditForm({ ...editForm, stockKarton: e.target.value })} placeholder={`Sekarang: ${row.stockKarton}`} className={`h-9 text-sm ${inputBg}`} /></div>
                                <div><Label className={`text-xs ${textClass}`}>Nama Toko <span className="text-slate-400">(opsional)</span></Label>
                                  <Input value={editForm.namaTokoTransaksi} onChange={(e) => setEditForm({ ...editForm, namaTokoTransaksi: e.target.value })} placeholder={`Sekarang: ${row.namaTokoTransaksi}`} className={`h-9 text-sm ${inputBg}`} /></div>
                                <div className="sm:col-span-2 lg:col-span-4"><Label className={`text-xs ${textClass}`}>Catatan <span className="text-slate-400">(opsional)</span></Label>
                                  <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Tambahkan catatan..." className={`h-9 text-sm ${inputBg}`} /></div>
                              </div>
                              {editResult && (
                                <div className={`text-xs ${isDark ? 'bg-slate-700' : 'bg-white'} p-3 rounded-lg ${borderClass} border`}>
                                  <div className="flex justify-between items-center">
                                    <div><span className={`${textSecondary} block mb-1`}>Preview Hasil Edit:</span>
                                      <span className={textClass}><strong>{editResult.karton}</strong> karton + <strong>{editResult.sisaPcs}</strong> pack</span></div>
                                    <div className="text-right"><span className={`${textSecondary} text-xs block`}>Total:</span>
                                      <strong className="text-green-500 text-lg">Rp {editResult.total.toLocaleString("id-ID")}</strong></div>
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSave} disabled={saving} className="h-9 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Simpan</Button>
                                <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className={`h-9 ${isDark ? 'border-slate-600 hover:bg-slate-700' : ''}`}>
                                  <X className="w-4 h-4 mr-1" />Batal</Button>
                              </div>
                              <p className={`text-xs ${textSecondary} italic`}>💡 Isi hanya field yang ingin diubah, sisanya kosongkan</p>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className={`px-3 py-3 text-xs font-medium ${textClass}`}>{new Date(row.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                            <td className={`px-3 py-3 text-xs ${textClass}`}>{row.produk}</td>
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.category === "Curah" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>{row.category}</span>
                            </td>
                            <td className={`px-3 py-3 text-xs text-center ${textClass}`}>{row.category === "Curah" ? <span className={textSecondary}>-</span> : <span className="font-semibold">{row.penjualanKarton}</span>}</td>
                            <td className={`px-3 py-3 text-xs text-center ${textClass}`}>{row.category === "Curah" ? <span className="font-semibold text-green-600">{row.penjualanGram}g</span> : <span className="font-semibold">{row.penjualanPcs}</span>}</td>
                            <td className={`px-3 py-3 text-xs text-right ${textSecondary}`}>{row.category === "Curah" ? <span className={textSecondary}>-</span> : `Rp ${row.hargaKarton.toLocaleString("id-ID")}`}</td>
                            <td className={`px-3 py-3 text-xs text-right ${textSecondary}`}>{row.category === "Curah" ? <span className={textSecondary}>-</span> : `Rp ${row.hargaPcs.toLocaleString("id-ID")}`}</td>
                            <td className={`px-3 py-3 text-xs text-center`}>{row.category === "Curah" ? <span className={textSecondary}>-</span> : <span className={`font-medium ${row.stockPack < 10 ? 'text-red-500' : 'text-amber-600'}`}>{row.stockPack}</span>}</td>
                            <td className={`px-3 py-3 text-xs text-center`}>{row.category === "Curah" ? <span className={textSecondary}>-</span> : <span className={`font-medium ${row.stockKarton < 5 ? 'text-red-500' : 'text-amber-600'}`}>{row.stockKarton}</span>}</td>
                            <td className={`px-3 py-3 text-xs ${textClass} max-w-[150px] truncate`}>{row.namaTokoTransaksi}</td>
                            <td className={`px-3 py-3 text-xs ${textSecondary} max-w-[150px]`}>{row.notes ? <span className="truncate block" title={row.notes}>{row.notes}</span> : <span className="text-slate-400">-</span>}</td>
                            <td className="px-3 py-3 text-xs text-right font-semibold"><span className="text-green-600">Rp {row.total.toLocaleString("id-ID")}</span></td>
                            <td className="px-3 py-3 text-center">{canEdit(row.tanggal) ? <Button size="sm" variant="ghost" onClick={() => handleEdit(row)} className={`h-8 w-8 p-0 ${hoverBg}`}><Edit2 className="w-4 h-4 text-blue-500" /></Button> : <span className="text-xs text-slate-400">🔒</span>}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}