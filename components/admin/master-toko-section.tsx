"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Store, CheckCircle2, XCircle, Search, X, MapPin, Phone } from "lucide-react"

interface Toko {
  id: number
  nama: string
  alamat?: string | null
  kontak?: string | null
  status: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface MasterTokoSectionProps {
  theme: 'dark' | 'light'
}

export default function MasterTokoSection({ theme }: MasterTokoSectionProps) {
  const [tokoList, setTokoList] = useState<Toko[]>([])
  const [filteredToko, setFilteredToko] = useState<Toko[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])

  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    kontak: "",
  })

  const isDark = theme === 'dark'
  const cardBgClass = isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
  const textClass = isDark ? 'text-white' : 'text-slate-900'
  const textSecondaryClass = isDark ? 'text-slate-400' : 'text-slate-600'
  const inputBgClass = isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-300'
  const hoverBgClass = isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
  const borderClass = isDark ? 'border-slate-700/50' : 'border-slate-200'
  const modalBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
  const overlayBg = isDark ? 'bg-black/70' : 'bg-black/50'

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3000)
  }

  useEffect(() => {
    fetchToko()
  }, [])

  useEffect(() => {
    let filtered = [...tokoList]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(toko => 
        toko.nama.toLowerCase().includes(query) || 
        (toko.alamat && toko.alamat.toLowerCase().includes(query))
      )
    }
    filtered.sort((a, b) => a.nama.localeCompare(b.nama))
    setFilteredToko(filtered)
  }, [searchQuery, tokoList])

  const fetchToko = async () => {
    try {
      setLoading(true)
      
      // ⚠️ TEMPORARY: Comment this out after API is ready
      // const mockData = [
      //   { id: 1, nama: "Toko Maju Jaya", alamat: "Jl. Sudirman No. 1", kontak: "081234567890", status: "Aktif" },
      //   { id: 2, nama: "Toko Sejahtera", alamat: "Jl. Thamrin No. 2", kontak: "081234567891", status: "Aktif" },
      // ]
      // setTokoList(mockData)
      // return
      
      const response = await fetch("/api/toko")
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ API Error:", response.status, errorText)
        throw new Error(`Gagal mengambil data (${response.status})`)
      }
      
      const result = await response.json()
      console.log("✅ Toko data:", result)
      setTokoList(result.data || [])
    } catch (err) {
      console.error("❌ Fetch toko error:", err)
      // Set empty array jika error, jangan crash
      setTokoList([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToko = async () => {
    if (!formData.nama.trim()) {
      showToast("Nama toko wajib diisi", "error")
      return
    }

    try {
      setSaving(true)
      const url = "/api/toko"
      const method = editingId ? "PUT" : "POST"
      const body = editingId 
        ? { id: editingId, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan toko")
      }
      
      // Show success message
      showToast(
        editingId 
          ? `✅ Toko "${formData.nama}" berhasil diperbarui!`
          : `✅ Toko "${formData.nama}" berhasil ditambahkan!`,
        "success"
      )
      
      handleCloseModal()
      await fetchToko()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleEditToko = (toko: Toko) => {
    setFormData({
      nama: toko.nama,
      alamat: toko.alamat || "",
      kontak: toko.kontak || "",
    })
    setEditingId(toko.id)
    setShowModal(true)
  }

  const handleDeleteToko = async (toko: Toko) => {
    if (!confirm(`Hapus toko "${toko.nama}"?\n\nData tidak dapat dikembalikan!`)) return

    try {
      setDeleting(toko.id)
      const response = await fetch(`/api/toko?id=${toko.id}`, { method: "DELETE" })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Gagal menghapus toko")
      }
      
      showToast(`✅ Toko "${toko.nama}" berhasil dihapus!`, "success")
      await fetchToko()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", "error")
    } finally {
      setDeleting(null)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ nama: "", alamat: "", kontak: "" })
  }

  const activeCount = tokoList.filter(t => t.status === 'Aktif').length

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-5 duration-300 backdrop-blur-sm min-w-[300px] ${
              toast.type === 'success' 
                ? 'bg-emerald-500/90 text-white border border-emerald-400/50' 
                : 'bg-red-500/90 text-white border border-red-400/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Stats Mini */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className={`${cardBgClass} border p-4 rounded-lg`}>
          <p className={`text-xs ${textSecondaryClass} mb-1`}>Total Toko</p>
          <p className={`text-2xl font-bold ${textClass}`}>{tokoList.length}</p>
        </div>
        <div className={`${cardBgClass} border p-4 rounded-lg`}>
          <p className={`text-xs ${textSecondaryClass} mb-1`}>Aktif</p>
          <p className={`text-2xl font-bold text-emerald-500`}>{activeCount}</p>
        </div>
        <div className={`${cardBgClass} border p-4 rounded-lg hidden sm:block`}>
          <p className={`text-xs ${textSecondaryClass} mb-1`}>Non-Aktif</p>
          <p className={`text-2xl font-bold text-orange-500`}>{tokoList.length - activeCount}</p>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm p-4`}
          onClick={handleCloseModal}
        >
          <div 
            className={`${modalBg} rounded-2xl shadow-2xl max-w-lg w-full border-2`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingId ? 'Edit Toko' : 'Tambah Toko'}
                </h3>
                <button onClick={handleCloseModal} className="p-1 hover:bg-white/20 rounded">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className={`text-sm font-medium ${textClass} block mb-1`}>Nama Toko *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg text-sm`}
                  placeholder="Toko Maju Jaya"
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${textClass} block mb-1`}>Alamat</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg text-sm`}
                  placeholder="Jl. Contoh No. 123"
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${textClass} block mb-1`}>Kontak</label>
                <input
                  type="text"
                  value={formData.kontak}
                  onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                  className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg text-sm`}
                  placeholder="08123456789"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveToko}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    editingId ? 'Update' : 'Simpan'
                  )}
                </button>
                <button
                  onClick={handleCloseModal}
                  disabled={saving}
                  className={`px-4 py-2 ${inputBgClass} border ${textClass} rounded-lg text-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari toko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 ${inputBgClass} border ${textClass} rounded-lg text-sm`}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} border-b ${borderClass}`}>
              <th className={`px-3 py-2 text-left text-xs font-semibold ${textSecondaryClass}`}>No</th>
              <th className={`px-3 py-2 text-left text-xs font-semibold ${textSecondaryClass}`}>Nama</th>
              <th className={`px-3 py-2 text-left text-xs font-semibold ${textSecondaryClass} hidden sm:table-cell`}>Alamat</th>
              <th className={`px-3 py-2 text-left text-xs font-semibold ${textSecondaryClass} hidden md:table-cell`}>Kontak</th>
              <th className={`px-3 py-2 text-center text-xs font-semibold ${textSecondaryClass}`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : filteredToko.length > 0 ? (
              filteredToko.map((toko, idx) => (
                <tr key={toko.id} className={`border-b ${borderClass} ${hoverBgClass}`}>
                  <td className={`px-3 py-2 ${textSecondaryClass}`}>{idx + 1}</td>
                  <td className={`px-3 py-2 ${textClass} font-medium`}>
                    <div className="flex items-center gap-2">
                      <Store className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{toko.nama}</span>
                    </div>
                  </td>
                  <td className={`px-3 py-2 ${textSecondaryClass} text-xs hidden sm:table-cell max-w-[150px] truncate`}>
                    {toko.alamat || "-"}
                  </td>
                  <td className={`px-3 py-2 ${textSecondaryClass} text-xs hidden md:table-cell`}>
                    {toko.kontak || "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => handleEditToko(toko)}
                        disabled={deleting === toko.id}
                        className={`p-1.5 ${isDark ? 'hover:bg-blue-500/20' : 'hover:bg-blue-100'} rounded disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteToko(toko)}
                        disabled={deleting === toko.id}
                        className={`p-1.5 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-100'} rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                        title="Hapus"
                      >
                        {deleting === toko.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center">
                  <Store className={`w-12 h-12 ${textSecondaryClass} mx-auto mb-2 opacity-50`} />
                  <p className={`${textSecondaryClass} text-sm`}>
                    {searchQuery ? 'Toko tidak ditemukan' : 'Belum ada toko'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}