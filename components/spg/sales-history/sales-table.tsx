"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Edit2, X, Save, AlertCircle, BarChart3, CheckCircle2, Store, Search, Calendar } from "lucide-react"

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
  createdAt: string
}

interface SalesTableProps {
  salesData: SalesData[]
  loading: boolean
  error: string
  theme: "dark" | "light"
  onRefresh: () => void
}

// ✅ FIX: FormInput dipindah ke LUAR component SalesTable
interface FormInputProps {
  label: string
  type?: string
  field: string
  placeholder: string
  max?: string
  editForm: Record<string, string>
  setEditForm: (form: Record<string, string>) => void
  inputBg: string
  textClass: string
}

const FormInput = ({ label, type = "text", field, placeholder, max, editForm, setEditForm, inputBg, textClass }: FormInputProps) => (
  <div>
    <Label className={`text-xs ${textClass}`}>
      {label} <span className="text-slate-400">(opsional)</span>
    </Label>
    <Input
      type={type}
      value={editForm[field]}
      onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
      placeholder={placeholder}
      max={max}
      className={`h-9 text-sm ${inputBg}`}
    />
  </div>
)

export default function SalesTable({ salesData, loading, error, theme, onRefresh }: SalesTableProps) {
  const isDark = theme === 'dark'
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({
    tanggal: "",
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
  const [filterToko, setFilterToko] = useState<string>("semua")
  const [filterProduk, setFilterProduk] = useState<string>("semua")
  
  const [showStoreSelectModal, setShowStoreSelectModal] = useState(false)
  const [storeSearchQuery, setStoreSearchQuery] = useState("")
  const [masterStores, setMasterStores] = useState<string[]>([])
  const [loadingStores, setLoadingStores] = useState(false)
  const storeSearchRef = useRef<HTMLInputElement>(null)

  const classes = {
    cardBg: isDark ? "bg-slate-800/50 backdrop-blur border-slate-700" : "bg-white/80 backdrop-blur border-slate-200",
    text: isDark ? "text-slate-100" : "text-slate-900",
    textSecondary: isDark ? "text-slate-400" : "text-slate-600",
    border: isDark ? "border-slate-700" : "border-slate-200",
    hoverBg: isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50",
    inputBg: isDark ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-200",
    statBg: isDark ? "bg-slate-700/50" : "bg-slate-50",
    modalBg: isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
    overlayBg: isDark ? "bg-black/70" : "bg-black/50",
  }

  const uniqueToko = Array.from(new Set(salesData.map(s => s.namaTokoTransaksi))).sort()
  const uniqueProduk = Array.from(new Set(salesData.map(s => s.produk))).sort()
  
  const filteredStores = masterStores.filter(store => 
    store.toLowerCase().includes(storeSearchQuery.toLowerCase())
  )

  const loadMasterStores = async () => {
    try {
      setLoadingStores(true)
      const response = await fetch("/api/toko?status=Aktif", {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        const storeNames = result.data.map((toko: any) => toko.nama).sort()
        setMasterStores(storeNames)
      }
    } catch (err) {
      console.error("❌ Gagal load master toko:", err)
    } finally {
      setLoadingStores(false)
    }
  }

  useEffect(() => {
    if (showStoreSelectModal && masterStores.length === 0) {
      loadMasterStores()
    }
  }, [showStoreSelectModal])

  useEffect(() => {
    if (showStoreSelectModal && storeSearchRef.current) {
      setTimeout(() => storeSearchRef.current?.focus(), 100)
    }
  }, [showStoreSelectModal])

  const canEdit = (createdAt: string): boolean => {
    const inputDate = new Date(createdAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    inputDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  const validateDate = (dateString: string): boolean => {
    const selectedDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays >= 0
  }

  const handleEdit = (row: SalesData) => {
    if (!canEdit(row.createdAt)) {
      setLocalError("Laporan hanya bisa diedit maksimal 7 hari setelah tanggal input")
      return
    }
    setEditingId(row.id)
    setEditForm({
      tanggal: "",
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

  const handleCancel = () => {
    setEditingId(null)
    setEditResult(null)
    setLocalError("")
  }

  const handleStoreSelect = (storeName: string) => {
    setEditForm({ ...editForm, namaTokoTransaksi: storeName })
    setShowStoreSelectModal(false)
    setStoreSearchQuery("")
  }

  useEffect(() => {
    if (editingId) {
      const row = salesData.find(r => r.id === editingId)
      if (!row) return
      
      const karton = editForm.penjualanKarton !== "" ? Number(editForm.penjualanKarton) : row.penjualanKarton
      const pack = editForm.penjualanPcs !== "" ? Number(editForm.penjualanPcs) : row.penjualanPcs
      const hargaKarton = editForm.hargaKarton !== "" ? Number(editForm.hargaKarton) : row.hargaKarton
      const hargaPcs = editForm.hargaPcs !== "" ? Number(editForm.hargaPcs) : row.hargaPcs

      const total = (karton * hargaKarton) + (pack * hargaPcs)
      setEditResult({ karton, sisaPcs: pack, total })
    }
  }, [editForm, editingId, salesData])

  const handleSave = async () => {
    if (!editingId) return
    
    try {
      setSaving(true)
      setLocalError("")
      
      const payload: any = { id: editingId }
      
      if (editForm.tanggal !== '') {
        if (!validateDate(editForm.tanggal)) {
          setLocalError("Tanggal tidak valid. Maksimal 7 hari yang lalu dan tidak boleh tanggal masa depan.")
          setSaving(false)
          return
        }
        payload.tanggal = editForm.tanggal
      }
      
      if (editForm.penjualanKarton !== '') {
        const val = Number(editForm.penjualanKarton)
        if (!isNaN(val) && val >= 0) payload.penjualanKarton = val
      }
      if (editForm.penjualanPcs !== '') {
        const val = Number(editForm.penjualanPcs)
        if (!isNaN(val) && val >= 0) payload.penjualanPcs = val
      }
      if (editForm.hargaKarton !== '') {
        const val = Number(editForm.hargaKarton)
        if (!isNaN(val) && val >= 0) payload.hargaKarton = val
      }
      if (editForm.hargaPcs !== '') {
        const val = Number(editForm.hargaPcs)
        if (!isNaN(val) && val >= 0) payload.hargaPcs = val
      }
      if (editForm.stockPack !== '') {
        const val = Number(editForm.stockPack)
        if (!isNaN(val) && val >= 0) payload.stockPack = val
      }
      if (editForm.stockKarton !== '') {
        const val = Number(editForm.stockKarton)
        if (!isNaN(val) && val >= 0) payload.stockKarton = val
      }
      if (editForm.namaTokoTransaksi?.trim()) {
        payload.namaTokoTransaksi = editForm.namaTokoTransaksi.trim()
      }
      if (editForm.notes?.trim()) {
        payload.notes = editForm.notes.trim()
      }

      if (Object.keys(payload).length === 1) {
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

  const displayError = error || localError
  const filteredData = salesData.filter(row => {
    const matchToko = filterToko === "semua" || row.namaTokoTransaksi === filterToko
    const matchProduk = filterProduk === "semua" || row.produk === filterProduk
    return matchToko && matchProduk
  })

  const latestStock = filteredData.length > 0 ? filteredData[0] : null

  // ✅ FIX: DataDisplay dipindah ke LUAR juga agar tidak re-render
  const renderDataDisplay = (row: SalesData) => (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${classes.text}`}>
              {new Date(row.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              row.category === "Curah" 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}>
              {row.category}
            </span>
          </div>
          <h4 className={`font-semibold ${classes.text} mb-1`}>{row.produk}</h4>
          <p className={`text-xs ${classes.textSecondary}`}>{row.namaTokoTransaksi}</p>
        </div>
        {canEdit(row.createdAt) ? (
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)} className={`h-8 w-8 p-0 ${classes.hoverBg} flex-shrink-0`}>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </Button>
        ) : (
          <span className="text-xs text-slate-400 flex-shrink-0">🔒</span>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-2 text-xs pt-2 border-t ${classes.border}`}>
        {row.category !== "Curah" ? (
          <>
            <div><span className={classes.textSecondary}>Karton:</span><p className={`font-semibold ${classes.text}`}>{row.penjualanKarton}</p></div>
            <div><span className={classes.textSecondary}>Pack:</span><p className={`font-semibold ${classes.text}`}>{row.penjualanPcs}</p></div>
            <div><span className={classes.textSecondary}>Harga/Karton:</span><p className={classes.textSecondary}>Rp {row.hargaKarton.toLocaleString("id-ID")}</p></div>
            <div><span className={classes.textSecondary}>Harga/Pack:</span><p className={classes.textSecondary}>Rp {row.hargaPcs.toLocaleString("id-ID")}</p></div>
            <div><span className={classes.textSecondary}>Stock Pack:</span><p className={`font-medium ${row.stockPack < 10 ? 'text-red-500' : 'text-amber-600'}`}>{row.stockPack}</p></div>
            <div><span className={classes.textSecondary}>Stock Karton:</span><p className={`font-medium ${row.stockKarton < 5 ? 'text-red-500' : 'text-amber-600'}`}>{row.stockKarton}</p></div>
          </>
        ) : (
          <div className="col-span-2"><span className={classes.textSecondary}>Penjualan:</span><p className="font-semibold text-green-600">{row.penjualanGram}g</p></div>
        )}
      </div>

      {row.notes && (
        <div className={`text-xs pt-2 border-t ${classes.border} mt-2`}>
          <span className={classes.textSecondary}>Catatan:</span>
          <p className={`${classes.text} mt-1`}>{row.notes}</p>
        </div>
      )}

      <div className={`flex justify-between items-center pt-2 border-t ${classes.border} mt-2`}>
        <span className={`text-xs ${classes.textSecondary}`}>Total:</span>
        <span className="text-lg font-bold text-green-600">Rp {row.total.toLocaleString("id-ID")}</span>
      </div>
    </>
  )

  // ✅ FIX: EditFields juga dijadikan render function bukan component
  const renderEditFields = (row: SalesData) => {
    const today = new Date()
    const maxDate = today.toISOString().split('T')[0]
    const minDateObj = new Date(today)
    minDateObj.setDate(minDateObj.getDate() - 7)
    const minDate = minDateObj.toISOString().split('T')[0]
    
    const currentDateFormatted = new Date(row.tanggal).toLocaleDateString("id-ID", { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
    
    return (
      <div className="space-y-3">
        <div>
          <Label className={`text-xs ${classes.text} mb-1.5 block`}>
            📅 Tanggal Transaksi <span className="text-slate-400">(opsional)</span>
          </Label>
          <div className="relative">
            <input
              type="date"
              value={editForm.tanggal}
              onChange={(e) => setEditForm({ ...editForm, tanggal: e.target.value })}
              min={minDate}
              max={maxDate}
              className={`w-full h-9 px-3 pr-10 text-sm rounded-md border ${classes.inputBg} ${classes.text} cursor-pointer
                [&::-webkit-calendar-picker-indicator]:cursor-pointer
                [&::-webkit-calendar-picker-indicator]:opacity-0
                [&::-webkit-calendar-picker-indicator]:absolute
                [&::-webkit-calendar-picker-indicator]:w-full
                [&::-webkit-calendar-picker-indicator]:h-full
                [&::-webkit-calendar-picker-indicator]:left-0
                [&::-webkit-calendar-picker-indicator]:top-0
              `}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className={`flex items-center gap-2 mt-1.5 text-xs ${classes.textSecondary}`}>
            <span>Sekarang: <strong className={classes.text}>{currentDateFormatted}</strong></span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Maksimal 7 hari yang lalu
          </p>
        </div>
        
        <FormInput label="Penjualan Karton" type="number" field="penjualanKarton" placeholder={`Sekarang: ${row.penjualanKarton}`} editForm={editForm} setEditForm={setEditForm} inputBg={classes.inputBg} textClass={classes.text} />
        <FormInput label="Penjualan Pack" type="number" field="penjualanPcs" placeholder={`Sekarang: ${row.penjualanPcs}`} editForm={editForm} setEditForm={setEditForm} inputBg={classes.inputBg} textClass={classes.text} />
        <FormInput label="Harga/Karton" type="number" field="hargaKarton" placeholder={`Sekarang: ${row.hargaKarton}`} editForm={editForm} setEditForm={setEditForm} inputBg={classes.inputBg} textClass={classes.text} />
        <FormInput label="Harga/Pack" type="number" field="hargaPcs" placeholder={`Sekarang: ${row.hargaPcs}`} editForm={editForm} setEditForm={setEditForm} inputBg={classes.inputBg} textClass={classes.text} />
        <FormInput label="Stock Pack" type="number" field="stockPack" placeholder={`Sekarang: ${row.stockPack}`} editForm={editForm} setEditForm={setEditForm} inputBg={classes.inputBg} textClass={classes.text} />
        <FormInput label="Stock Karton" type="number" field="stockKarton" placeholder={`Sekarang: ${row.stockKarton}`} editForm={editForm} setEditForm={setEditForm} inputBg={classes.inputBg} textClass={classes.text} />
        
        <div>
          <Label className={`text-xs ${classes.text} mb-1.5 block`}>
            🏪 Nama Toko <span className="text-slate-400">(opsional)</span>
          </Label>
          <button
            type="button"
            onClick={() => setShowStoreSelectModal(true)}
            className={`w-full h-9 px-3 rounded-md border ${classes.inputBg} text-left flex items-center justify-between hover:border-purple-400 transition-colors text-sm`}
          >
            <span className={editForm.namaTokoTransaksi || row.namaTokoTransaksi ? classes.text : classes.textSecondary}>
              {editForm.namaTokoTransaksi || `Sekarang: ${row.namaTokoTransaksi}`}
            </span>
            <Store className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        <FormInput label="Catatan" field="notes" placeholder="Tambahkan catatan..." editForm={editForm} setEditForm={setEditForm} inputBg={classes.inputBg} textClass={classes.text} />
      </div>
    )
  }

  return (
    <>
      {/* Modal Pilih Toko */}
      {showStoreSelectModal && (
        <div 
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center ${classes.overlayBg} backdrop-blur-sm animate-in fade-in duration-200`}
          onClick={() => { setShowStoreSelectModal(false); setStoreSearchQuery("") }}
        >
          <div 
            className={`${classes.modalBg} rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 border-2 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[90vh] sm:max-h-[80vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b ${classes.border} flex items-center justify-between`}>
              <h3 className={`text-lg font-bold ${classes.text}`}>Pilih Nama Toko</h3>
              <button onClick={() => { setShowStoreSelectModal(false); setStoreSearchQuery("") }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  ref={storeSearchRef}
                  type="text"
                  placeholder="Cari nama toko..."
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  className={`w-full pl-10 h-11 px-3 py-2 text-sm border ${classes.inputBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loadingStores ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : filteredStores.length === 0 ? (
                <div className={`p-8 text-center ${classes.textSecondary}`}>
                  <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{storeSearchQuery ? "Toko tidak ditemukan" : "Belum ada toko di master"}</p>
                  <p className="text-xs mt-2">Hubungi admin untuk menambahkan toko</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStores.map((store, index) => (
                    <button
                      key={index}
                      onClick={() => handleStoreSelect(store)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        editForm.namaTokoTransaksi === store
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : `border-slate-200 dark:border-slate-700 ${isDark ? 'bg-slate-700/50' : 'bg-white'} hover:border-slate-300 dark:hover:border-slate-600`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                          <Store className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${classes.text} break-words`}>{store}</p>
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${classes.overlayBg} backdrop-blur-sm p-4`}>
          <div className={`${classes.modalBg} rounded-2xl shadow-2xl max-w-md w-full border-2`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className={`text-xl font-bold ${classes.text}`}>Berhasil! 🎉</h3>
                <p className={`text-sm ${classes.textSecondary}`}>{notifMessage}</p>
              </div>
              <Button onClick={() => setShowSuccessModal(false)} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${classes.overlayBg} backdrop-blur-sm p-4`}>
          <div className={`${classes.modalBg} rounded-2xl shadow-2xl max-w-md w-full border-2`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className={`text-xl font-bold ${classes.text}`}>Gagal Update ❌</h3>
                <p className={`text-sm ${classes.textSecondary}`}>{notifMessage}</p>
              </div>
              <Button onClick={() => setShowErrorModal(false)} className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <Card className={`border-0 shadow-xl ${classes.cardBg}`}>
        <CardHeader>
          <CardTitle className={classes.text}>Riwayat Transaksi</CardTitle>
          <CardDescription className={classes.textSecondary}>
            📝 Semua riwayat penjualan Anda dalam 30 hari terakhir<br />
            <span className="text-blue-500 font-medium">✏️ Bisa edit transaksi maksimal 7 hari setelah tanggal input</span>
            {salesData.length > 0 && <span className="ml-2 text-sm font-medium text-blue-600">• {filteredData.length} dari {salesData.length} transaksi</span>}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Filter Section */}
          <div className={`p-3 sm:p-4 rounded-lg ${classes.statBg} border ${classes.border} space-y-3`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <h3 className={`text-xs sm:text-sm font-semibold ${classes.text}`}>Filter Transaksi</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className={`text-xs ${classes.text} mb-1.5 block`}>🏪 Nama Toko</Label>
                <select value={filterToko} onChange={(e) => setFilterToko(e.target.value)} className={`w-full h-9 px-3 text-xs sm:text-sm rounded-md border ${classes.inputBg} ${classes.text}`}>
                  <option value="semua">Semua Toko ({uniqueToko.length})</option>
                  {uniqueToko.map(toko => <option key={toko} value={toko}>{toko}</option>)}
                </select>
              </div>

              <div>
                <Label className={`text-xs ${classes.text} mb-1.5 block`}>📦 Nama Produk</Label>
                <select value={filterProduk} onChange={(e) => setFilterProduk(e.target.value)} className={`w-full h-9 px-3 text-xs sm:text-sm rounded-md border ${classes.inputBg} ${classes.text}`}>
                  <option value="semua">Semua Produk ({uniqueProduk.length})</option>
                  {uniqueProduk.map(produk => <option key={produk} value={produk}>{produk}</option>)}
                </select>
              </div>
            </div>

            {(filterToko !== "semua" || filterProduk !== "semua") && latestStock && latestStock.category !== "Curah" && (
              <div className={`mt-3 p-3 rounded-lg border ${classes.border} ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                  <span className={`text-xs font-semibold ${classes.text}`}>📊 Stock Terakhir:</span>
                  <span className="text-xs text-slate-400">{new Date(latestStock.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center sm:text-left">
                    <span className={`${classes.textSecondary} block mb-1`}>Stock Pack:</span>
                    <p className={`font-bold text-xl sm:text-2xl ${latestStock.stockPack < 10 ? 'text-red-500' : 'text-green-600'}`}>{latestStock.stockPack}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className={`${classes.textSecondary} block mb-1`}>Stock Karton:</span>
                    <p className={`font-bold text-xl sm:text-2xl ${latestStock.stockKarton < 5 ? 'text-red-500' : 'text-green-600'}`}>{latestStock.stockKarton}</p>
                  </div>
                </div>
                {filterToko !== "semua" && filterProduk !== "semua" && (
                  <p className="text-xs text-blue-500 mt-2 text-center sm:text-left">💡 {filterProduk} di {filterToko}</p>
                )}
              </div>
            )}

            {(filterToko !== "semua" || filterProduk !== "semua") && (
              <Button size="sm" variant="outline" onClick={() => { setFilterToko("semua"); setFilterProduk("semua") }} className={`w-full h-9 text-xs ${isDark ? 'border-slate-600 hover:bg-slate-700' : ''}`}>
                🔄 Reset Filter
              </Button>
            )}
          </div>

          {/* Data Section */}
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
                  <div key={i} className={`p-4 rounded-lg ${classes.statBg} animate-pulse`}><div className="h-20" /></div>
                ))}
              </div>
            ) : filteredData.length === 0 ? (
              <div className={`text-center py-8 px-4 ${classes.textSecondary}`}>
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{salesData.length === 0 ? "Tidak ada data penjualan dalam 30 hari terakhir." : "Tidak ada transaksi yang sesuai dengan filter."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredData.map((row) => (
                  <div key={row.id} className={`${classes.cardBg} rounded-lg p-4 border ${classes.border}`}>
                    {editingId === row.id ? (
                      <div className={`space-y-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} p-3 rounded-lg -m-4`}>
                        {renderEditFields(row)}
                        
                        {editResult && (
                          <div className={`text-xs ${isDark ? 'bg-slate-700' : 'bg-white'} p-3 rounded-lg ${classes.border} border`}>
                            <div className="space-y-2">
                              <span className={`${classes.textSecondary} block`}>Preview Hasil Edit:</span>
                              <div className="flex justify-between">
                                <span className={classes.text}><strong>{editResult.karton}</strong> karton + <strong>{editResult.sisaPcs}</strong> pack</span>
                                <strong className="text-green-500">Rp {editResult.total.toLocaleString("id-ID")}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 h-9 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Simpan
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className={`flex-1 h-9 ${isDark ? 'border-slate-600 hover:bg-slate-700' : ''}`}>
                            <X className="w-4 h-4 mr-1" />Batal
                          </Button>
                        </div>
                        
                        <p className={`text-xs ${classes.textSecondary} italic text-center`}>💡 Isi hanya field yang ingin diubah, sisanya kosongkan</p>
                      </div>
                    ) : (
                      renderDataDisplay(row)
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}