"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit2, Upload, CheckCircle, Lock, X, Check } from "lucide-react"

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

// ==================== TOAST NOTIFICATION COMPONENT ====================
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className="bg-white rounded-lg shadow-2xl border-l-4 border-green-500 p-4 flex items-center gap-3 min-w-[300px] max-w-md">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Berhasil!</p>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default function EmployeeManagementView() {
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/employees/list")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setEmployees(data)
    } catch (err) {
      setError("Gagal mengambil data karyawan")
      console.error("Fetch employees error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEmployee = async () => {
    if (!formData.name || !formData.email) {
      setError("Nama dan email harus diisi")
      return
    }

    if (formData.createAccount && !formData.password && !editingId) {
      setError("Password harus diisi jika membuat akun login")
      return
    }

    if (editingId && formData.changePassword && !formData.newPassword) {
      setError("Password baru harus diisi jika ingin reset password")
      return
    }

    if (editingId && formData.changePassword && formData.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter")
      return
    }

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
        setToastMessage(message)
        
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
        
        setToastMessage("Karyawan baru berhasil ditambahkan!")
      }
      
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
      setEditingId(null)
      setShowForm(false)
      setError("")
      await fetchEmployees()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data")
      console.error("Save employee error:", err)
    }
  }

  const handleChangePassword = async (userId: string) => {
    setError("")
    
    if (!passwordData.currentPassword) {
      setError("Password saat ini harus diisi")
      return
    }

    if (!passwordData.newPassword) {
      setError("Password baru harus diisi")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Password baru tidak cocok dengan konfirmasi")
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

      setError("")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setShowPasswordModal(null)
      setToastMessage("Password berhasil diubah!")
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah password")
    }
  }

  const handlePhotoUpload = async (employeeId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 5MB")
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

        setError("")
        setShowPhotoUpload(null)
        await fetchEmployees()
        setToastMessage("Foto profil berhasil diperbarui!")
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupload foto profil")
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
    setShowForm(true)
    setError("")
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
      setToastMessage(`Status karyawan berhasil diubah menjadi ${newStatus}`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status")
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setError("")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ==================== TOAST NOTIFICATION ==================== */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* ==================== PASSWORD CHANGE MODAL ==================== */}
        {showPasswordModal && (
          <div className="bg-white rounded-lg shadow-lg border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Ubah Password (Karyawan)
              </h2>
              <p className="text-blue-100 text-sm mt-1">Memerlukan password lama untuk verifikasi</p>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Password Saat Ini</label>
                <input
                  type="password"
                  placeholder="Masukkan password saat ini"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Password Baru</label>
                <input
                  type="password"
                  placeholder="Masukkan password baru"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  placeholder="Konfirmasi password baru"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => showPasswordModal && handleChangePassword(showPasswordModal)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Simpan Password
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(null)
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                    setError("")
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PHOTO UPLOAD MODAL ==================== */}
        {showPhotoUpload && (
          <div className="bg-white rounded-lg shadow-lg border border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Foto Profil
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Pilih Foto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => showPhotoUpload && handlePhotoUpload(showPhotoUpload, e)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
                <p className="text-xs text-slate-600">Format: JPG, PNG. Ukuran maksimal: 5MB</p>
              </div>
              <button
                onClick={() => {
                  setShowPhotoUpload(null)
                  setError("")
                }}
                className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* ==================== FORM ADD/EDIT EMPLOYEE ==================== */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
              <h2 className="text-xl font-bold text-white">{editingId ? "Edit Karyawan" : "Tambah Karyawan Baru"}</h2>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Email *</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SPG">SPG</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Tanggal Bergabung</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {!editingId && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="createAccount"
                      checked={formData.createAccount}
                      onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="createAccount" className="font-medium text-sm cursor-pointer">
                      Buat Akun Login Untuk Karyawan Ini
                    </label>
                  </div>
                  {formData.createAccount && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Password Login</label>
                      <input
                        type="password"
                        placeholder="Masukkan password untuk login"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-600">
                        Karyawan akan bisa login dengan email: <span className="font-mono">{formData.email || '(belum diisi)'}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {editingId && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="changePassword"
                      checked={formData.changePassword}
                      onChange={(e) => setFormData({ ...formData, changePassword: e.target.checked, newPassword: "" })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="changePassword" className="font-medium text-sm cursor-pointer">
                      Reset Password Karyawan Ini (Admin)
                    </label>
                  </div>
                  {formData.changePassword && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Password Baru</label>
                      <input
                        type="password"
                        placeholder="Masukkan password baru"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-slate-600">
                        ⚠️ Password akan direset tanpa memerlukan password lama. Karyawan akan login dengan password baru ini.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveEmployee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  {editingId ? "Update" : "Tambah"} Karyawan
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== EMPLOYEE LIST TABLE ==================== */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Daftar Karyawan</h2>
              <p className="text-slate-300 text-sm">Kelola semua SPG dan karyawan</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Tambah Karyawan
              </button>
            )}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Foto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Nama</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tanggal Bergabung</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Akun Login</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            {emp.profilePhoto ? (
                              <img
                                src={emp.profilePhoto}
                                alt={emp.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {emp.name.charAt(0)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{emp.name}</td>
                          <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                          <td className="px-4 py-3 text-slate-600">{emp.role}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                emp.status === "Aktif"
                                  ? "bg-green-100 text-green-800"
                                  : emp.status === "Cuti"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{emp.joinDate}</td>
                          <td className="px-4 py-3">
                            {emp.userId ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Aktif</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">Belum</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditEmployee(emp)}
                                className="p-1.5 hover:bg-slate-100 rounded transition"
                                title="Edit Data"
                              >
                                <Edit2 className="w-4 h-4 text-slate-600" />
                              </button>
                              <button
                                onClick={() => setShowPhotoUpload(emp.id)}
                                className="p-1.5 hover:bg-blue-50 rounded transition"
                                title="Upload Foto"
                              >
                                <Upload className="w-4 h-4 text-blue-600" />
                              </button>
                              {emp.userId && (
                                <button
                                  onClick={() => setShowPasswordModal(emp.userId ?? null)}
                                  className="p-1.5 hover:bg-purple-50 rounded transition"
                                  title="Ubah Password (Perlu Password Lama)"
                                >
                                  <Lock className="w-4 h-4 text-purple-600" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleStatus(emp)}
                                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                                  emp.status === "Aktif"
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    : "bg-green-100 text-green-800 hover:bg-green-200"
                                }`}
                                title={emp.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                              >
                                {emp.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
                          Belum ada karyawan. Klik tombol "Tambah Karyawan" untuk menambahkan.
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
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}