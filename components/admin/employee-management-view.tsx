"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit2, Upload, CheckCircle2, Lock, Users, UserCheck, UserX, XCircle, UserPlus, Search, AlertTriangle, X } from "lucide-react"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  status: string
  joinDate: string
  userId?: string | null
  profilePhoto?: string | null
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface EmployeeManagementViewProps {
  theme: 'dark' | 'light'
}

export default function EmployeeManagementView({ theme }: EmployeeManagementViewProps) {
  const [showModal, setShowModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "SPG",
    status: "Aktif",
    joinDate: new Date().toISOString().split("T")[0],
    createAccount: false,
    password: "",
    changePassword: false,
    newPassword: "",
  })

  const isDark = theme === 'dark'
  const bgClass = isDark 
    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
    : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
  
  const cardBgClass = isDark
    ? 'bg-slate-800/50 border-slate-700/50'
    : 'bg-white border-slate-200'
  
  const textClass = isDark ? 'text-white' : 'text-slate-900'
  const textSecondaryClass = isDark ? 'text-slate-400' : 'text-slate-600'
  const inputBgClass = isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-300'
  const hoverBgClass = isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
  const tableHeaderBg = isDark ? 'bg-slate-700/50' : 'bg-slate-100'
  const tableRowBg = isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'
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
    fetchEmployees()
  }, [])

  useEffect(() => {
    let filtered = [...employees]
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(query) || 
        emp.email.toLowerCase().includes(query)
      )
    }
    
    filtered.sort((a, b) => a.name.localeCompare(b.name))
    
    setFilteredEmployees(filtered)
  }, [searchQuery, employees])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/employees/list")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setEmployees(data)
    } catch (err) {
      showToast("Gagal mengambil data karyawan", "error")
      console.error("Fetch employees error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEmployee = async () => {
    if (!formData.name || !formData.email) {
      showToast("Nama dan email harus diisi", "error")
      return
    }

    if (formData.createAccount && !formData.password && !editingId) {
      showToast("Password harus diisi jika membuat akun login", "error")
      return
    }

    if (editingId && formData.changePassword && !formData.newPassword) {
      showToast("Password baru harus diisi jika ingin reset password", "error")
      return
    }

    if (editingId && formData.changePassword && formData.newPassword.length < 6) {
      showToast("Password baru minimal 6 karakter", "error")
      return
    }

    setShowConfirmModal(true)
  }

  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    
    try {
      if (editingId) {
        const response = await fetch("/api/employees/create", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: formData.status,
            joinDate: formData.joinDate,
            changePassword: formData.changePassword,
            newPassword: formData.newPassword,
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Gagal memperbarui data karyawan")
        }
        
        const message = formData.changePassword 
          ? "Data karyawan dan password berhasil diperbarui!" 
          : "Data karyawan berhasil diperbarui!"
        showToast(message, "success")
        
      } else {
        const response = await fetch("/api/employees/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: formData.status,
            joinDate: formData.joinDate,
            createAccount: formData.createAccount,
            password: formData.password,
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Gagal menambahkan karyawan baru")
        }
        
        showToast("Karyawan baru berhasil ditambahkan!", "success")
      }
      
      handleCloseModal()
      await fetchEmployees()
      
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data", "error")
      console.error("Save employee error:", err)
    }
  }

  const handleChangePassword = async (userId: string) => {
    if (!passwordData.currentPassword) {
      showToast("Password saat ini harus diisi", "error")
      return
    }

    if (!passwordData.newPassword) {
      showToast("Password baru harus diisi", "error")
      return
    }

    if (passwordData.newPassword.length < 6) {
      showToast("Password baru minimal 6 karakter", "error")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Password baru tidak cocok dengan konfirmasi", "error")
      return
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(userId),
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Gagal mengubah password")
      }

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setShowPasswordModal(null)
      showToast("Password berhasil diubah!", "success")
      
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah password", "error")
    }
  }

  const handlePhotoUpload = async (employeeId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran file terlalu besar. Maksimal 5MB", "error")
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const photoUrl = e.target?.result as string

        const response = await fetch("/api/employees/upload-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId, photoUrl }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Gagal mengupload foto")
        }

        setShowPhotoUpload(null)
        await fetchEmployees()
        showToast("Foto profil berhasil diperbarui!", "success")
      }
      reader.readAsDataURL(file)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal mengupload foto profil", "error")
    }
  }

  const handleEditEmployee = (emp: Employee) => {
    setFormData({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      status: emp.status,
      joinDate: emp.joinDate,
      createAccount: false,
      password: "",
      changePassword: false,
      newPassword: "",
    })
    setEditingId(emp.id)
    setShowModal(true)
  }

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus = emp.status === "Aktif" ? "Non-Aktif" : "Aktif"
    const confirmMessage = emp.status === "Aktif" 
      ? "Nonaktifkan karyawan ini? Data penjualan akan tetap tersimpan."
      : "Aktifkan kembali karyawan ini?"
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch("/api/employees/create", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          status: newStatus,
          joinDate: emp.joinDate,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Gagal mengubah status karyawan")
      }
      
      await fetchEmployees()
      showToast(`Status karyawan berhasil diubah menjadi ${newStatus}`, "success")
      
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status", "error")
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      name: "",
      email: "",
      role: "SPG",
      status: "Aktif",
      joinDate: new Date().toISOString().split("T")[0],
      createAccount: false,
      password: "",
      changePassword: false,
      newPassword: "",
    })
  }

  const activeEmployees = employees.filter(e => e.status === 'Aktif').length
  const inactiveEmployees = employees.filter(e => e.status === 'Non-Aktif').length
  const employeesWithAccount = employees.filter(e => e.userId).length

  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="fixed top-20 right-6 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-5 duration-300 backdrop-blur-sm ${
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
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className={`relative overflow-hidden ${cardBgClass} border backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group rounded-xl`}>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textSecondaryClass} mb-1 uppercase tracking-wide`}>Total Karyawan</p>
                  <h3 className={`text-2xl font-bold ${textClass}`}>{employees.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className={`relative overflow-hidden ${cardBgClass} border backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group rounded-xl`}>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textSecondaryClass} mb-1 uppercase tracking-wide`}>Karyawan Aktif</p>
                  <h3 className={`text-2xl font-bold ${textClass}`}>{activeEmployees}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className={`relative overflow-hidden ${cardBgClass} border backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group rounded-xl`}>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textSecondaryClass} mb-1 uppercase tracking-wide`}>Nonaktif</p>
                  <h3 className={`text-2xl font-bold ${textClass}`}>{inactiveEmployees}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <UserX className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className={`relative overflow-hidden ${cardBgClass} border backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group rounded-xl`}>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs font-medium ${textSecondaryClass} mb-1 uppercase tracking-wide`}>Punya Akun</p>
                  <h3 className={`text-2xl font-bold ${textClass}`}>{employeesWithAccount}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Lock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {showPasswordModal && (
          <div className={`fixed inset-0 ${overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
            <div className={`${modalBg} border rounded-xl shadow-2xl max-w-md w-full overflow-hidden`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>Ubah Password</h3>
                    <p className={`text-sm ${textSecondaryClass}`}>Perlu password lama untuk verifikasi</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${textClass}`}>Password Saat Ini</label>
                    <input
                      type="password"
                      placeholder="Masukkan password saat ini"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${textClass}`}>Password Baru</label>
                    <input
                      type="password"
                      placeholder="Masukkan password baru"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${textClass}`}>Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      placeholder="Konfirmasi password baru"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => showPasswordModal && handleChangePassword(showPasswordModal)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition"
                    >
                      Simpan Password
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordModal(null)
                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                      }}
                      className={`px-4 py-2 ${inputBgClass} border ${textClass} hover:opacity-80 rounded-lg transition`}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPhotoUpload && (
          <div className={`fixed inset-0 ${overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
            <div className={`${modalBg} border rounded-xl shadow-2xl max-w-md w-full overflow-hidden`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>Upload Foto Profil</h3>
                    <p className={`text-sm ${textSecondaryClass}`}>JPG/PNG, maks 5MB</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => showPhotoUpload && handlePhotoUpload(showPhotoUpload, e)}
                    className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600`}
                  />
                  <button
                    onClick={() => setShowPhotoUpload(null)}
                    className={`w-full px-4 py-2 ${inputBgClass} border ${textClass} hover:opacity-80 rounded-lg transition`}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm animate-in fade-in duration-200 p-4`}
            onClick={handleCloseModal}
          >
            <div 
              className={`${modalBg} rounded-2xl shadow-2xl max-w-2xl w-full border-2 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {editingId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
                      </h3>
                      <p className="text-sm text-white/80 mt-0.5">
                        Lengkapi form data karyawan
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${textClass}`}>Nama Lengkap *</label>
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${textClass}`}>Email *</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${textClass}`}>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="SPG">SPG</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${textClass}`}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Cuti">Cuti</option>
                      <option value="Non-Aktif">Non-Aktif</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${textClass}`}>Tanggal Bergabung</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                {!editingId && (
                  <div className={`${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} p-4 rounded-xl border`}>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="createAccount"
                        checked={formData.createAccount}
                        onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label htmlFor="createAccount" className={`font-medium text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'} cursor-pointer`}>
                        Buat Akun Login Untuk Karyawan Ini
                      </label>
                    </div>
                    {formData.createAccount && (
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${textClass}`}>Password Login</label>
                        <input
                          type="password"
                          placeholder="Masukkan password untuk login"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <p className={`text-xs ${textSecondaryClass}`}>
                          Email login: <span className={`font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{formData.email || '(belum diisi)'}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {editingId && (
                  <div className={`${isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'} p-4 rounded-xl border`}>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="changePassword"
                        checked={formData.changePassword}
                        onChange={(e) => setFormData({ ...formData, changePassword: e.target.checked, newPassword: "" })}
                        className="w-4 h-4"
                      />
                      <label htmlFor="changePassword" className={`font-medium text-sm ${isDark ? 'text-purple-300' : 'text-purple-700'} cursor-pointer`}>
                        Reset Password Karyawan Ini (Admin)
                      </label>
                    </div>
                    {formData.changePassword && (
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${textClass}`}>Password Baru</label>
                        <input
                          type="password"
                          placeholder="Masukkan password baru"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className={`w-full px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        />
                        <p className={`text-xs ${textSecondaryClass}`}>
                          ⚠️ Password akan direset tanpa password lama
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEmployee}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition shadow-lg"
                  >
                    {editingId ? 'Update' : 'Simpan'} Karyawan
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className={`px-4 py-2 ${inputBgClass} border ${textClass} hover:opacity-80 rounded-lg transition`}
                  >
                    Batal
                  </button>
                </div>
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
                  <h3 className={`text-xl font-bold ${textClass}`}>Konfirmasi {editingId ? 'Update' : 'Simpan'}</h3>
                  <p className={`text-sm ${textSecondaryClass}`}>Pastikan data sudah benar sebelum menyimpan</p>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className={textSecondaryClass}>Nama:</span>
                      <span className={`font-semibold ${textClass} text-right`}>{formData.name}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className={textSecondaryClass}>Email:</span>
                      <span className={`font-semibold ${textClass} text-right truncate`}>{formData.email}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className={textSecondaryClass}>Role:</span>
                      <span className={`font-semibold ${textClass}`}>{formData.role}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className={textSecondaryClass}>Status:</span>
                      <span className={`font-bold ${formData.status === 'Aktif' ? 'text-green-500' : 'text-red-500'}`}>
                        {formData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className={`flex-1 px-4 py-2 ${inputBgClass} border ${textClass} hover:opacity-80 rounded-lg transition`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition"
                  >
                    Ya, {editingId ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${cardBgClass} border backdrop-blur-sm shadow-xl rounded-xl overflow-hidden relative`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textClass}`}>Daftar Karyawan</h3>
                  <p className={`text-sm ${textSecondaryClass}`}>Kelola semua SPG dan karyawan</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium transition shadow-lg w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                Tambah Karyawan
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama atau email karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 px-3 py-2 ${inputBgClass} border ${textClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-cyan-500 animate-spin-slow" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-12 h-12 text-white animate-bounce" />
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Memuat Karyawan
                </h3>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${borderClass} ${tableHeaderBg}`}>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Foto</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Nama</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Email</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Role</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Status</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Tgl Bergabung</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Akun</th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp, index) => (
                        <tr key={emp.id} className={`border-b ${borderClass} ${hoverBgClass} transition-colors ${index % 2 === 0 ? tableRowBg : ''}`}>
                          <td className="px-4 py-3">
                            {emp.profilePhoto ? (
                              <img src={emp.profilePhoto} alt={emp.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                {emp.name.charAt(0)}
                              </div>
                            )}
                          </td>
                          <td className={`px-4 py-3 font-medium ${textClass}`}>{emp.name}</td>
                          <td className={`px-4 py-3 ${textSecondaryClass}`}>{emp.email}</td>
                          <td className={`px-4 py-3 ${textSecondaryClass}`}>{emp.role}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              emp.status === "Aktif" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                              emp.status === "Cuti" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                              isDark ? "bg-slate-600/50 text-slate-400 border border-slate-600/50" : "bg-slate-200 text-slate-600 border border-slate-300"
                            }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className={`px-4 py-3 ${textSecondaryClass}`}>{emp.joinDate}</td>
                          <td className="px-4 py-3">
                            {emp.userId ? (
                              <div className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs">Aktif</span>
                              </div>
                            ) : (
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Belum</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEditEmployee(emp)}
                                className={`p-1.5 ${isDark ? 'hover:bg-blue-500/20' : 'hover:bg-blue-100'} rounded transition`}
                                title="Edit Data"
                              >
                                <Edit2 className="w-4 h-4 text-blue-400" />
                              </button>
                              <button
                                onClick={() => setShowPhotoUpload(emp.id)}
                                className={`p-1.5 ${isDark ? 'hover:bg-emerald-500/20' : 'hover:bg-emerald-100'} rounded transition`}
                                title="Upload Foto"
                              >
                                <Upload className="w-4 h-4 text-emerald-400" />
                              </button>
                              {emp.userId && (
                                <button
                                  onClick={() => setShowPasswordModal(emp.userId ?? null)}
                                  className={`p-1.5 ${isDark ? 'hover:bg-purple-500/20' : 'hover:bg-purple-100'} rounded transition`}
                                  title="Ubah Password"
                                >
                                  <Lock className="w-4 h-4 text-purple-400" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleStatus(emp)}
                                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                                  emp.status === "Aktif"
                                    ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                }`}
                              >
                                {emp.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <Users className={`w-16 h-16 ${isDark ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-3`} />
                          <p className={textSecondaryClass}>
                            {searchQuery ? 'Karyawan tidak ditemukan' : 'Belum ada karyawan'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
  )
}